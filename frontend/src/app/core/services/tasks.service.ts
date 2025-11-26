import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TaskItem } from '../models/task.model';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TasksService {
    private base = `${environment.apiUrl}/tasks`;

    constructor(private http: HttpClient) { }

    getMyTasks(userId: string, roles: string[]): Observable<TaskItem[]> {
        const params = new HttpParams().set('userId', userId).set('roles', roles.join(','));
        return this.http.get<TaskItem[]>(`${this.base}/my-tasks`, { params }).pipe(map(this.mapTasks));
    }

    getMyActiveTasks(userId: string, roles: string[]): Observable<TaskItem[]> {
        const params = new HttpParams().set('userId', userId).set('roles', roles.join(','));
        return this.http.get<TaskItem[]>(`${this.base}/my-active-tasks`, { params }).pipe(map(this.mapTasks));
    }

    complete(taskId: string, userId: string, roles: string[]) {
        const params = new HttpParams().set('userId', userId).set('roles', roles.join(','));
        return this.http.post(`${this.base}/${taskId}/complete`, {}, { params });
    }

    start(taskId: string, userId: string, roles: string[]) {
        const params = new HttpParams().set('userId', userId).set('roles', roles.join(','));
        return this.http.post(`${this.base}/${taskId}/start`, {}, { params });
    }

    cancel(taskId: string, userId: string) {
        const params = new HttpParams().set('userId', userId);
        return this.http.post(`${this.base}/${taskId}/cancel`, {}, { params });
    }

    stats(userId: string, roles: string[]) {
        const params = new HttpParams().set('userId', userId).set('roles', roles.join(','));
        return this.http.get<{ totals: number; completed: number; overdue: number }>(`${this.base}/dashboard-stats`, { params });
    }

    private mapTasks(tasks: any): TaskItem[] {
        return (tasks || []).map((t: any) => ({
            ...t,
            id: t.id || t._id,
            createdDate: t.createdDate || t.createdAt,
            dueDate: t.dueDate,
            completedDate: t.completedDate,
        }));
    }
}
