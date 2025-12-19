# Task 1.5 - Implementation Checklist & Copilot Commands

## Pre-Implementation Setup

### Branch Creation
```bash
# Branch 1: Invite Workflow
git checkout -b epic/1-users/invite-workflow

# Branch 2: Role Assignment
git checkout -b epic/1-users/role-assignment-workflow
```

### Verify Existing Structures
- [ ] Confirm `UserService` exists at `frontend/src/app/core/services/user.service.ts`
- [ ] Confirm `RbacService` exists at `frontend/src/app/core/rbac/rbac.service.ts`
- [ ] Confirm `AuthService` exists with `refreshToken()` method
- [ ] Confirm `TenantService` exists
- [ ] Confirm users module exists at `frontend/src/app/modules/setup/pages/users/`
- [ ] Verify `Role` interface exists at `frontend/src/app/core/models/role.model.ts`

---

# Task 1.5.1 - Invite Workflow Implementation Checklist

## Phase 1: Models & Types

### Models to Create
- [ ] Create `frontend/src/app/core/models/user-invite.model.ts`
  ```typescript
  export type InviteStatus = 'INVITED' | 'ACCEPTED' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  
  export interface UserInvite {
    id: string;
    tenantId: string;
    email: string;
    roleIds: string[];
    status: InviteStatus;
    invitedByUserId: string;
    invitedAt: string;
    expiresAt?: string;
    acceptedAt?: string;
    revokedAt?: string;
    revokedBy?: string;
    token?: string; // frontend only
  }
  ```

## Phase 2: Services

### UserInvitesService
- [ ] Create `frontend/src/app/core/services/user-invites.service.ts`
  
**Copilot Prompt:**
```
Create UserInvitesService with these methods:
- createInvite(email: string, roleIds: string[]): Observable<UserInvite>
- listInvites(status?: InviteStatus): Observable<UserInvite[]>
- resendInvite(inviteId: string): Observable<UserInvite>
- revokeInvite(inviteId: string): Observable<UserInvite>
- acceptInvite(token: string, profileData: { name: string }): Observable<{ user: User; sessionToken: string }>
- validateInviteToken(token: string): Observable<{ valid: boolean; email: string; expiresAt: string }>

Endpoints:
- POST /tenants/{tenantId}/invites
- POST /tenants/{tenantId}/invites/{inviteId}/resend
- POST /tenants/{tenantId}/invites/{inviteId}/revoke
- GET /tenants/{tenantId}/invites
- POST /invites/accept
- POST /invites/validate

Use dependency injection (TenantService for tenantId, HttpClient for API).
```

### AuditService
- [ ] Create `frontend/src/app/core/services/audit.service.ts` (basic implementation)

**Copilot Prompt:**
```
Create AuditService that tracks user actions for compliance.

API:
- track(eventName: string, payload: any): void

Implementation:
- For now, console.log(eventName, payload)
- Prepare structure so backend integration is easy later

Events to support:
- invite_created
- invite_resent
- invite_revoked
- invite_accepted
- role_assignment_updated
```

## Phase 3: UI Components - Invite Dialog

### Invite User Dialog
- [ ] Create `frontend/src/app/modules/setup/pages/users/invite-user-dialog/invite-user-dialog.component.ts`

**Copilot Prompt:**
```
Create InviteUserDialog (standalone component) that:

1. Form Inputs:
   - Email field (required, email format, unique in tenant)
   - Role multi-select (checkboxes, from RolesService)
   - Validation messages

2. Validation:
   - Email format (built-in Angular validator)
   - Prevent duplicate invites (check invites list)
   - Show error messages inline

3. Submit:
   - Call UserInvitesService.createInvite()
   - Show loading spinner
   - On success: Toast "Invite sent to X", close dialog, emit success event
   - On error: Show error message, allow retry

4. Dialog Context:
   - Opened from user-list-page via button click
   - Pass tenantId via service (TenantService)
   - Close on escape, click outside, or success

5. Styling:
   - Use app-card or modal/dialog pattern
   - Buttons: "Send Invite" (primary), "Cancel" (secondary)
   - Match existing app theme
```

## Phase 4: UI Components - Invites List

### Invites List Table
- [ ] Create `frontend/src/app/modules/setup/pages/users/invites-list/invites-list.component.ts`

**Copilot Prompt:**
```
Create InvitesList (standalone component) that:

1. Data Display:
   - Fetch invites from UserInvitesService.listInvites()
   - Show table with columns:
     Email | Roles (chips) | Status (chip) | Invited At | Expires At | Actions

2. Status Chips (visual indicators):
   - INVITED → blue, label "Pending"
   - EXPIRED → gray, label "Expired"
   - ACCEPTED → green, label "Accepted"
   - ACTIVE → green, label "Active"
   - REVOKED → red, label "Revoked"

3. Actions Per Status:
   - INVITED: "Resend" button, "Revoke" button
   - EXPIRED: "Resend" button, "Revoke" button
   - ACCEPTED/ACTIVE: No actions shown
   - REVOKED: Disabled, no actions

4. Action Handlers:
   - Resend: Call UserInvitesService.resendInvite()
     → Show toast "Invite resent"
     → Emit audit event
     → Refresh list
   
   - Revoke: Show confirmation dialog
     → "User will not be able to accept this invite"
     → Call UserInvitesService.revokeInvite()
     → Emit audit event
     → Refresh list

5. Loading & Error States:
   - Loading spinner while fetching
   - Error banner if fetch fails
   - Empty state if no invites

6. Auto-refresh:
   - Refresh on component init
   - Show "Last refreshed at X" timestamp
   - Optional: Auto-refresh every 30s
```

## Phase 5: UI Components - Accept Invite Page

### Accept Invite Public Page
- [ ] Create `frontend/src/app/pages/accept-invite/accept-invite.component.ts` (public route, no auth guard)

**Copilot Prompt:**
```
Create public AcceptInvitePage (standalone) that:

1. Route:
   - /accept-invite?token=...
   - NO authGuard (public route)
   - Must be added to app.routes.ts BEFORE auth-guarded routes

2. Token Validation:
   - On init, extract token from query params
   - Call UserInvitesService.validateInviteToken(token)
   - Set state: loading

3. States & UI:

   A) Loading State:
      - Show spinner + "Validating invite..."

   B) Invalid/Expired/Revoked Token:
      - Show error card:
        "This invite is no longer valid"
        "Reason: [expired | revoked | invalid]"
        Link: "Contact your school admin"
      - No form shown

   C) Valid Token:
      - Show form with fields:
        - Tenant name (read-only, from token validation)
        - Name field (required, text input)
        - Password field (required, password input, strength indicator optional)
        - Checkbox: "I agree to terms" (optional)
        - Button: "Complete Setup" (primary)
        - Link: "Need help?" (secondary)
      
      - Form validation:
        - All fields required
        - Password min 8 chars
        - Show validation errors inline

4. Form Submit:
   - Call UserInvitesService.acceptInvite(token, { name })
   - Show loading state
   - On success:
     - Emit audit event (via service)
     - Option A: Store sessionToken, auto-login, redirect to /dashboard
     - Option B: Redirect to /login with message "Please log in"
       (Check what AuthService supports)
   - On error:
     - Show error message
     - Allow retry

5. Styling:
   - Center card on page
   - Public/unauthenticated theme (no sidebar, no nav)
   - Match login page styling

6. Responsive:
   - Mobile-friendly form
   - Full width on small screens
```

## Phase 6: Integration - User List Updates

### Update user-list-page
- [ ] Add "Invite User" button in header
- [ ] Add "Pending Invites" tab (or separate section)
- [ ] Integrate InviteUserDialog (import + open on button click)
- [ ] Integrate InvitesList component

**Copilot Prompt:**
```
Update user-list-page component to:

1. Header:
   - Add button "Invite User" (primary, + icon)
   - On click: Open InviteUserDialog
   - After dialog closes with success: Refresh lists

2. Add Tabs or Sections:
   Option A (Tabs):
   - Tab 1: "Active Users" (existing user list)
   - Tab 2: "Pending Invites" (new invites-list component)
   
   Option B (Sections):
   - Section 1: "Users" (with user list)
   - Section 2: "Pending Invites" (with invites-list)

3. Dialog Integration:
   - Import InviteUserDialog
   - Create component property or use MatDialog/custom dialog service
   - Pass tenantId from TenantService
   - Listen for success event → refresh invites list

4. Permissions:
   - Show "Invite User" button only if user has 'users.invite' permission
   - Check via AuthorizationService.can('users.invite')

5. Layout:
   - Keep existing styling
   - New sections should match existing design
```

## Phase 7: Routes & Guards

### Update app.routes.ts
- [ ] Add public route for /accept-invite (NO authGuard)

**Routes:**
```typescript
{
  path: 'accept-invite',
  loadComponent: () => import('./pages/accept-invite/accept-invite.component')
    .then(m => m.AcceptInviteComponent),
  data: { public: true }
}
```

- [ ] Ensure this route is placed BEFORE auth-guarded routes

### Update Auth Guards
- [ ] Check `authGuard` or similar for handling invited users
  
**Copilot Prompt:**
```
Review auth/tenant guards and make these updates:

1. After user session established, check:
   - Does user have inviteStatus or similar field?
   - If inviteStatus === 'ACCEPTED' (not yet ACTIVE):
     → Allow limited routes (dashboard, onboarding)
     → Block tenant-specific routes with "Complete onboarding" message
   
2. If first login after accepting invite:
   - Update status to ACTIVE automatically (backend does this)
   - On next session, user has full access

3. Update guard logic or create new:
   - const invitedUserGuard: CanActivateFn = (route, state) => {
       const auth = inject(AuthService);
       const user = auth.currentUser();
       if (user?.inviteStatus === 'ACCEPTED') {
         // Restrict to onboarding routes only
         if (route.data?.['requiresInviteAcceptance']) {
           return true;
         }
         return router.createUrlTree(['/onboarding']);
       }
       return true;
     }

4. On user routes that require full access, add:
   canActivate: [authGuard, tenantGuard, invitedUserGuard]
```

## Phase 8: Testing

### Unit Tests
- [ ] `user-invites.service.spec.ts` - 8-10 tests
  - Create invite
  - List invites
  - Resend invite
  - Revoke invite
  - Accept invite
  - Validate token

- [ ] `invite-user-dialog.spec.ts` - 5-7 tests
  - Form validation (email, roles)
  - Prevent duplicate emails
  - Submit success + error

- [ ] `invites-list.spec.ts` - 6-8 tests
  - Display invites with correct status
  - Resend action
  - Revoke action
  - Refresh on init

- [ ] `accept-invite.component.spec.ts` - 8-10 tests
  - Valid token → show form
  - Invalid token → show error
  - Form submit success
  - Form submit error

### Integration Tests
- [ ] Full invite workflow: create → list → accept

### Manual Testing Checklist
- [ ] Invite user, check email received
- [ ] Click accept link, see form
- [ ] Submit form, become active user
- [ ] Admin resends invite, old link invalid
- [ ] Admin revokes invite, user can't accept
- [ ] Expired invite shows error
- [ ] Audit events appear in console/logs

---

# Task 1.5.2 - Role Assignment Workflow Implementation Checklist

## Phase 1: Models & Services

### Models (Update existing)
- [ ] Update `Role` interface in `frontend/src/app/core/models/role.model.ts`
  - Add field: `isAdminRole?: boolean`

- [ ] Create `frontend/src/app/core/models/user-role-assignment.model.ts`
  ```typescript
  export interface UserRoleAssignment {
    userId: string;
    tenantId: string;
    roleIds: string[];
    updatedAt: string;
    updatedBy: string;
    previousRoleIds?: string[];
  }
  ```

## Phase 2: Services

### UserRolesService
- [ ] Create `frontend/src/app/core/services/user-roles.service.ts`

**Copilot Prompt:**
```
Create UserRolesService with:

Methods:
- getUserRoles(userId: string): Observable<Role[]>
- getAvailableRoles(): Observable<Role[]>
- updateUserRoles(userId: string, roleIds: string[]): Observable<UserRoleAssignment>
- countAdminUsers(): Observable<{ count: number }>
- canRemoveAdminRole(userId: string, currentRoleIds: string[], newRoleIds: string[]): Observable<{ canRemove: boolean; reason?: string }>
- getEffectivePermissions(roleIds: string[]): Observable<Permission[]>

Endpoints:
- GET /tenants/{tenantId}/roles
- GET /tenants/{tenantId}/users/{userId}/roles
- PUT /tenants/{tenantId}/users/{userId}/roles
- GET /tenants/{tenantId}/roles/admin/count
- GET /tenants/{tenantId}/roles/{roleIds}/effective-permissions

Implementation Notes:
- Use TenantService for tenantId
- Use HttpClient for API calls
- Implement error handling
```

### PermissionHelperService
- [ ] Create `frontend/src/app/shared/services/permission-helper.service.ts`

**Copilot Prompt:**
```
Create PermissionHelperService with:

Methods:
- isAdminRole(role: Role | string): boolean
  Rule: Check if role.isAdminRole === true OR permissions contain 'admin.*'

- getEffectivePermissionsSync(roles: Role[]): Permission[]
  Merge all permissions from roles, remove duplicates

- formatPermissionSet(permissions: Permission[]): { resource: string; actions: string[] }[]
  Group by resource for display

- countAdminRoles(roleIds: string[], availableRoles: Role[]): number
  Count how many of the roles are admin roles

Dependencies:
- Inject RbacService (if needed for permission engine)
- Pure functions where possible
```

## Phase 3: UI Components - Role Assignment Modal

### Role Assignment Modal
- [ ] Create `frontend/src/app/modules/setup/pages/users/role-assignment-modal/role-assignment-modal.component.ts`

**Copilot Prompt:**
```
Create RoleAssignmentModal (standalone) that:

1. Inputs:
   - user: User (the user being edited)
   - currentRoles: Role[] (already assigned)
   - availableRoles: Role[] (to choose from)
   - onSave: EventEmitter<{ roleIds: string[] }> (output)

2. Display:
   - Modal header: "Edit Roles for [User Name]"
   - User Access Panel (component):
     - Current roles (chips)
     - Current effective permissions (preview)
     - Last modified info
   
   - Role Selection:
     - Checkboxes for each available role
     - Role name + description
     - Permission count per role
   
   - Effective Permissions Preview:
     - Shows merged permissions as user selects/deselects
     - Grouped by resource
     - Updates in real-time

3. Safeguard Display:
   - If removing admin role from SELF:
     - Show warning banner (yellow)
     - "Warning: This will remove your admin access"
   
   - If would remove LAST admin in tenant:
     - Show error banner (red)
     - "ERROR: Cannot save. You must assign admin role to another user."

4. Submit:
   - "Save" button (primary, disabled if error)
   - "Cancel" button (secondary)
   
   - On "Save":
     a) Check safeguard: canRemoveAdminRole()
        - If blocked: Show error, disable save
        - If safe: Proceed
     b) Call UserRolesService.updateUserRoles()
     c) Show loading spinner
     d) On success:
        - Emit success event with roleIds
        - If self-update: Show message "Refreshing..."
        - If other: Show message "Changes on next login"
        - Close modal after 2s
     e) On error:
        - Show error message
        - Allow retry

5. Styling:
   - Modal/dialog style (card in center)
   - Responsive (full width on mobile)
```

### User Access Panel (Sub-component)
- [ ] Create `frontend/src/app/modules/setup/pages/users/user-access-panel/user-access-panel.component.ts`

**Copilot Prompt:**
```
Create UserAccessPanel (standalone, read-only display) that shows:

1. Current Roles:
   - Display as chips/badges
   - Color-coded: admin = red, teacher = blue, etc. (if supported)

2. Effective Permissions:
   - Table with 2 columns: Resource | Actions
   - Grouped by resource name
   - Sorted alphabetically
   - Show count: "X permissions across Y resources"

3. Last Updated Info:
   - "Last updated by: [Admin Name] on [Date] at [Time]"
   - If never updated: "Not yet assigned"

4. Edit Button:
   - "Edit Roles" button (if user has permission to edit)
   - Uses AuthorizationService.can('users:manage')
   - On click: Emit event to open role-assignment-modal

5. Loading State:
   - Show skeleton or spinner while loading permissions
```

## Phase 4: Integration - Update User List

### Update user-list-page
- [ ] Add "Edit Roles" action to each user row

**Copilot Prompt:**
```
Update user-list-page to:

1. User Row Actions:
   - Add column: "Actions"
   - Show button/menu: "Edit Roles" (if user has users:manage permission)
   - On click: Open RoleAssignmentModal
   - Pass currentUser and user being edited

2. User Access Column (optional):
   - Show user's current roles as chips
   - Click to view full permissions (preview)

3. Modal Integration:
   - Import RoleAssignmentModal
   - Create component property: selectedUserForRoles: User | null
   - Open modal when "Edit Roles" clicked
   - Listen for save event → refresh user list

4. Permissions:
   - Use AuthorizationService to check 'users:manage' permission
   - Hide "Edit Roles" button if no permission
   - Show disabled state with tooltip if user can't edit

5. Audit Integration:
   - After successful update, AuditService tracks it
   - Show toast: "User roles updated" or "Changes take effect on next login"
```

## Phase 5: Token Refresh on Self-Update

### Update AuthService
- [ ] Ensure `refreshToken()` method exists

**Copilot Prompt:**
```
Review AuthService and ensure:

1. refreshToken() method:
   - Exists and callable
   - Calls POST /auth/refresh
   - Updates JWT in localStorage
   - Emits new session via session$ BehaviorSubject
   - Returns Promise<User> or Observable<User>

2. Session emission:
   - After token refresh, RbacService.setSession() is called
   - RbacService recomputes granted permissions
   - NavFilterService computed signals update automatically

3. Return type:
   - Promise<any> is OK for now, can be typed later
   - Error handling: throw if refresh fails
```

## Phase 6: Reactive Nav Updates

### NavFilterService (Already in place)
- [ ] Verify NavFilterService uses computed signals
- [ ] Verify it reacts to RbacService changes

**Review:**
```typescript
// NavFilterService should have:
filteredNavSections = computed(() => {
  // Re-computes when authorization.can() changes
  // Which happens when RbacService.granted$ updates
  // Which happens when AuthService.refreshToken() calls
  // RbacService.setSession()
});
```

- If not reactive, update to use signals properly

## Phase 7: Testing

### Unit Tests
- [ ] `user-roles.service.spec.ts` - 8-10 tests
  - Get user roles
  - Update user roles
  - Count admin users
  - Safeguard check

- [ ] `permission-helper.service.spec.ts` - 6-8 tests
  - Detect admin role
  - Compute effective permissions
  - Format permissions

- [ ] `role-assignment-modal.spec.ts` - 8-10 tests
  - Display current roles
  - Update selection
  - Compute effective permissions
  - Block removing last admin

- [ ] `user-access-panel.spec.ts` - 4-6 tests
  - Display roles
  - Display permissions
  - Show last updated info

### Integration Tests
- [ ] Full role assignment: select → save → token refresh → nav updates

### Manual Testing Checklist
- [ ] Assign roles to a user, see in list
- [ ] Click "Edit Roles", see current roles checked
- [ ] Change selection, see effective permissions update
- [ ] Save, see audit event
- [ ] Edit own roles, token refreshes, nav updates
- [ ] Edit other user roles, toast says "next login"
- [ ] Try remove last admin, get blocked with reason
- [ ] Permissions preview shows all merged permissions

---

## Copilot Quick-Fire Prompts

### Ready to Copy/Paste for Quick Implementations

**Models:**
```
Create UserInvite model with: id, tenantId, email, roleIds, status, 
invitedByUserId, invitedAt, expiresAt, acceptedAt, revokedAt, token (frontend only).
Use type: InviteStatus = 'INVITED' | 'ACCEPTED' | 'ACTIVE' | 'REVOKED' | 'EXPIRED'.
```

**Service Skeleton:**
```
Create [SERVICE_NAME] service with these methods: [METHOD_SIGNATURES].
Use dependency injection for TenantService, HttpClient.
Use RxJS for reactive patterns.
Base URL: ${environment.apiUrl}/tenants/{tenantId}/...
Error handling: return throwError(() => new Error(...))
```

**Component:**
```
Create [COMPONENT_NAME] (standalone, Angular 17) that:
1. [Responsibility 1]
2. [Responsibility 2]
3. [Responsibility 3]
Use computed signals for reactive state.
Use inject() for dependencies.
Template should be responsive + match existing theme.
```

**Test Suite:**
```
Create test suite for [SERVICE/COMPONENT] with these test cases:
1. [Test case 1]
2. [Test case 2]
Use Jasmine + Karma.
Mock dependencies with spyObj.
Test both happy path and error scenarios.
```

---

## Final Checklist

### Before Merging
- [ ] All unit tests pass: `npm test`
- [ ] No TypeScript errors: `npm run build`
- [ ] No console errors in browser
- [ ] Manual testing complete (checklist above)
- [ ] Audit events fire correctly (check console)
- [ ] Token refresh works on self-update
- [ ] Nav updates automatically without reload
- [ ] All branches merged to main
- [ ] Documentation updated

### Code Quality
- [ ] No `any` types (except where necessary)
- [ ] Proper error handling (catchError, error toasts)
- [ ] Loading states (spinners, disabled buttons)
- [ ] Validation messages (inline, helpful)
- [ ] Responsive design (mobile tested)
- [ ] Accessibility basics (labels, aria-*, keyboard nav)
- [ ] Comments on complex logic
- [ ] No debug console.log() left behind

### Team Handoff
- [ ] README updated with new routes
- [ ] API endpoint assumptions documented
- [ ] Guards explained in comments
- [ ] Audit event payloads documented
- [ ] Future work items noted (e.g., "TODO: Backend email sending")

---

## Estimated Time

- **Task 1.5.1 (Invite)**: 3-4 days
  - Day 1: Models + Services
  - Day 2: Dialog + List components
  - Day 3: Accept page + integration
  - Day 4: Testing + polish

- **Task 1.5.2 (Roles)**: 3-4 days
  - Day 1: Models + Services
  - Day 2: Modal + panel components
  - Day 3: Integration + safeguards
  - Day 4: Testing + polish

**Total: 6-8 days of focused development**

---

## Next Steps

1. **Review**: Confirm models, services, components align with your codebase
2. **Decide**: Which Copilot prompt to start with (models? services? components?)
3. **Execute**: Use prompts above in order
4. **Test**: Follow checklist and manual test scenarios
5. **Integrate**: Wire up UI, update routes, test end-to-end
6. **Polish**: Error messages, loading states, edge cases
7. **Merge**: Both branches to main

**Questions before starting?**
- Backend API differences from assumed endpoints?
- UI patterns/component library specifics?
- Preferred modal/dialog library?
- Email sending mechanism?
- Token expiry duration preference?

Good luck with the implementation! 🚀
