# Phase 0 — Discovery & Constraints

## Frontend stack & login touchpoints
- **Framework:** Angular 17+ with standalone components and signal-based state (see `frontend/src/app/modules/auth/components/login-overlay/login-overlay.component.ts`).
- **Login surface:** `app-login-overlay` (rendered from `frontend/src/app/app.component.ts`) hosts the email/password form, validation, and interaction with `AuthService`. The legacy `LoginComponent` artifacts are already deleted.
- **Routing:** Login overlay is tied to `/login` via the shell routing module and sends the user into `/dashboard` or tenant-scoped destinations via `TenantPostLoginRouter` after success.

## Backend auth endpoints and flow
- `POST /api/auth/login` (accepts `{ email, password, tenantId? }`, returns JWT access, refresh token, user info, and memberships; sets `refresh_token` httpOnly cookie).
- `POST /api/auth/refresh` (reads refresh cookie, rotates token via `RefreshTokenUseCase`, responds with new access + cookie, revokes old record).
- `POST /api/auth/logout` (revokes refresh token via `LogoutUseCase` and clears cookie).
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/login-info` (protected by JWT + tenant guard), and `POST /api/auth/register` (used by tenant onboarding).

## Multi-tenant model overview
- **Workspace entity:** `Tenant` aggregate (`backend/src/domain/tenant/entities/tenant.entity.ts` and schema) carries `subdomain`, optional `customDomain`, `contactInfo`, feature flags, and optional `ssoConfig` metadata.
- **Membership:** Each `User` document (`backend/src/infrastructure/adapters/persistence/mongoose/schemas/user.schema.ts`) stores a `tenantId` and role references. Auth responses surface `memberships` so the UI knows which tenants the user can join.
- **Domain mapping:** `TenantResolutionService` resolves context by checking `x-tenant-id`, then custom domain (`TenantRepository.findByCustomDomain`), then `subdomain` (host header). There is no explicit tenant/domain discovery for login yet.

## Token/session mechanism
- Access tokens are JWTs issued via `TokenService.createAccessToken`; payload includes `sub`, `tenantId`, `roleId`, and role names. Refresh tokens are random 48-byte hex strings whose SHA-256 hashes are stored in Mongo (`RefreshTokenRepository`), enabling rotation.
- On login/refresh, the old refresh token record is revoked, a new hashed token stored, and a secure `refresh_token` httpOnly cookie scoped to `/api/auth` is set (strict `SameSite` in production).
- Sessions are hydrated client-side through `AuthService.normalizeLoginResponse`, persisted in `AuthStorage`, and drive `TenantPostLoginRouter` + RBAC initialization.

## Current auth flow (diagram)
1. User submits email+password in `LoginOverlayComponent`.
2. Frontend calls `AuthService.login`, which posts to `POST /auth/login`.
3. `LoginUseCase` validates password (tenant-scoped when provided), fetches user + tenant slug, returns tokens + memberships.
4. Frontend stores session, loads RBAC roles, and invokes `TenantPostLoginRouter` to pick the active tenant (auto-picks single tenant, remembers last, or routes via bootstrap service).
5. After tenant bootstrap, user is redirected to `/dashboard` or tenant-specific entrypoints.

## Tenant/workspace selection
- Selection happens **after** login through `TenantPostLoginRouter` + `TenantBootstrapService` (not during credential entry). For multi-tenant users, the router auto-selects when there is a single membership or tries restoring a previously stored tenant before cycling through available ones.

## SSO status
- `Tenant` documents can flag `ssoEnabled` and carry an `ssoConfig`, but there is no working backend route for OIDC/SAML, nor SSO buttons in the login UI. Authentication is currently password-only (no `tenant-discovery` or provider redirects).

## Error patterns & logging
- Authentication failures (`validatePassword` or missing user) always throw `UnauthorizedException('Invalid credentials')`, so the client shows a neutral “We couldn’t sign you in” error.
- Forgot/reset always reply with a success message regardless of whether the identifier exists, preventing enumeration.
- There is no dedicated audit or auth-specific logging; `LoginUseCase`/`RefreshTokenUseCase` do not emit structured logs (just exceptions), and there are no rate limiting/Brute force counters yet.
