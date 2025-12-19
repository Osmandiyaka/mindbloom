# RBAC Permission Engine Implementation

## Task 1.3.1 - Permission Schema + Evaluation Engine

### Implementation Summary

Successfully implemented a deny-by-default permission evaluation engine with role aggregation for MindBloom's RBAC system.

---

## Core Components

### 1. Type Definitions (`permissions.types.ts`)

**PermissionKey**: String-based permission identifier
- Examples: `students.read`, `fees.invoice.create`, `attendance.mark`

**RoleDefinition**: Role with assigned permissions
- Fields: `id`, `name`, `description`, `permissions[]`, `isSystem`, `priority`

**UserSession**: User context for permission evaluation
- Fields: `userId`, `tenantId`, `roleIds[]`, `permissionOverrides?`
- Future-proof with allow/deny overrides (not yet implemented)

---

## 2. Permission Engine (`permission-engine.ts`)

**Pure, stateless evaluation engine** with static methods:

### Methods

**`buildGrantedPermissions(session, roles): Set<PermissionKey>`**
- Aggregates permissions from all user roles
- Returns Set for O(1) lookup performance
- Handles explicit allow overrides
- Deterministic (same inputs → same output)

**`can(permission, granted): boolean`**
- Deny-by-default check
- Returns true only if permission explicitly granted

**`canAny(permissions[], granted): boolean`**
- Returns true if ANY permission is granted

**`canAll(permissions[], granted): boolean`**
- Returns true if ALL permissions are granted

### Design Principles

✅ **Deny-by-default**: No permission unless explicitly granted  
✅ **Role aggregation**: Multiple roles merge permissions (union)  
✅ **Deterministic**: Same session + roles = same result  
✅ **Pure functions**: No side effects, easily testable  
✅ **Performance**: Set-based O(1) lookup  

---

## 3. RBAC Service (`rbac.service.ts`)

**Angular singleton service** managing permission state:

### Features

- **Reactive state** with BehaviorSubject
- **Computed permissions** via combineLatest
- **Cached Set** for synchronous access
- **Observable API** for reactive templates

### API

**State Management**
- `setSession(session)` - Set user session
- `setRoles(roles)` - Set role definitions
- `getSession()` - Get current session
- `getRoles()` - Get current roles
- `clear()` - Clear all state

**Synchronous Checks** (for guards/controllers)
- `can(permission): boolean`
- `canAny(permissions[]): boolean`
- `canAll(permissions[]): boolean`

**Observable Streams** (for templates)
- `can$(permission): Observable<boolean>`
- `canAny$(permissions[]): Observable<boolean>`
- `canAll$(permissions[]): Observable<boolean>`

**Debugging**
- `grantedPermissions(): ReadonlySet<PermissionKey>`

---

## 4. Permission Constants (`permission.constants.ts`)

### PERMISSIONS Object

Type-safe permission constants organized by domain:
```typescript
PERMISSIONS.students.read
PERMISSIONS.fees.invoice.create
PERMISSIONS.attendance.mark
PERMISSIONS.academics.grades.publish
```

### MOCK_ROLES Array

5 system roles for development:
1. **Admin** - Full system access (35 permissions)
2. **Teacher** - Academic and attendance (11 permissions)
3. **Accountant** - Financial management (7 permissions)
4. **Parent** - View child information (6 permissions)
5. **Student** - View own information (5 permissions)

⚠️ **TODO**: Replace with backend API endpoint

---

## 5. Integration (`auth.service.ts`)

### Integration Points

**On Login** - `setSession()` now calls `initializeRbac()`
- Extracts first tenant membership
- Builds RBAC session with userId/tenantId/roleIds
- Loads MOCK_ROLES (temporary)

**On Session Restore** - `init()` re-initializes RBAC

**On Logout** - `clearSession()` calls `rbacService.clear()`

### Current Limitation

Uses first membership from session:
```typescript
const currentTenant = session.memberships?.[0];
```

This will be updated when active tenant context is implemented (Task 1.2.x integration).

⚠️ **TODO**: 
- Replace MOCK_ROLES with backend API: `GET /api/rbac/roles/{tenantId}`
- Integrate with active tenant from TenantContextService

---

## Testing

### Test Coverage

**PermissionEngine Tests** (19 tests)
- ✅ Deny-by-default behavior
- ✅ Single role permission grants
- ✅ Multiple role aggregation
- ✅ Duplicate permission handling
- ✅ Permission override support
- ✅ Determinism across role order
- ✅ can/canAny/canAll logic

**RbacService Tests** (16 tests)
- ✅ Service creation
- ✅ Deny-by-default with null session
- ✅ Explicit grant permission
- ✅ Multiple role merging
- ✅ Overlapping permission deduplication
- ✅ Deterministic evaluation
- ✅ canAny/canAll methods
- ✅ Reactive API (can$)
- ✅ Observable updates on session change
- ✅ Clear state functionality

### Test Results
```
PermissionEngine: 19/19 PASSED
RbacService: 16/16 PASSED
Total: 35 tests, 0 failures
```

---

## Usage Examples

### In Components

```typescript
import { RbacService } from '@app/core/rbac/rbac.service';
import { PERMISSIONS } from '@app/core/rbac/permission.constants';

export class StudentListComponent {
    private rbac = inject(RbacService);
    
    canCreateStudent = this.rbac.can(PERMISSIONS.students.create);
    canDeleteStudent = this.rbac.can(PERMISSIONS.students.delete);
}
```

### In Templates

```html
@if (rbac.can(PERMISSIONS.students.write)) {
    <button (click)="editStudent()">Edit</button>
}

<!-- Reactive approach -->
@if (rbac.can$(PERMISSIONS.students.delete) | async) {
    <button (click)="deleteStudent()">Delete</button>
}
```

### In Guards

```typescript
export const studentWriteGuard: CanActivateFn = () => {
    const rbac = inject(RbacService);
    const router = inject(Router);
    
    if (rbac.can(PERMISSIONS.students.write)) {
        return true;
    }
    
    return router.createUrlTree(['/access-denied']);
};
```

---

## Acceptance Criteria

✅ **Deny-by-default**: No session or missing permission → denied  
✅ **Explicit grants**: Permission in role → allowed  
✅ **Role aggregation**: Multiple roles merge correctly  
✅ **Deterministic**: Same inputs always produce same result  
✅ **Tested**: 35 unit tests, 100% passing  
✅ **No new dependencies**: Uses only Angular + RxJS  
✅ **Integrated**: Connected to AuthService lifecycle  

---

## Architecture Decisions

### Why Pure Engine + Service Pattern?

**PermissionEngine (pure)**: 
- Easily testable without Angular
- Reusable in other contexts
- No side effects

**RbacService (stateful)**:
- Angular DI integration
- Reactive state management
- Convenient API for components

### Why Set-based Storage?

- O(1) lookup performance
- Natural deduplication
- Standard JS API

### Why Deny-by-default?

- Security best practice
- Fail-safe design
- Explicit is better than implicit

---

## Next Steps

### Immediate (Task 1.3.x continuation)

1. **Backend Integration**
   - Replace MOCK_ROLES with API endpoint
   - Add role CRUD operations
   
2. **Active Tenant Context**
   - Integrate with TenantContextService
   - Update RBAC session on tenant switch
   
3. **Permission Guards**
   - Create reusable permission guards
   - Add route-level permission enforcement

### Future Enhancements

1. **Deny Overrides**
   - Implement `session.permissionOverrides.deny`
   - Add conflict resolution logic
   
2. **Hierarchical Permissions**
   - Support wildcard patterns (e.g., `students.*`)
   - Add permission inheritance
   
3. **Audit Logging**
   - Track permission checks
   - Log access denied events
   
4. **Performance Optimization**
   - Cache permission checks
   - Lazy load role definitions

---

## Files Created

```
frontend/src/app/core/rbac/
├── permissions.types.ts         (56 lines) - Core type definitions
├── permission-engine.ts          (86 lines) - Pure evaluation logic
├── permission-engine.spec.ts    (213 lines) - Engine unit tests
├── rbac.service.ts              (131 lines) - Angular service
├── rbac.service.spec.ts         (326 lines) - Service unit tests
└── permission.constants.ts      (159 lines) - Constants & mock roles
```

**Total**: 6 files, 971 lines of code

## Files Modified

```
frontend/src/app/core/auth/auth.service.ts
- Added RbacService injection
- Added initializeRbac() method
- Updated setSession() to initialize RBAC
- Updated init() to restore RBAC state
- Updated clearSession() to clear RBAC
```

---

## Performance Metrics

- **Permission check**: O(1) Set lookup
- **Role aggregation**: O(n × m) where n = roles, m = avg permissions per role
- **Memory overhead**: ~100 bytes per permission string in Set
- **Typical session**: 3 roles × 10 permissions = 30 permissions = ~3KB

---

## Security Considerations

✅ **Deny-by-default** prevents accidental exposure  
✅ **No privilege escalation** through role merging (union only)  
✅ **Type-safe constants** prevent typos in permission strings  
✅ **Read-only access** to granted permissions (debugging)  
⚠️ **Client-side only** - Backend must validate all permissions  
⚠️ **JWT verification** - Ensure role claims are validated server-side

---

## Troubleshooting

### Issue: `can()` always returns false

**Check**:
1. Is session set? `rbacService.getSession()`
2. Are roles loaded? `rbacService.getRoles()`
3. Are role IDs correct? `session.roleIds`
4. Debug: `rbacService.grantedPermissions()`

### Issue: Observable not updating

**Check**:
1. Are you using `async` pipe in template?
2. Is the component in OnPush mode without marking for check?
3. Subscribe in ngOnInit, not constructor

### Issue: Performance slow with many roles

**Optimization**:
1. Reduce number of roles per user
2. Cache permission checks in components
3. Use synchronous API instead of observables

---

## Related Documentation

- [PLUGIN_ARCHITECTURE.md](../../PLUGIN_ARCHITECTURE.md) - Overall RBAC strategy
- [backend/docs/adr/001-multi-tenant-architecture.md](../../../backend/docs/adr/001-multi-tenant-architecture.md) - Tenant isolation
- Angular Standalone Components: https://angular.io/guide/standalone-components
- RxJS Operators: https://rxjs.dev/guide/operators

---

**Implementation Date**: December 19, 2025  
**Branch**: `epic/1-rbac/permission-engine`  
**Status**: ✅ Complete (Task 1.3.1)
