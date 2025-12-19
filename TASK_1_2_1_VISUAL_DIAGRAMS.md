# Task 1.2.1 — Visual Architecture & Flow Diagrams

## State Machine: TenantResolverService Lifecycle

```
                          ┌─────────┐
                          │  START  │
                          └────┬────┘
                               │
                               ▼
                        ╔═════════════╗
                        ║   idle      ║ ← Initialization
                        ║             ║ ← After clearTenant()
                        ╚═════┬═══════╝
                              │ resolveTenant()
                              ▼
                        ╔═════════════╗
                        ║  resolving  ║ ← API call in progress
                        ║             ║
                        ╚═════╤═══════╝
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ╔═════════════╗      ╔═════════════╗
            ║   ready     ║      ║  not-found  ║ ← Slug invalid/404
            ║             ║      ║             ║
            ║ (Cached)    ║      ╚═════╤═══════╝
            ╚═════╤═══════╝            │
                  │                    │
            resolveTenant()    redirectTo:
            returns cached      /tenant-not-found
            immediately
                                      ▲
                                      │
                            ┌─────────┘
                            │
                    ╔═════════════╗
                    ║   error     ║ ← Network failure
                    ║             ║
                    ╚═════╤═══════╝
                          │
                    redirectTo:
                    /tenant-not-found?reason=error
```

---

## Request Flow: Navigation → API Call

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to: st-marys.yourdomain.com/dashboard          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │ Router detects navigation │
        │ to protected route        │
        └────────────┬─────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │ authGuard executes        │
        │ ✓ User authenticated?     │
        │ ├─ YES → continue         │
        │ └─ NO → redirect /login   │
        └────────────┬─────────────┘
                     │ ✓
                     ▼
        ┌─────────────────────────────────┐
        │ tenantGuard executes (NEW)       │
        │ route.data.public?               │
        │ ├─ YES → allow without resolve   │
        │ └─ NO → await resolveTenant()    │
        └────────────┬────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │ TenantResolverService.resolveTenant()   │
        │                                        │
        │ 1. Check cache: status === 'ready'?    │
        │    ├─ YES → return tenant (fast)       │
        │    └─ NO → continue                    │
        │                                        │
        │ 2. Extract tenant slug from:           │
        │    ├─ Subdomain: st-marys.domain.com   │
        │    └─ Path: /t/st-marys/...            │
        │                                        │
        │ 3. POST /platform/tenants/resolve      │
        │    { slug: "st-marys" }                │
        │                                        │
        │ 4. Backend returns:                    │
        │    {                                   │
        │      tenantId: "uuid123",              │
        │      tenantSlug: "st-marys",           │
        │      tenantName: "St Mary's School",   │
        │      branding: { ... }                 │
        │    }                                   │
        │                                        │
        │ 5. Store in signal: tenant.set(...)    │
        │ 6. Set status.set('ready')             │
        │                                        │
        └────────┬─────────────────────────────┘
                 │
     ┌───────────┴───────────┐
     │ Resolution result      │
     │                        │
   ✓ │                    ✗ │
     │ (resolved)       (failed)
     │                        │
     ▼                        ▼
   ┌───┐               ┌──────────────┐
   │TRUE                │createUrlTree │
   │ (guard allows      │[/tenant-not- │
   │  navigation)       │   found]     │
   └────┬──────────────┘
        │               └──────┬──────┘
        │                      │
        ▼                      ▼
    Route navigates       Redirect to
    to component         /tenant-not-found page
    │                    (no further processing)
    │
    ▼
┌──────────────────────────┐
│ MainLayout component     │
│ renders (dashboard, etc) │
└────────────┬─────────────┘
             │
             ▼ (user clicks "Load Students")
┌─────────────────────────────────┐
│ HTTP Request: GET /api/students  │
└────────────┬────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ tenantContextInterceptor intercepts   │
│                                       │
│ public endpoint (auth, assets)?       │
│ ├─ YES → skip tenant headers          │
│ └─ NO → check tenant status           │
│                                       │
│ status === 'ready'?                   │
│ ├─ YES → inject headers:              │
│ │  • X-Tenant-Id: uuid123             │
│ │  • X-Tenant-Slug: st-marys          │
│ │  • X-Tenant-Context: {...}          │
│ │                                     │
│ └─ NO → throw HTTP 503 error          │
│        (prevent stale request)        │
└────────────┬────────────────────────┘
             │
             ▼
    Request sent to backend
    with tenant headers
             │
             ▼
┌──────────────────────────────────┐
│ Backend receives request          │
│ • Validates X-Tenant-Id header    │
│ • Filters students by tenant      │
│ • Returns tenant-scoped data      │
└────────────┬─────────────────────┘
             │
             ▼
    HTTP 200 response with
    students data (only for tenant)
             │
             ▼
┌──────────────────────────────────┐
│ Angular renders students list     │
│ (dashboard successfully loaded)   │
└──────────────────────────────────┘
```

---

## Subdomain vs Path Resolution Priority

```
┌──────────────────────────────────────┐
│ User navigates to URL                │
│ (any of these formats)               │
└────────┬─────────────────────────────┘
         │
         ├─ st-marys.yourdomain.com/dashboard
         ├─ yourdomain.com/t/st-marys/dashboard
         └─ yourdomain.com/st-marys/dashboard
         │
         ▼
┌─────────────────────────────────────────────┐
│ TenantResolverService._tryResolveBySubdomain │
│                                             │
│ Parse window.location.hostname              │
│ Extract first segment: "st-marys"           │
│                                             │
│ Skip reserved subdomains:                   │
│ www, mail, smtp, api, admin?                │
│ ├─ YES → skip to path resolution            │
│ └─ NO → continue                            │
│                                             │
│ Localhost or IP?                            │
│ ├─ YES → skip to path resolution            │
│ └─ NO → lookup "st-marys"                   │
└─────────────┬─────────────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
  ✓ │              ✗ │
  Found                Not Found
    │                    │
    ▼                    ▼ (continue)
return TenantContext  try path resolution
                      │
                      ▼
        ┌──────────────────────────────┐
        │ _tryResolveByPath()           │
        │                              │
        │ Parse window.location.path   │
        │ Extract segments:            │
        │ [0] = "t" or slug name       │
        │ [1] = actual slug (if [0]="t")
        │                              │
        │ Pattern 1: /t/:slug          │
        │ if (segments[0] === 't')     │
        │   slug = segments[1]         │
        │                              │
        │ Pattern 2: /:slug            │
        │ if (segments[0] not in       │
        │     known-routes)            │
        │   slug = segments[0]         │
        │                              │
        │ Lookup slug...               │
        └──────────┬───────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
       ✓ │              ✗ │
      Found            Not Found
         │                    │
         ▼                    ▼
    return TenantContext  status='not-found'
```

---

## Guard Execution Order (Guard Composability)

```
Route Definition:
{
  path: '',
  component: MainLayoutComponent,
  canActivate: [authGuard, tenantGuard],           ← Two guards
  canActivateChild: [authGuard, tenantGuard],
  children: [ { path: 'dashboard', ... } ]
}

Navigation Flow:

/dashboard
    │
    ├─ Check route: canActivate: [authGuard, tenantGuard]
    │
    ├─► authGuard executes
    │   ├─ Is user authenticated?
    │   │  ├─ YES → return true
    │   │  └─ NO → return router.createUrlTree(['/login'])
    │   │
    │   └─ [Returns immediately or redirects]
    │
    ├─► tenantGuard executes (only if authGuard passed)
    │   ├─ Is route public? (data.public === true)
    │   │  ├─ YES → return true
    │   │  └─ NO → await resolveTenant()
    │   │
    │   ├─ Tenant resolved successfully?
    │   │  ├─ YES → return true
    │   │  └─ NO → return router.createUrlTree(['/tenant-not-found'])
    │   │
    │   └─ [Returns immediately or redirects]
    │
    └─► Route can now activate (only if both guards return true)
        └─► Component renders

Guard Execution Rules:
✓ Guards execute left-to-right in order
✓ If any guard returns false or UrlTree, subsequent guards don't execute
✓ Child route guards inherit parent's guards
✓ Guards are re-evaluated on every navigation
✓ Async guards (like tenantGuard) block navigation until complete
```

---

## Service Signal State & Reactivity

```
Component requests tenant info:

┌──────────────────────────────────────┐
│ MyComponent {                         │
│   tenantService = inject(...)         │
│                                       │
│   readonly tenant = computed(() =>    │  ← Computed signal
│     this.tenantService.tenant()       │     (reactive)
│   );                                  │
│                                       │
│   readonly tenantName = computed(     │
│     () => this.tenant()?.tenantName   │  ← Auto-updates when
│   );                                  │     tenant() changes
│ }                                     │
└──────────────────────────────────────┘
                 │
                 │ Reads from:
                 │
                 ▼
┌──────────────────────────────────────────────┐
│ TenantResolverService {                      │
│                                              │
│   tenant = signal<TenantContext|null>(null)  │
│   status = signal<'idle'|...|'ready'>(...)   │
│                                              │
│   isReady = computed(() =>                   │  ← Derived
│     this.status() === 'ready'                │     (auto-updates)
│   );                                         │
│                                              │
│   isFailed = computed(() =>                  │
│     ['not-found', 'error'].includes(...)     │
│   );                                         │
│                                              │
│   async resolveTenant() {                    │
│     this.status.set('resolving');            │  ← Update status
│     const result = await api.call(...);      │
│     this.tenant.set(result);                 │  ← Update tenant
│     this.status.set('ready');                │  ← Signal subscribers
│   }                                          │     re-evaluate
│ }                                            │
└──────────────────────────────────────────────┘

Signal Propagation:

  TenantResolverService.tenant.set({...})
         │
         ▼ (signal updated)
  All subscribers notified
         │
         ├─► Component computed signal re-evaluates
         ├─► Template bindings re-render
         └─► Any effects watching signal execute

Zero boilerplate, fully reactive via Angular signals!
```

---

## HTTP Interceptor Chain

```
┌──────────────────────────────────────────────────────────┐
│ app.config.ts:                                           │
│ withInterceptors([authInterceptor, tenantContextInterceptor])
└────────────────┬─────────────────────────────────────────┘
                 │ Registration order
                 │ (executes left-to-right)
                 ▼
    ┌──────────────────────────┐
    │ 1. authInterceptor       │
    │                          │
    │ Injects JWT token:       │
    │ Authorization: Bearer... │
    └────────────┬─────────────┘
                 │ Passes request to next
                 │
                 ▼
    ┌────────────────────────────────┐
    │ 2. tenantContextInterceptor     │
    │                                │
    │ Check: is public endpoint?      │
    │ ├─ /api/auth/*       YES        │
    │ ├─ /api/login        YES        │
    │ ├─ /api/students     NO         │
    │ └─ /api/dashboard    NO         │
    │                                │
    │ If NO (tenant-scoped):          │
    │ ├─ Check status === 'ready'?    │
    │ │  ├─ YES: inject headers       │
    │ │  │  X-Tenant-Id: uuid         │
    │ │  │  X-Tenant-Slug: slug       │
    │ │  │  X-Tenant-Context: {...}   │
    │ │  │                            │
    │ │  └─ NO: block request         │
    │ │     throw HTTP 503            │
    │ │                              │
    │ └─ If YES (public): skip        │
    │                                │
    └────────────┬───────────────────┘
                 │ Passes request forward
                 │ (with augmented headers)
                 │
                 ▼
    ┌──────────────────────────┐
    │ HTTP Adapter             │
    │ (Angular HttpClient)     │
    │                          │
    │ Sends request to server  │
    └──────────────────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │ Network Request          │
    │ with all headers:        │
    │ Authorization: Bearer... │
    │ X-Tenant-Id: uuid        │
    │ X-Tenant-Slug: slug      │
    │ X-Tenant-Context: {...}  │
    │ Content-Type: app/json   │
    │ ...other headers...      │
    └──────────────────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │ Backend Receives         │
    │ Validates headers        │
    │ Filters by tenantId      │
    │ Returns response         │
    └────────────┬─────────────┘
                 │
                 ▼ (Response interceptors process backwards)
    ┌──────────────────────────┐
    │ Interceptor Chain        │
    │ (Response - right-to-left)
    │ 2. tenantContextInterceptor
    │ 1. authInterceptor       │
    └──────────────────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │ Angular HttpClient       │
    │ Delivers to subscriber   │
    └──────────────────────────┘
```

---

## Error Handling Flow

```
User navigates to: yourdomain.com/t/invalid-slug/dashboard

                     │
                     ▼
            ┌─────────────────────┐
            │ Route activate       │
            │ [authGuard,          │
            │  tenantGuard]        │
            └────────┬─────────────┘
                     │
                     ├─► authGuard: ✓ authenticated
                     │
                     ▼
            ┌─────────────────────┐
            │ tenantGuard runs     │
            │ Call resolveTenant() │
            └────────┬─────────────┘
                     │
                     ▼
        ┌───────────────────────────┐
        │ TenantResolver service    │
        │                           │
        │ 1. Extract slug: invalid  │
        │ 2. POST /platform/...     │
        │    { slug: "invalid" }    │
        │                           │
        │ 3. Backend returns 404    │
        │    (slug not found)       │
        │                           │
        │ 4. Catch error:           │
        │    status.set('not-found')│
        │    tenant.set(null)       │
        │    return null            │
        │                           │
        └────────┬─────────────────┘
                 │
                 ▼ (null returned)
        ┌──────────────────────────┐
        │ tenantGuard checks result │
        │                          │
        │ resolved === null?        │
        │ ├─ YES: status not-found  │
        │ └─ route.createUrlTree([  │
        │     '/tenant-not-found'   │
        │   ])                      │
        └────────┬──────────────────┘
                 │
                 ▼
        ┌──────────────────────────┐
        │ Router redirects to       │
        │ /tenant-not-found        │
        │ (guard returned UrlTree)  │
        └────────┬──────────────────┘
                 │
                 ▼
        ┌──────────────────────────┐
        │ TenantNotFoundComponent   │
        │ renders:                 │
        │                          │
        │ "School Portal Not Found" │
        │ "Check link or contact   │
        │  admin"                  │
        │                          │
        │ Buttons:                 │
        │ • Back to Login          │
        │ • Retry                  │
        └──────────────────────────┘

                    ▲
                    │
            Different error cases:
                    │
        ┌───────────┼───────────┐
        │           │           │
        │ 404       │ 500       │ Network timeout
        │ (not found)│ (error)  │ (error)
        │           │           │
        │ status:   │ status:   │ status:
        │ 'not-found'│ 'error'  │ 'error'
        │           │           │
        └───────────┼───────────┘
                    │
           Redirect to /tenant-not-found
           with ?reason=error for errors
           (no query param for not-found)
```

---

## Caching & Idempotency

```
First navigation:
  /t/st-marys/dashboard
        │
        ▼
  resolveTenant() called
        │
        ├─ status === 'idle'?
        │  ├─ YES: continue to resolve
        │  └─ NO: return cached
        │
        ▼
  API call: POST /platform/tenants/resolve
        │
        ▼
  Cache result in signal:
  tenant.set({ tenantId, slug: 'st-marys', ... })
  status.set('ready')
  └─ Promise resolved

Second navigation (same session):
  /t/st-marys/settings
        │
        ▼
  resolveTenant() called
        │
        ├─ status === 'idle'? NO
        │  status === 'ready'? YES
        │
        ├─ tenant exists? YES
        │
        ▼
  Return cached tenant immediately
  (no API call)
  └─ Promise resolved in microseconds

Third navigation (concurrent):
  Page loads: /dashboard
  User clicks: /students
  User clicks: /settings
  (all at same time)
        │
        ├─► resolveTenant() call 1
        │   └─ starts resolution
        │
        ├─► resolveTenant() call 2
        │   └─ sees resolution in progress
        │      └─ returns existing promise
        │
        ├─► resolveTenant() call 3
        │   └─ sees resolution in progress
        │      └─ returns existing promise
        │
        ▼ (all three wait on same promise)
  API call made ONCE
  └─ All three receive same result

resolutionPromise pattern prevents:
  ✓ Multiple simultaneous API calls
  ✓ Race conditions
  ✓ Duplicate work
```

---

## Summary

These diagrams show:

1. **State Machine** – Service lifecycle (idle → resolving → ready/error/not-found)
2. **Request Flow** – Complete navigation → resolution → rendering → API call
3. **Resolution Priority** – Subdomain first, path fallback
4. **Guard Execution** – How guards chain and make decisions
5. **Signal Reactivity** – How Angular signals enable zero-boilerplate reactive updates
6. **Interceptor Chain** – How both auth and tenant headers get injected
7. **Error Handling** – What happens when resolution fails
8. **Caching** – How idempotency and concurrent request protection work

All together, these patterns create a **clean, predictable, enterprise-grade tenant resolution system**. 🎯
