/**
 * Compatibility bridge for legacy imports from '/core/interceptors/auth.interceptor'.
 * This file re-exports the auth interceptor from '/core/auth/auth.interceptor'.
 * 
 * New code should import from:
 *   import { authInterceptor } from '../auth/auth.interceptor';
 * 
 * Legacy code will continue to work with:
 *   import { authInterceptor } from '../interceptors/auth.interceptor';
 */

export { authInterceptor } from '../auth/auth.interceptor';
