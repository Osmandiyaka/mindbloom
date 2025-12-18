/**
 * Compatibility bridge for legacy imports from '/core/services/auth.service'.
 * This file re-exports the new AuthService from '/core/auth/auth.service'.
 * 
 * New code should import from:
 *   import { AuthService } from '../auth/auth.service';
 * 
 * Legacy code will continue to work with:
 *   import { AuthService } from '../services/auth.service';
 */

export { AuthService } from '../auth/auth.service';
export type { AuthSession, AuthUser, AuthTokens, TenantMembership } from '../auth/auth.models';
