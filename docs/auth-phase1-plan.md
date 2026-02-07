# Phase 1 Plan — Tenant-aware login UX

## Frontend changes (all under `frontend/src/app/modules/auth/components/login-overlay/*`)
1. **Two-step flow state:** Transform `LoginOverlayComponent` to drive a stepper (Step A: email entry, Step B: auth method overview). Replace single form submission with separate `emailState` and `authMethodsState`, and show skeleton branding while tenant discovery is in flight.
2. **Tenant discovery call:** Add a new service method in `AuthService` (`tenantDiscovery(email: string)` calling `GET /api/auth/tenant-discovery?email=`). Handle spinner, disable continue button, and surface loading placeholder for tenant name/logo.
3. **Workspace chooser:** If the discovery payload signals `matches > 1`, render a chooser list (logo + name) inside Step B so the user explicitly picks the tenant before entering credentials.
4. **Not your school link:** Step B card should include “Not your school?” that resets the flow back to Step A (clearing email and errors) so users can provide a different email.
5. **Auth method UI:** In Step B show tenant branding (name, logo) and buttons for each allowed method (password button show password field, SSO buttons to backend endpoints once available). For now, password method appears first, with placeholder SSO chips disabled until Phase 4.
6. **Copy revisions:** Update instructions to “Enter your school email to continue.” Replace “Create an organization” link with “IT Admin?” pointing to `/admin/onboarding` (Phase 5). Also remove redundant “Need help signing in?” from card footer if moved.
7. **Form behavior:** Ensure disabled buttons while loading, accessible markup (labels/ids), and existing caps-lock handler remains on Step B password entry.

## Backend stubs & future wiring
1. **Tenant discovery endpoint:** Introduce `GET /api/auth/tenant-discovery` (or `POST`) that accepts `email` query param, uses `TenantRepository` to look up by domain (`customDomain`, `subdomain`, domain table) or user memberships, and returns `{ match: 'none' | 'single' | 'multiple', tenants: [...] }` without revealing if user exists.
2. **Repositories:** Extend `TenantRepository` interface and Mongo implementation with domain lookup utilities (maybe new `TenantDomain` collection) and membership-based fallback.
3. **Rate limit placeholder:** Note that tenant discovery will later need rate limiting (Phase 2). For now, log attempts or wrap with simple in-memory counters.

## Hooks for later phases
- Document where to plug SSO buttons (Step B) once provider UI/back-end routes exist (Phase 4). Tier the UI so SSO buttons can be inserted based on discovery response.
- Plan to reuse the tenant discovery response for password reset/forgot flows later to pref-fill tenants (Phase 2+).
