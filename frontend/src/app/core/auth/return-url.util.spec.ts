import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { sanitizeReturnUrl } from './return-url.util';

describe('sanitizeReturnUrl', () => {
    let router: Router;
    const fallback = '/dashboard';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule]
        });
        router = TestBed.inject(Router);
    });

    it('returns fallback when raw value is missing', () => {
        expect(sanitizeReturnUrl(router, undefined, fallback)).toBe(fallback);
        expect(sanitizeReturnUrl(router, null, fallback)).toBe(fallback);
        expect(sanitizeReturnUrl(router, '   ', fallback)).toBe(fallback);
    });

    it('allows internal absolute paths', () => {
        const result = sanitizeReturnUrl(router, '/students?tab=active', fallback);
        expect(result).toBe('/students?tab=active');
    });

    it('rejects external urls', () => {
        expect(sanitizeReturnUrl(router, 'https://evil.com', fallback)).toBe(fallback);
        expect(sanitizeReturnUrl(router, 'HTTP://evil.com/path', fallback)).toBe(fallback);
    });

    it('rejects protocol-relative urls', () => {
        expect(sanitizeReturnUrl(router, '//evil.com', fallback)).toBe(fallback);
        expect(sanitizeReturnUrl(router, '\\evil.com', fallback)).toBe(fallback);
    });

    it('rejects javascript or data urls', () => {
        expect(sanitizeReturnUrl(router, 'javascript:alert(1)', fallback)).toBe(fallback);
        expect(sanitizeReturnUrl(router, 'data:text/html;base64,abc', fallback)).toBe(fallback);
    });

    it('rejects paths that do not start with a slash', () => {
        expect(sanitizeReturnUrl(router, 'students', fallback)).toBe(fallback);
    });

    it('rejects login routes to prevent loops', () => {
        expect(sanitizeReturnUrl(router, '/login', fallback)).toBe(fallback);
        expect(sanitizeReturnUrl(router, '/auth/login/password-reset', fallback)).toBe(fallback);
    });

    it('rejects invalid url structures', () => {
        expect(sanitizeReturnUrl(router, '/%E0%A4%A', fallback)).toBe(fallback);
    });
});
