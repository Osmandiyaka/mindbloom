# Task 1.2.1 — Integration Testing & Validation

## Pre-Integration Checklist

Before integrating with the backend, verify:

- [ ] Backend endpoint `/platform/tenants/resolve` is implemented
- [ ] Database contains test tenants with slugs (e.g., "st-marys", "greenfield")
- [ ] Backend validates `X-Tenant-Id` header on all tenant-scoped requests
- [ ] Swagger docs updated with new endpoint

---

## Manual Testing Scenarios

### Scenario 1: Successful Subdomain Resolution
**Prerequisites:**
- Backend running with test tenant "st-marys"
- DNS/hosts entry: `st-marys.yourdomain.local` → 127.0.0.1

**Steps:**
1. Navigate to `http://st-marys.yourdomain.local:4200/dashboard`
2. Should redirect to login (if not authenticated)
3. Log in with valid credentials
4. Dashboard loads with tenant context

**Expected Behavior:**
- Browser console shows: `Tenant resolved from subdomain: st-marys`
- API calls include header: `X-Tenant-Id: <uuid>`
- Sidebar/header displays tenant name ("St Mary's School")

**Assertions:**
```typescript
✓ TenantResolverService.tenant() returns { tenantId, tenantSlug: "st-marys", tenantName, ... }
✓ TenantResolverService.status() === 'ready'
✓ API calls to /api/students, etc. include X-Tenant-Id header
```

---

### Scenario 2: Path-Based Resolution Fallback
**Prerequisites:**
- Backend running with test tenant "greenfield"

**Steps:**
1. Navigate to `http://localhost:4200/t/greenfield/dashboard`
2. Should redirect to login
3. Log in
4. Dashboard loads

**Expected Behavior:**
- Browser console shows: `Tenant resolved from path: greenfield`
- X-Tenant-Id header present in requests

**Assertions:**
```typescript
✓ TenantResolverService.resolvedFrom === 'path'
✓ API headers include X-Tenant-Slug: greenfield
```

---

### Scenario 3: Invalid Tenant Slug (Not Found)
**Prerequisites:**
- Backend configured to return 404 for unknown slugs

**Steps:**
1. Navigate to `http://localhost:4200/t/invalid-school/dashboard`
2. Should NOT show dashboard (guard blocks it)
3. Should redirect to `/tenant-not-found`

**Expected Behavior:**
- Tenant Not Found page displays
- Title: "School Portal Not Found"
- Two buttons: "Back to Login", "Retry"
- No error message visible (graceful degradation)

**Assertions:**
```typescript
✓ URL is /tenant-not-found
✓ TenantResolverService.status() === 'not-found'
✓ TenantResolverService.tenant() === null
✓ No query params (?reason not set)
```

---

### Scenario 4: Network Error During Resolution
**Prerequisites:**
- Backend temporarily unavailable

**Steps:**
1. Kill backend service
2. Navigate to `http://localhost:4200/t/st-marys/dashboard`
3. Should redirect to tenant-not-found with error variant

**Expected Behavior:**
- Tenant Not Found page shows
- Title: "Connection Issue"
- Description: "We couldn't load the school portal right now..."
- "Retry" button is meaningful

**Assertions:**
```typescript
✓ URL is /tenant-not-found?reason=error
✓ TenantResolverService.status() === 'error'
✓ tenantGuard logs error to console
```

---

### Scenario 5: Public Routes (No Tenant Required)
**Prerequisites:**
- Test tenant available

**Steps:**
1. Navigate to `http://localhost:4200/login` (not authenticated)
2. Should load login page WITHOUT tenant resolution
3. Navigate to `http://localhost:4200/apply` (public)
4. Should load without tenant context

**Expected Behavior:**
- Login page loads immediately (no blocking)
- No tenant resolution attempt (no API call to resolve endpoint)
- TenantResolverService.status() remains 'idle'

**Assertions:**
```typescript
✓ Guard allows routes with data: { public: true }
✓ No POST /platform/tenants/resolve call made
✓ No X-Tenant-Id header on public API requests
```

---

### Scenario 6: Concurrent Navigation (Race Condition Protection)
**Prerequisites:**
- Network latency simulated (slow resolve endpoint)

**Steps:**
1. Rapidly click multiple dashboard links before tenant resolves
2. Should resolve tenant once, use cached result for all
3. All navigations complete using same tenant context

**Expected Behavior:**
- Only ONE POST /platform/tenants/resolve call in Network tab
- All concurrent guard activations wait on same promise
- TenantResolverService caches result

**Assertions:**
```typescript
✓ Single resolve API call despite multiple route activations
✓ All routes receive same TenantContext
✓ resolutionPromise is null after completion
```

---

### Scenario 7: Logout Clears Tenant
**Prerequisites:**
- User logged in with resolved tenant

**Steps:**
1. User navigates to dashboard (tenant resolved)
2. Click logout button
3. Redirected to login
4. Inspect TenantResolverService state

**Expected Behavior:**
- TenantResolverService.clearTenant() called on logout
- status resets to 'idle'
- tenant resets to null
- Next login flow resolves tenant fresh

**Assertions:**
```typescript
✓ AuthService.logout() calls tenantService.clearTenant()
✓ TenantResolverService.status() === 'idle' after logout
✓ TenantResolverService.tenant() === null
```

---

### Scenario 8: Tenant Headers on API Calls
**Prerequisites:**
- User logged in and tenant resolved

**Steps:**
1. Open DevTools Network tab
2. Navigate to Students page
3. Inspect HTTP requests to `/api/students`, `/api/academics`, etc.

**Expected Behavior:**
- All tenant-scoped requests include headers:
  ```
  X-Tenant-Id: <uuid>
  X-Tenant-Slug: st-marys
  X-Tenant-Context: {"tenantId":"...","tenantSlug":"st-marys","resolvedFrom":"subdomain"}
  ```
- Public requests (auth endpoints) do NOT include these headers

**Assertions:**
```typescript
✓ tenantContextInterceptor injects headers correctly
✓ Headers match resolved tenant context
✓ No tenant headers on /api/auth/*, /api/login, etc.
```

---

### Scenario 9: Browser Reload Preserves Auth but Re-resolves Tenant
**Prerequisites:**
- User logged in with resolved tenant

**Steps:**
1. Dashboard loaded, tenant resolved
2. Press F5 (browser refresh)
3. Page reloads

**Expected Behavior:**
- Auth restored from localStorage (fast)
- Tenant re-resolved from subdomain/path (blocking guard)
- Dashboard loads without user seeing error page

**Assertions:**
```typescript
✓ AuthService initializes first (before tenant)
✓ tenantGuard re-resolves on navigation
✓ Same tenant context as before refresh
✓ No flash of login page
```

---

### Scenario 10: Switching Subdomains (Logout + New School)
**Prerequisites:**
- Two test tenants: st-marys and greenfield

**Steps:**
1. Logged into st-marys: `http://st-marys.yourdomain.local:4200/dashboard`
2. Log out
3. Navigate to different subdomain: `http://greenfield.yourdomain.local:4200/dashboard`
4. Log in with greenfield credentials

**Expected Behavior:**
- Previous tenant context cleared
- New subdomain extracted correctly
- Tenant resolves to greenfield
- No cross-tenant data visible

**Assertions:**
```typescript
✓ tenantGuard re-resolves for new hostname
✓ TenantContext.tenantSlug === "greenfield"
✓ API calls use new tenant's ID
✓ No data leakage from st-marys session
```

---

## Automated Test Scenarios (Jest/Jasmine)

### Unit Tests

#### TenantResolverService Tests
```typescript
describe('TenantResolverService', () => {
  let service: TenantResolverService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TenantResolverService, provideHttpClient()]
    });
    service = TestBed.inject(TenantResolverService);
    http = TestBed.inject(HttpTestingController);
  });

  it('should resolve tenant by subdomain', async () => {
    spyOn(window.location, 'hostname').and.returnValue('st-marys.yourdomain.com');
    
    const promise = service.resolveTenant();
    
    const req = http.expectOne('/api/platform/tenants/resolve');
    expect(req.request.body.slug).toBe('st-marys');
    req.flush({ tenantId: '123', tenantSlug: 'st-marys', tenantName: 'St Mary' });
    
    const result = await promise;
    expect(result?.tenantSlug).toBe('st-marys');
  });

  it('should be idempotent', async () => {
    // First call
    const promise1 = service.resolveTenant();
    const req1 = http.expectOne('/api/platform/tenants/resolve');
    req1.flush({ tenantId: '123', tenantSlug: 'st-marys', tenantName: 'St Mary' });
    await promise1;

    // Second call should use cache
    const promise2 = service.resolveTenant();
    http.expectNone('/api/platform/tenants/resolve');
    const result = await promise2;
    expect(result?.tenantSlug).toBe('st-marys');
  });

  it('should set status to not-found on 404', async () => {
    spyOn(window.location, 'hostname').and.returnValue('localhost');
    spyOn(window.location, 'pathname').and.returnValue('/t/invalid/dashboard');
    
    const promise = service.resolveTenant();
    const req = http.expectOne('/api/platform/tenants/resolve');
    req.error(new ErrorEvent('Not Found'), { status: 404, statusText: 'Not Found' });
    
    const result = await promise;
    expect(result).toBeNull();
    expect(service.status()).toBe('not-found');
  });

  it('should set status to error on network error', async () => {
    // Setup...
    const promise = service.resolveTenant();
    const req = http.expectOne('/api/platform/tenants/resolve');
    req.error(new ErrorEvent('Network error'));
    
    const result = await promise;
    expect(service.status()).toBe('error');
  });

  it('should skip www subdomain', async () => {
    spyOn(window.location, 'hostname').and.returnValue('www.yourdomain.com');
    spyOn(window.location, 'pathname').and.returnValue('/');
    
    const promise = service.resolveTenant();
    http.expectNone('/api/platform/tenants/resolve');
    
    const result = await promise;
    expect(result).toBeNull();
    expect(service.status()).toBe('not-found');
  });
});
```

#### TenantGuard Tests
```typescript
describe('tenantGuard', () => {
  let service: TenantResolverService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [TenantResolverService, provideRouter([...])]
    }).compileComponents();
    
    service = TestBed.inject(TenantResolverService);
    router = TestBed.inject(Router);
  });

  it('should allow routes with public data', async () => {
    const route = { data: { public: true } } as any;
    const result = await tenantGuard(route, {} as any);
    expect(result).toBe(true);
  });

  it('should block unresolved routes and redirect to tenant-not-found', async () => {
    const route = { data: {} } as any;
    spyOn(service, 'resolveTenant').and.returnValue(Promise.resolve(null));
    service.status.set('not-found');
    spyOn(router, 'createUrlTree').and.returnValue({} as any);
    
    const result = await tenantGuard(route, {} as any);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/tenant-not-found']);
  });

  it('should allow resolved routes', async () => {
    const mockTenant: TenantContext = {
      tenantId: '123',
      tenantSlug: 'st-marys',
      tenantName: 'St Mary',
      resolvedFrom: 'subdomain'
    };
    const route = { data: {} } as any;
    spyOn(service, 'resolveTenant').and.returnValue(Promise.resolve(mockTenant));
    service.tenant.set(mockTenant);
    service.status.set('ready');
    
    const result = await tenantGuard(route, {} as any);
    expect(result).toBe(true);
  });
});
```

#### Interceptor Tests
```typescript
describe('tenantContextInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let service: TenantResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TenantResolverService,
        provideHttpClient(withInterceptors([tenantContextInterceptor]))
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(TenantResolverService);
  });

  it('should skip public endpoints', () => {
    http.get('/api/login').subscribe();
    const req = httpMock.expectOne('/api/login');
    expect(req.request.headers.has('X-Tenant-Id')).toBe(false);
    req.flush({});
  });

  it('should inject tenant headers on ready requests', () => {
    const mockTenant: TenantContext = {
      tenantId: '123',
      tenantSlug: 'st-marys',
      tenantName: 'St Mary',
      resolvedFrom: 'subdomain'
    };
    service.tenant.set(mockTenant);
    service.status.set('ready');

    http.get('/api/students').subscribe();
    const req = httpMock.expectOne('/api/students');
    expect(req.request.headers.get('X-Tenant-Id')).toBe('123');
    expect(req.request.headers.get('X-Tenant-Slug')).toBe('st-marys');
    req.flush({});
  });
});
```

---

## Performance Testing

### Load Test: Multiple Tenant Resolutions
```typescript
// Test that service handles 100 concurrent resolution requests efficiently
async testConcurrentResolutions() {
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(service.resolveTenant());
  }
  
  const start = performance.now();
  await Promise.all(promises);
  const duration = performance.now() - start;
  
  // Should make only 1 API call (cached)
  expect(http.match('/api/platform/tenants/resolve').length).toBe(1);
  // Should complete quickly (< 1 second)
  expect(duration).toBeLessThan(1000);
}
```

---

## Regression Testing Checklist

After integration, verify:

- [ ] Existing auth flows work (login/logout)
- [ ] Feature modules load correctly (students, library, etc.)
- [ ] Sidebar displays tenant name
- [ ] Theme switching still works
- [ ] Public routes (apply, login) accessible without tenant
- [ ] No console errors or warnings
- [ ] Network tab shows proper headers on API calls
- [ ] DevTools Storage shows tenant context (optional signal)
- [ ] No performance degradation (page load time)
- [ ] Mobile/responsive design preserved

---

## Summary

Test coverage ensures:
✅ Tenant resolves correctly from both subdomain and path  
✅ Error cases handled gracefully  
✅ Public routes bypass resolution  
✅ Concurrent requests handled safely  
✅ Tenant context propagated to all API calls  
✅ No data leakage between tenants  
✅ State cleaned on logout  

**Ready to test after backend endpoint implementation!**
