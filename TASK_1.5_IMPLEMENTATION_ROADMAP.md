# Task 1.5 - User Management Workflows (Invite + Role Assignment)

## Overview
Implement two enterprise-grade user workflows as seamless, connected processes:
1. **Task 1.5.1**: Invite Workflow (Invite → Accept → Active)
2. **Task 1.5.2**: Role Assignment Workflow (Assign → Validate → Apply → Audit)

Together, these create a complete user onboarding and management system with audit trails and safeguards.

---

## Codebase Integration Map

### Existing Structures to Extend

| Component | Location | Purpose | Integration |
|-----------|----------|---------|------------|
| **UserService** | `frontend/src/app/core/services/user.service.ts` | Base user CRUD | Extend with invite endpoints |
| **RbacService** | `frontend/src/app/core/rbac/rbac.service.ts` | Permission evaluation | Use for role validation |
| **User List** | `frontend/src/app/modules/setup/pages/users/` | User management UI | Add invite + role assignment tabs |
| **AuthService** | `frontend/src/app/core/services/auth.service.ts` | Auth state | Check for token refresh on role change |
| **TenantService** | `frontend/src/app/core/services/tenant.service.ts` | Tenant context | Scope all invite/role operations |

### New Services to Create

| Service | Path | Responsibility |
|---------|------|-----------------|
| **UserInvitesService** | `frontend/src/app/core/services/user-invites.service.ts` | Invite lifecycle (create, resend, revoke, accept) |
| **UserRolesService** | `frontend/src/app/core/services/user-roles.service.ts` | Role assignment with safeguards |
| **AuditService** | `frontend/src/app/core/services/audit.service.ts` | Emit audit events for compliance |
| **PermissionHelperService** | `frontend/src/app/shared/services/permission-helper.service.ts` | Compute effective permissions + admin detection |

### New UI Components to Create

| Component | Path | Purpose |
|-----------|------|---------|
| **Invite Dialog** | `frontend/src/app/modules/setup/pages/users/invite-user-dialog/` | Invite user form + validation |
| **Invites List** | `frontend/src/app/modules/setup/pages/users/invites-list/` | Pending invites table with actions |
| **Accept Invite Page** | `frontend/src/app/pages/accept-invite/` | Public flow for invited users |
| **Role Assignment Modal** | `frontend/src/app/modules/setup/pages/users/role-assignment-modal/` | Multi-role selection + preview |
| **User Access Panel** | `frontend/src/app/modules/setup/pages/users/user-access-panel/` | Display roles + permissions + edit button |

---

## Task 1.5.1 — Invite Workflow

### Data Model
```typescript
// frontend/src/app/core/models/user-invite.model.ts

export type InviteStatus = 'INVITED' | 'ACCEPTED' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface UserInvite {
  id: string;
  tenantId: string;
  email: string;
  roleIds: string[];           // roles to assign on acceptance
  status: InviteStatus;
  invitedByUserId: string;
  invitedAt: string;           // ISO timestamp
  expiresAt?: string;          // ISO timestamp
  acceptedAt?: string;         // ISO timestamp
  revokedAt?: string;          // ISO timestamp
  revokedBy?: string;          // User who revoked
  token?: string;              // Public acceptance token (frontend only)
}
```

### Service Interface
```typescript
// UserInvitesService API

// Create invite
createInvite(email: string, roleIds: string[]): Observable<UserInvite>

// List pending invites for tenant
listInvites(status?: InviteStatus): Observable<UserInvite[]>

// Resend invite
resendInvite(inviteId: string): Observable<UserInvite>

// Revoke invite
revokeInvite(inviteId: string): Observable<UserInvite>

// Accept invite (public endpoint, uses token)
acceptInvite(token: string, profileData: { name: string }): Observable<{ user: User; sessionToken: string }>

// Validate token (for accept-invite page)
validateInviteToken(token: string): Observable<{ valid: boolean; email: string; expiresAt: string }>
```

### UI Workflows

#### 1. Admin Invites User (User List → Invite Dialog)
```
User clicks "Invite User" button
  ↓
Dialog opens:
  - Email input (with validation + duplicate check)
  - Role multi-select (from available roles)
  - "Send Invite" button
  ↓
On submit:
  - Call createInvite API
  - Show success toast
  - Close dialog
  - Refresh invites list
  - Emit audit: "invite_created"
```

#### 2. Admin Views Pending Invites (Invites List Tab)
```
Display table:
  Columns: Email | Roles | Status (chip) | Invited At | Expires At | Actions
  
Status chips:
  - INVITED (blue): Resend, Revoke buttons
  - EXPIRED (gray): Resend (creates new), Revoke buttons
  - ACCEPTED (green): "Awaiting activation", no actions
  - REVOKED (red): Grayed out, no actions

On Resend:
  - Call resendInvite API
  - Show success message
  - Refresh list

On Revoke:
  - Confirm dialog: "User will lose access"
  - Call revokeInvite API
  - Emit audit: "invite_revoked"
  - Refresh list
```

#### 3. Invited User Accepts Invite (Public Route)
```
User receives email with link: /accept-invite?token=xyz123
  ↓
Accept Invite page loads:
  - Validate token (API call)
  
  If invalid/expired/revoked:
    → Show "Invite is no longer valid" message
    → Link to "Contact admin"
    
  If valid:
    → Show form:
      - Tenant name (read-only, from token validation)
      - Name field (required)
      - Password field OR "Sign in with SSO" option
    
    On submit:
      - Call acceptInvite API with token + name + password
      - Emit audit: "invite_accepted"
      - Status changes to ACCEPTED
      - Auto-login OR redirect to /login with message "Please log in"
      - After login, show onboarding or redirect to /dashboard
```

### Guards & Access Rules

#### InviteAccept Route Guard
```typescript
// Routes: /accept-invite
// No auth guard required (public route)
// Component validates token, shows appropriate state

// After acceptance:
// - User is created with status ACCEPTED
// - User can log in but routes check for ACTIVE status
```

#### Tenant Route Guard Enhancement
```typescript
// In existing authGuard or tenantGuard:

// After session established, check:
if (currentUser.inviteStatus === 'ACCEPTED' && !fullyOnboarded) {
  // User has accepted but not yet fully active
  // Redirect to /onboarding or require confirmation
  // Routes should be accessible ONLY for dashboard + profile completion
}

// If inviteStatus === 'ACTIVE':
// User has full access per their roles
```

### Audit Events
```typescript
AuditService.track('invite_created', {
  invitedEmail: string;
  roleIds: string[];
  invitedByUserId: string;
  tenantId: string;
});

AuditService.track('invite_resent', {
  inviteId: string;
  email: string;
  tenantId: string;
});

AuditService.track('invite_revoked', {
  inviteId: string;
  email: string;
  revokedByUserId: string;
  tenantId: string;
});

AuditService.track('invite_accepted', {
  inviteId: string;
  userId: string;
  email: string;
  tenantId: string;
});
```

### Acceptance Criteria (Task 1.5.1)
- [ ] UserInvite type + service fully implemented
- [ ] School admin can invite user by email + roles
- [ ] Invite appears with INVITED status in list
- [ ] Invited user receives email (or can see invite link)
- [ ] Invited user can accept via /accept-invite?token=...
- [ ] Accepting invite changes status to ACCEPTED
- [ ] Admin can resend (creates new token) and revoke
- [ ] Invalid/expired invites show friendly error
- [ ] After acceptance, invited user redirects to login/onboarding
- [ ] All actions emit audit events
- [ ] No compilation errors

---

## Task 1.5.2 — Role Assignment Workflow

### Data Model
```typescript
// frontend/src/app/core/models/user-role-assignment.model.ts

export interface UserRoleAssignment {
  userId: string;
  tenantId: string;
  roleIds: string[];
  updatedAt: string;        // ISO timestamp
  updatedBy: string;        // User ID of admin who made change
  previousRoleIds: string[]; // For audit trail
}

// Re-use existing Role type from role.model.ts
export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  isAdminRole?: boolean;     // New field to add
  permissions: Permission[];
  // ... existing fields
}
```

### Service Interface
```typescript
// UserRolesService API

// Get roles for user
getUserRoles(userId: string): Observable<Role[]>

// Get all available roles
getAvailableRoles(): Observable<Role[]>

// Update user roles (with safeguard check)
updateUserRoles(userId: string, roleIds: string[]): Observable<UserRoleAssignment>

// Count admin users (for safeguard)
countAdminUsers(): Observable<{ count: number }>

// Get admin count by tenant (or use countAdminUsers)
canRemoveAdminRole(userId: string, currentRoleIds: string[], newRoleIds: string[]): Observable<{ canRemove: boolean; reason?: string }>

// Compute effective permissions for role set
getEffectivePermissions(roleIds: string[]): Observable<Permission[]>
```

### PermissionHelperService (Compute Admin Status)
```typescript
// PermissionHelperService

// Determine if a user (or roles) has admin access
isAdminUser(roleIds: string[]): boolean
  // Rule: check if any role has isAdminRole=true OR has permission starting with 'admin.*'

// Get all permissions across multiple roles (for preview)
getEffectivePermissionsSync(roles: Role[]): Permission[]

// Format permissions for display
formatPermissionSet(permissions: Permission[]): { resource: string; actions: string[] }[]
```

### UI Workflows

#### 1. User Details → Edit Roles (Modal)
```
In user-list.component:
  On row action "Edit Roles":
    → Open role-assignment-modal
    → Pass current user + current roles
    
In role-assignment-modal:
  Load available roles (with descriptions + permission count)
  
  Display:
    - Multi-select checkboxes for each role
    - "Effective permissions preview" showing merged permissions
    - "Last modified by X at Y" (from previous assignment)
    - Warning (if user is removing themselves from admin)
    
  On "Save":
    1. Check safeguard: canRemoveAdminRole()
       - If would leave zero admins:
         → Show blocking error modal:
           "Cannot proceed: This would remove the last admin.
            You must assign admin role to another user first."
         → Return to form (no close)
       - If safe: proceed
    
    2. Call updateUserRoles API
    
    3. Emit audit: "role_assignment_updated"
    
    4. On success:
       - If updated user is current user:
         → Show toast: "Your roles updated. Refreshing..."
         → Force token refresh (call AuthService.refreshToken())
         → Refresh nav (computed signals update automatically)
         → Keep modal open 2s then close
       - If updated user is another:
         → Show toast: "User roles updated. Changes take effect on next login"
         → Close modal
         → Refresh user list
```

#### 2. User Access Panel (In User Details)
```
Display:
  - Assigned Roles (as chips)
  - Effective Permissions (table: Resource | Actions)
  - "Last updated by [Admin Name] on [Date]"
  - "Edit Roles" button (if current user has users.manage permission)
  
Access Control:
  - Only show "Edit Roles" if current user has 'users:manage' permission
```

### Safeguard Logic
```typescript
// In UserRolesService.updateUserRoles or separate method:

async function enforceAdminSafeguard(
  userId: string, 
  newRoleIds: string[]
): Promise<{ safe: boolean; reason?: string }> {
  
  // Get the role being removed from this user
  const currentRoles = await getUserRoles(userId);
  const currentAdminRoles = currentRoles.filter(r => isAdminRole(r));
  const newAdminRoles = newRoleIds.filter(id => 
    isAdminRole(allRoles.find(r => r.id === id))
  );
  
  // If user is losing all admin roles
  if (currentAdminRoles.length > 0 && newAdminRoles.length === 0) {
    // Count other admin users in tenant
    const adminCount = await countAdminUsers();
    
    if (adminCount === 1) {
      // This is the only admin
      return {
        safe: false,
        reason: "This is the only admin user. You must assign admin role to another user first."
      };
    }
  }
  
  return { safe: true };
}
```

### Token Refresh on Role Change
```typescript
// After successful role update for current user:

if (updatedUserId === currentUser.id) {
  // Current user's roles changed
  await authService.refreshToken();
  
  // RbacService will automatically recompute permissions
  // NavFilterService computed signals will reactively update
  // Navigation will update without page reload
}
```

### Audit Events
```typescript
AuditService.track('role_assignment_updated', {
  userId: string;
  tenantId: string;
  previousRoleIds: string[];
  newRoleIds: string[];
  updatedByUserId: string;
  timestamp: string;
  safeguard: {
    checked: boolean;
    adminCount: number; // Before change
  };
});
```

### Acceptance Criteria (Task 1.5.2)
- [ ] UserRoleAssignment type + services implemented
- [ ] Admin can open role assignment modal from user list
- [ ] Modal shows available roles + effective permissions preview
- [ ] Safeguard: Cannot remove last admin (error + clear message)
- [ ] Role update calls API + emits audit
- [ ] If self-update: token refreshes, nav updates, no page reload
- [ ] If other user: toast says "Changes on next login"
- [ ] User access panel shows roles + permissions + edit button
- [ ] Permission helper computes effective perms correctly
- [ ] All audit events emit with correct payload
- [ ] No compilation errors

---

## Implementation Sequence

### Phase 1: Services & Models (Day 1)
1. Create `user-invite.model.ts` + `UserInvitesService`
2. Create `UserRolesService` + `PermissionHelperService`
3. Create `AuditService` (basic console logging for now)
4. Extend `UserService` with new endpoints
5. Update `Role` model with `isAdminRole` field

### Phase 2: UI Components (Day 2-3)
1. Create `invite-user-dialog` (form + validation)
2. Create `invites-list` (table with status chips + actions)
3. Create `role-assignment-modal` (multi-select + preview)
4. Create `user-access-panel` (display roles + permissions)
5. Add "Accept Invite" public page at `/accept-invite`

### Phase 3: Integration (Day 4)
1. Wire up invite dialog + list in user-list component
2. Wire up role assignment modal in user list row action
3. Add user-access-panel to user detail page
4. Test full workflows end-to-end
5. Verify audit events fire correctly

### Phase 4: Guards & Auth Flow (Day 5)
1. Update auth guard to check inviteStatus
2. Add onboarding redirect if ACCEPTED but not ACTIVE
3. Update RbacService session on role change
4. Verify token refresh triggers nav update

---

## Testing Strategy

### Unit Tests
```
UserInvitesService:
  ✓ Create invite with email validation
  ✓ Prevent duplicate invites same email
  ✓ Resend extends expiry
  ✓ Revoke changes status
  ✓ Accept changes status + returns user

UserRolesService:
  ✓ Get user roles
  ✓ Update roles
  ✓ Block removing last admin
  ✓ Emit audit events

PermissionHelperService:
  ✓ Detect admin from isAdminRole
  ✓ Compute effective permissions
  ✓ Format for display
```

### Integration Tests
```
Invite Workflow:
  ✓ Admin invites → INVITED status → List shows it
  ✓ Resend invite → New token issued
  ✓ User accepts → ACCEPTED → Can log in → Redirects onboarding

Role Assignment Workflow:
  ✓ Admin assigns roles → Audit fires
  ✓ Remove last admin → Error + can't save
  ✓ Update self → Token refreshes → Nav updates
  ✓ Update other → Toast shown
```

### Manual Testing Checklist
```
Invite Workflow:
  [ ] Send invite, check email link works
  [ ] Accept invite with all required fields
  [ ] Accept with missing name → validation error
  [ ] Accept expired token → friendly error
  [ ] Revoke invite → user can't accept anymore
  [ ] Resend → old token invalid, new token works

Role Assignment:
  [ ] Assign multiple roles to user
  [ ] Effective permissions preview shows all perms
  [ ] Remove admin from self → token refreshes → nav updates
  [ ] Remove admin from other user → next login applies
  [ ] Try remove last admin → blocked with reason
  [ ] Audit log shows all changes
```

---

## Branch Strategy
```
epic/1-users/invite-workflow
  └─ Implement Task 1.5.1

epic/1-users/role-assignment-workflow
  └─ Implement Task 1.5.2
  
main
  └─ Merge both when complete
```

---

## Summary
Tasks 1.5.1 and 1.5.2 create **complete user management workflows** that are:
- ✅ **Secure**: Safeguards (no removing last admin), audit trails
- ✅ **User-friendly**: Clear status, friendly errors, no dead links
- ✅ **Enterprise-grade**: Multi-role support, permission previews, token refresh
- ✅ **Integrated**: Built on existing services (Auth, RBAC, Tenant)
- ✅ **Auditable**: All changes tracked for compliance

Ready to implement when you give the signal!
