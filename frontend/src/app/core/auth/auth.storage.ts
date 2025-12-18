import { AuthSession, validateAuthSession } from './auth.models';

const STORAGE_KEY = 'eduhub.auth.session.v1';

/**
 * Persistent storage for AuthSession using localStorage.
 * All operations are try/catch safe.
 */
export class AuthStorage {
    /**
     * Reads and validates persisted session from localStorage.
     * Returns null if storage is empty, corrupted, or invalid.
     */
    static read(): AuthSession | null {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return null;

            const parsed = JSON.parse(stored);
            const validated = validateAuthSession(parsed);

            if (!validated) {
                // Corruption detected; clear storage
                this.clear();
                return null;
            }

            return validated;
        } catch (error) {
            console.error('[AuthStorage] Read error:', error);
            this.clear();
            return null;
        }
    }

    /**
     * Writes session to localStorage.
     * Silently fails if serialization error occurs.
     */
    static write(session: AuthSession): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch (error) {
            console.error('[AuthStorage] Write error:', error);
        }
    }

    /**
     * Clears session from localStorage.
     */
    static clear(): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('[AuthStorage] Clear error:', error);
        }
    }
}
