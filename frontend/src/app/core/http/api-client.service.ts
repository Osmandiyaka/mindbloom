import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
type ParamValue = string | number | boolean;

export interface ApiRequestOptions {
    params?: HttpParams | Record<string, ParamValue | ParamValue[] | null | undefined>;
    headers?: HttpHeaders | Record<string, string | string[]>;
    withCredentials?: boolean;
    responseType?: 'json';
    reportProgress?: boolean;
    timeoutMs?: number;
}

export interface ApiEventRequestOptions extends ApiRequestOptions {
    observe: 'events';
}

export interface ApiError {
    status: number;
    message: string;
    error?: any;
    url?: string;
    method?: string;
    original: HttpErrorResponse;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

    get<T>(path: string, options?: ApiRequestOptions) {
        return this.request<T>('GET', path, options);
    }

    post<T>(path: string, body?: any, options?: ApiRequestOptions) {
        return this.request<T>('POST', path, { ...options, body });
    }

    put<T>(path: string, body?: any, options?: ApiRequestOptions) {
        return this.request<T>('PUT', path, { ...options, body });
    }

    patch<T>(path: string, body?: any, options?: ApiRequestOptions) {
        return this.request<T>('PATCH', path, { ...options, body });
    }

    delete<T>(path: string, options?: ApiRequestOptions) {
        return this.request<T>('DELETE', path, options);
    }

    request<T>(method: HttpMethod, path: string, options: (ApiRequestOptions & { body?: any }) = {}): Observable<T> {
        const url = this.resolveUrl(path);
        const httpOptions = {
            body: options.body,
            params: this.toHttpParams(options.params),
            headers: this.toHttpHeaders(options.headers),
            withCredentials: options.withCredentials,
            responseType: options.responseType ?? 'json',
            reportProgress: options.reportProgress,
            observe: 'body',
        } as const;

        let request$ = this.http.request<T>(method, url, httpOptions);
        if (options.timeoutMs) {
            request$ = request$.pipe(timeout(options.timeoutMs));
        }

        return request$.pipe(
            catchError((err: unknown) => {
                const httpError = err instanceof HttpErrorResponse
                    ? err
                    : new HttpErrorResponse({ error: err, status: 0 });
                return throwError(() => this.normalizeError(httpError, method, url));
            })
        );
    }

    requestEvents<T>(method: HttpMethod, path: string, options: ApiEventRequestOptions & { body?: any }) {
        const url = this.resolveUrl(path);
        const httpOptions = {
            body: options.body,
            params: this.toHttpParams(options.params),
            headers: this.toHttpHeaders(options.headers),
            withCredentials: options.withCredentials,
            responseType: options.responseType ?? 'json',
            reportProgress: options.reportProgress,
            observe: 'events',
        } as const;

        let request$ = this.http.request<HttpEvent<T>>(method, url, httpOptions);
        if (options.timeoutMs) {
            request$ = request$.pipe(timeout(options.timeoutMs));
        }

        return request$.pipe(
            catchError((err: unknown) => {
                const httpError = err instanceof HttpErrorResponse
                    ? err
                    : new HttpErrorResponse({ error: err, status: 0 });
                return throwError(() => this.normalizeError(httpError, method, url));
            })
        );
    }

    private resolveUrl(path: string): string {
        const trimmed = path.trim();
        if (!trimmed) {
            return this.baseUrl;
        }
        if (/^https?:\/\//i.test(trimmed)) {
            return trimmed;
        }
        if (trimmed.startsWith('/')) {
            return trimmed;
        }
        return `${this.baseUrl}/${trimmed.replace(/^\/+/, '')}`;
    }

    private toHttpParams(params?: ApiRequestOptions['params']): HttpParams | undefined {
        if (!params) return undefined;
        if (params instanceof HttpParams) return params;
        let httpParams = new HttpParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined) return;
            if (Array.isArray(value)) {
                value.forEach((entry) => {
                    if (entry === null || entry === undefined) return;
                    httpParams = httpParams.append(key, String(entry));
                });
                return;
            }
            httpParams = httpParams.set(key, String(value));
        });
        return httpParams;
    }

    private toHttpHeaders(headers?: ApiRequestOptions['headers']): HttpHeaders | undefined {
        if (!headers) return undefined;
        if (headers instanceof HttpHeaders) return headers;
        let httpHeaders = new HttpHeaders();
        Object.entries(headers).forEach(([key, value]) => {
            httpHeaders = httpHeaders.set(key, value);
        });
        return httpHeaders;
    }

    private normalizeError(err: HttpErrorResponse, method: HttpMethod, url: string): ApiError {
        const message = err.error?.message || err.message || 'Request failed';
        return {
            status: err.status,
            message,
            error: err.error,
            url,
            method,
            original: err,
        };
    }
}
