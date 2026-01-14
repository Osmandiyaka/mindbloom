# Edition/Entitlement Redesign Task List

1) Define entitlements taxonomy + canonical registry
   - Add `entitlements.keys.ts` with module + feature keys
   - Add `entitlements.registry.ts` with canonical editions, validation, versioning
   - Validate registry on boot

2) Backend entitlements resolver + contract
   - Implement `EntitlementsService` + `TenantEditionSource`
   - Add `/api/entitlements/me` response contract
   - Update `/api/editions` to expose canonical editions (marketing + pricing)

3) Backend enforcement
   - Add `RequireModule` / `RequireFeature` decorators
   - Add `EntitlementGuard` and wire to protected controllers

4) Frontend entitlements integration
   - Add Entitlements service to load `/api/entitlements/me`
   - Load entitlements at app bootstrap
   - Update `moduleEntitlementGuard` to async check
   - Replace any edition hardcoding with entitlements snapshot

5) Tests + validation
   - Registry validation tests
   - Entitlements resolver tests
   - Guard tests (allow/deny)
