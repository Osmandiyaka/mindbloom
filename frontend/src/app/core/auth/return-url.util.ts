import { Router, UrlTree } from '@angular/router';

/**
 * Sanitizes a returnUrl string to prevent open redirect vulnerabilities.
 * Falls back to the provided default when the value is missing or unsafe.
 */
export function sanitizeReturnUrl(router: Router, raw: string | null | undefined, fallback: string): string {
    if (!raw) {
        return fallback;
    }

    const value = raw.trim();
    if (!value) {
        return fallback;
    }

    const lowered = value.toLowerCase();
    const isBad =
        lowered.startsWith('http:') ||
        lowered.startsWith('https:') ||
        lowered.startsWith('javascript:') ||
        lowered.startsWith('data:') ||
        lowered.startsWith('//') ||
        lowered.startsWith('\\');

    if (isBad) {
        return fallback;
    }

    if (!value.startsWith('/')) {
        return fallback;
    }

    const blockedPrefixes = ['/login', '/auth/login'];
    if (blockedPrefixes.some(prefix => value.startsWith(prefix))) {
        return fallback;
    }

    try {
        const tree: UrlTree = router.parseUrl(value);
        const serialized = router.serializeUrl(tree);
        if (!serialized.startsWith('/')) {
            return fallback;
        }
        return serialized;
    } catch {
        return fallback;
    }
}
