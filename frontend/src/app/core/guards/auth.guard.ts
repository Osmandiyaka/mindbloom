/**
 * Compatibility bridge for legacy imports from '/core/guards/auth.guard'.
 * This file re-exports the auth guard from '/core/auth/auth.guard'.
 * 
 * New code should import from:
 *   import { authGuard } from '../auth/auth.guard';
 * 
 * Legacy code will continue to work with:
 *   import { authGuard } from '../guards/auth.guard';
 */

export { authGuard } from '../auth/auth.guard';
