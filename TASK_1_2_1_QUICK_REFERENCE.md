# Task 1.2.1 Tenant Resolver — Developer Quick Reference

## What Was Implemented

A complete **tenant resolution system** that:
- Resolves tenant from **subdomain** (e.g., `st-marys.domain.com`) or **path** (e.g., `/t/st-marys/`)
- **Blocks navigation** until tenant is resolved (no "flash" of protected pages)
- **Injects tenant headers** on all API requests
- Shows **dedicated error page** if tenant not found
- Keeps **public routes** (login, signup) working without tenant

---

## File Structure

```
frontend/src/app/
├── core/
│   ├── tenant/                              ← NEW
│   │   ├── tenant.models.ts                 (Types: TenantContext, TenantBranding)
│   │   ├── tenant.service.ts                (Service: resolution logic)
│   │   └── tenant.guard.ts                  (Guard: route protection)
│   └── interceptors/
│       └── tenant-context.interceptor.ts    ← NEW (tenant header injection)
├── pages/
│   └── tenant-not-found/                    ← NEW
│       ├── tenant-not-found.component.ts
│       ├── tenant-not-found.component.html
│       └── tenant-not-found.component.scss
├── app.routes.ts                            (UPDATED: added tenant-not-found route, guards)
└── app.config.ts                            (UPDATED: new interceptor)
```

---

## How It Works

### 1. User Navigates to App
```
https://st-marys.domain.com/dashboard
        ↓
        Hits MainLayout route which requires [authGuard, tenantGuard]
```

### 2. Guards Activate
```
authGuard:
  ✓ User authenticated?
  └─→ YES: continue

tenantGuard:
  → Call TenantResolverService.resolveTenant()
  ├─→ SUCCESS: Set tenant context, allow navigation
  ├─→ NOT FOUND: Redirect to /tenant-not-found
  └─→ ERROR: Redirect to /tenant-not-found?reason=error
```

### 3. Tenant Resolved
```
TenantResolverService:
  1. Parse hostname → extract "st-marys"
  2. Call backend: POST /platform/tenants/resolve { slug: "st-marys" }
  3. Store: tenantId, tenantSlug, tenantName, branding
  4. Set status = 'ready'
```

### 4. API Calls Get Tenant Headers
```
HTTP Request to /api/students
      ↓
tenantContextInterceptor:
  ├─ Is this a public endpoint? NO
  ├─ Is tenant ready? YES
  └─ Add headers:
      X-Tenant-Id: abc123...
      X-Tenant-Slug: st-marys
      X-Tenant-Context: { tenantId, tenantSlug, resolvedFrom }
```

---

## Key Services & Guards

### TenantResolverService
```typescript
@Injectable({ providedIn: 'root' })
export class TenantResolverService {
  // Signals
  tenant = signal<TenantContext | null>(null);
  status = signal<'idle'|'resolving'|'ready'|'not-found'|'error'>('idle');

  // Methods
  async resolveTenant(): Promise<TenantContext | null>
  clearTenant(): void
}
```

**Usage in components:**
```typescript
export class MyComponent {
  tenantService = inject(TenantResolverService);
  
  constructor() {
    // Access tenant info
    const context = this.tenantService.tenant();
    const isReady = this.tenantService.isReady();
    const name = context?.tenantName;
  }
}
```

### tenantGuard
```typescript
export const tenantGuard: CanActivateFn = async (route, state) => {
  // Block until tenant resolved
  // Redirect to /tenant-not-found on failure
  // Allow routes with data: { public: true }
}
```

### tenantContextInterceptor
```typescript
export const tenantContextInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip public endpoints
  // Block tenant-scoped requests if tenant not resolved
  // Inject X-Tenant-Id, X-Tenant-Slug, X-Tenant-Context headers
}
```

---

## Testing Locally

### Method 1: Path-based (easiest)
```bash
npm run dev

# Visit:
http://localhost:4200/login              # Works (public)
http://localhost:4200/t/st-marys/dashboard    # Resolves tenant
http://localhost:4200/t/invalid/dashboard     # Shows tenant-not-found
```

### Method 2: Subdomain (optional)
```bash
# Update /etc/hosts
127.0.0.1 st-marys.localhost

# Visit:
http://st-marys.localhost:4200/dashboard
```

### Testing Error Cases
```
Invalid slug:    http://localhost:4200/t/nonexistent/dashboard
Network error:   Kill backend, navigate → shows ?reason=error variant
Missing auth:    http://localhost:4200/t/st-marys/dashboard (not logged in)
```

---

## Backend Integration

### Required Endpoint

```http
POST /platform/tenants/resolve
Content-Type: application/json

{
  "slug": "st-marys"
}
```

**Response (200 OK):**
```json
{
  "tenantId": "abc123...",
  "tenantSlug": "st-marys",
  "tenantName": "St Mary's School",
  "branding": {
    "logoUrl": "https://...",
    "primaryColor": "#4c51bf",
    "accentColor": "#f59e0b"
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Tenant not found",
  "statusCode": 404
}
```

### Expected Request Headers on API Calls

All tenant-scoped requests will include:
```
X-Tenant-Id: abc123...
X-Tenant-Slug: st-marys
X-Tenant-Context: {"tenantId":"abc123...","tenantSlug":"st-marys","resolvedFrom":"subdomain"}
```

Validate these on the backend and reject requests with missing/invalid tenant headers.

---

## Common Tasks

### Accessing Tenant in Component
```typescript
import { TenantResolverService } from '../core/tenant/tenant.service';

export class DashboardComponent {
  tenantService = inject(TenantResolverService);

  readonly tenant = computed(() => this.tenantService.tenant());
  readonly tenantName = computed(() => this.tenant()?.tenantName ?? 'Unknown');

  ngOnInit() {
    // Safely access tenant (always ready here because guard passed)
    console.log(this.tenant());
  }
}
```

### Adding a New Public Route
```typescript
{
  path: 'my-public-page',
  loadComponent: () => import(...).then(m => m.MyComponent),
  data: { public: true }  // ← Add this
}
```

### Clearing Tenant (Logout)
```typescript
export class AuthService {
  logout() {
    this.tenantService.clearTenant();
    this.router.navigate(['/login']);
  }
}
```

### Checking Tenant Status in Template
```typescript
export class MyComponent {
  tenantService = inject(TenantResolverService);
  
  readonly isReady = this.tenantService.isReady;
  readonly isFailed = this.tenantService.isFailed;
}
```

```html
<div *ngIf="isReady(); else loading">
  <!-- Tenant is ready, show content -->
</div>

<ng-template #loading>
  <p>Loading tenant...</p>
</ng-template>
```

---

## Troubleshooting

### "Tenant context not set" Error
**Cause:** Accessing `TenantResolverService.tenant()` before resolution completes  
**Fix:** Use computed signal with null check or wait for `status() === 'ready'`

### API Calls Not Including Tenant Headers
**Cause:** Interceptor runs before tenant resolves, or endpoint is public  
**Fix:** Check that `tenantGuard` ran first; verify endpoint is not in PUBLIC_ENDPOINTS list

### Blank Page with No Error
**Cause:** Guard blocking navigation, but no redirect  
**Fix:** Check browser DevTools → Network tab; ensure `/platform/tenants/resolve` endpoint exists

### Tenant Not Found Page Never Shows
**Cause:** Guard routing not working correctly  
**Fix:** Check that `TenantNotFoundComponent` is imported in `app.routes.ts`

---

## Architecture Notes

1. **Resolution is idempotent:** Calling `resolveTenant()` multiple times returns the same cached result
2. **Public routes are whitelist:** Must explicitly set `data: { public: true }` to skip guards
3. **Guards run in order:** `authGuard` → `tenantGuard` → route loads
4. **No feature module changes:** All protection at layout level (MainLayout)
5. **Service injected once:** `providedIn: 'root'` means single instance across app

---

## Future Enhancements

- [ ] Multi-tenant switcher (user has multiple school memberships)
- [ ] Branding application (logo, colors from tenant)
- [ ] Custom domain support (tenant.customDomain → tenantId)
- [ ] Tenant settings cache (avoid repeated API calls)
- [ ] Debug mode (`?debug=tenant` logs resolution steps)

---

**Questions?** See the full implementation summary in `TASK_1_2_1_TENANT_RESOLVER_IMPLEMENTATION.md`
