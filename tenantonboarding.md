Tenant Onboarding Progress

Frontend (complete)
- Added `/onboarding` route with a standalone onboarding screen and step indicator.
- Implemented 4-step flow: Organization → Schools → Edition → Review.
- Reused `TenantSettingsService`, `SchoolService`, `UserService`, `AuthService`, and the MindBloom UI components.
- Added local persistence via `TenantOnboardingService` with tenant-scoped storage.
- Implemented autosave on step transitions and a final redirect to the dashboard.

Backend (pending)
- Add onboarding state storage and API endpoints to persist progress server-side.
- Add admin bootstrap endpoint to create/invite the initial admin when needed.
- Add onboarding completion trigger to set tenant status active and emit audit events.
