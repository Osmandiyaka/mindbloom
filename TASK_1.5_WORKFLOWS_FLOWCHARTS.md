# Task 1.5 - User Management Workflows (Flowcharts & Sequences)

## Invite Workflow State Machine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          INVITE LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   INVITED    │
                              │  (blue chip) │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
          ┌─────────▼──────┐  ┌──────▼────────┐  ┌──▼─────────────┐
          │  Expires after │  │  User Clicks  │  │ Admin clicks   │
          │  7-14 days     │  │  Accept Link  │  │ "Revoke"       │
          │                │  │                │  │                │
          │   ┌────────┐   │  │   ┌─────────┐ │  │  ┌──────────┐  │
          │   │EXPIRED │   │  │   │ ACCEPTED│ │  │  │ REVOKED  │  │
          │   │(gray)  │   │  │   │(green)  │ │  │  │ (red)    │  │
          │   └────────┘   │  │   └────┬────┘ │  │  └──────────┘  │
          │                │  │        │      │  │                │
          │  ┌──────────┐  │  │    ┌───▼────┐ │  │  [Terminal]    │
          │  │ Resend   │  │  │    │ ACTIVE │ │  │  No further    │
          │  │ (creates │  │  │    │(green) │ │  │  actions       │
          │  │  new)    │  │  │    └────────┘ │  │                │
          │  └──────────┘  │  │    On first   │  └────────────────┘
          │                │  │    login or   │
          │ [Terminal]     │  │    immediate  │
          │  No further    │  │                │
          │  actions       │  └────────────────┘
          └────────────────┘
```

## Invite Workflow Sequence Diagram

```
Admin                 Browser                  Service              Email Server
  │                      │                        │                     │
  │ Click "Invite"       │                        │                     │
  ├──────────────────────>│                        │                     │
  │                      │ Invite Dialog          │                     │
  │                      │ (enter email, roles)   │                     │
  │                      │                        │                     │
  │                      │ Click "Send"           │                     │
  │                      ├─────────────────────>  │                     │
  │                      │                        │ POST /invites       │
  │                      │                    [Create Invite]          │
  │                      │                        │                     │
  │                      │                        │ Generate token      │
  │                      │                        │ Set expiry (7d)     │
  │                      │                        │                     │
  │                      │   <────────────────────┤                     │
  │                      │   200 OK + invite      │                     │
  │                      │                        │                     │
  │  Close dialog        │                        │ Send email          │
  │  Refresh invites     │                        ├────────────────────>│
  │  Show toast          │                        │                     │
  │  Success!            │                        │                     │
  │                      │                        │  <──────────────────┤
  │                      │                        │  Email delivered    │
  │                      │                        │                     │


Invited User             Accept Page             Service              Auth
  │                          │                        │                │
  │ Receives email           │                        │                │
  │ Clicks link              │                        │                │
  │ /accept-invite?token=... │                        │                │
  ├──────────────────────────>│                        │                │
  │                          │ Page loads             │                │
  │                          │ Validates token        │                │
  │                          ├───────────────────────>│                │
  │                          │ POST /invites/validate │                │
  │                          │   <────────────────────┤                │
  │                          │   200 OK + email       │                │
  │                          │ Form displayed         │                │
  │                          │ (name, password)       │                │
  │                          │                        │                │
  │ Fill form                │                        │                │
  │ Click "Complete"         │                        │                │
  ├──────────────────────────>│                        │                │
  │                          │ POST /invites/accept   │                │
  │                          │ (token, name, pwd)     │                │
  │                          ├───────────────────────>│                │
  │                          │                        │ Create user    │
  │                          │                        │ Set status:    │
  │                          │                        │   ACCEPTED     │
  │                          │                        │                │
  │                          │   <────────────────────┤                │
  │                          │   201 Created + token  │                │
  │                          │                        │                │
  │                          │ Redirect /login        │                │
  │                          │ (or auto-login)        │                │
  │                          │   ┌──────────────────────────────────┐  │
  │                          │   │ User logs in → status = ACTIVE   │  │
  │                          │   │ Access granted to dashboard      │  │
  │                          │   └──────────────────────────────────┘  │
  │                          │                        │                │
  │  Ready!                  │                        │                │
  │                          │                        │                │
```

## Role Assignment Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ROLE ASSIGNMENT WORKFLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: Admin selects user from list
        │
        ├─> Click "Edit Roles" action
        │
Step 2: Modal opens
        ├─> Load available roles
        ├─> Load current user roles (check marks)
        ├─> Compute effective permissions
        │   (show merge of all selected role permissions)
        │
Step 3: Admin modifies selection
        ├─> Check/uncheck roles
        ├─> Preview updates automatically
        ├─> If removing admin from self:
        │   └─> Show warning
        │
Step 4: Click "Save"
        │
        ├─> [Safeguard Check] ─────────────────────┐
        │   │                                       │
        │   ├─> Would removing admin leave       │
        │   │    zero admins?                     │
        │   │                                       │
        │   ├─> NO ─> Proceed to API call       │
        │   │                                       │
        │   └─> YES ─> Show error modal     ──────┼──> [Block]
        │               "Cannot proceed..."        │
        │               (cannot close dialog)      │
        │                                          │
Step 5: Call API                                  │
        ├─> PUT /users/{id}/roles                │
        ├─> Emit audit event                      │
        │   ├─> userId, previousRoleIds,          │
        │   ├─> newRoleIds, updatedBy             │
        │   └─> timestamp                         │
        │                                          │
Step 6: Response handling                         │
        │                                          │
        ├─> If updated user is SELF:              │
        │   ├─> Show toast: "Refreshing..."       │
        │   ├─> Force token refresh()             │
        │   ├─> RbacService recomputes perms      │
        │   ├─> Nav updates automatically         │
        │   ├─> Wait 2s, close modal              │
        │   └─> Success!                          │
        │                                          │
        └─> If updated user is OTHER:             │
            ├─> Show toast: "Changes on next login"
            ├─> Close modal                        │
            ├─> Refresh user list                  │
            └─> Success!                           │
```

## Role Assignment Safeguard Logic

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ADMIN SAFEGUARD CHECK                            │
└─────────────────────────────────────────────────────────────────────────┘

Input: userId, currentRoleIds[], newRoleIds[]

Step 1: Determine admin roles
        ├─> Get all available roles
        ├─> Filter roles where isAdminRole = true
        │   OR permissions contain 'admin.*'
        
Step 2: Check if user is losing admin
        ├─> currentAdminRoles = currentRoleIds.filter(id => isAdmin(id))
        ├─> newAdminRoles = newRoleIds.filter(id => isAdmin(id))
        │
        ├─> If currentAdminRoles.length > 0 AND newAdminRoles.length === 0:
        │   └─> User IS losing admin access
        │       ├─> Count other admin users in tenant
        │       │   (API: GET /tenants/admins/count)
        │       │
        │       ├─> If count === 1 (this is the only admin):
        │       │   └─> [BLOCK] "Cannot remove last admin"
        │       │       Message: "You must assign admin role to
        │       │                another user before removing it."
        │       │
        │       └─> If count > 1:
        │           └─> [ALLOW] Safe to remove
        │
        └─> If user not losing admin:
            └─> [ALLOW] Proceed
```

## Effective Permissions Computation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  EFFECTIVE PERMISSIONS PREVIEW                          │
└─────────────────────────────────────────────────────────────────────────┘

Input: selectedRoleIds[]

Step 1: For each selected role:
        ├─> Fetch role.permissions[]
        ├─> Collect all permissions

Step 2: Merge permissions
        ├─> Combine all permission sets
        ├─> Remove duplicates (by permission.id)
        ├─> Sort by resource (alphabetically)

Step 3: Format for display
        ├─> Group by resource:
        │   ├─> "students"  → [read, write, delete, approve]
        │   ├─> "admissions" → [read, write]
        │   ├─> "library"   → [read, write, import, export]
        │   └─> ...
        │
        └─> Display as expandable table:
            Resource    │ Actions
            ────────────┼──────────────────────────
            Students    │ read, write, delete
            Admissions  │ read, write, approve
            Library     │ read, write, import, export

Step 4: Show summary
        └─> "Selected roles grant 47 permissions across 8 resources"
```

## Token Refresh & Nav Update on Role Change

```
┌─────────────────────────────────────────────────────────────────────────┐
│         TOKEN REFRESH & NAV UPDATE (Current User Role Change)          │
└─────────────────────────────────────────────────────────────────────────┘

Scenario: Admin clicks "Save" after removing their own admin role

Step 1: API succeeds
        │
        ├─> Check: updatedUserId === currentUser.id ?
        │   │
        │   └─> YES ─> Proceed with refresh
        │
Step 2: AuthService.refreshToken()
        │
        ├─> Call POST /auth/refresh
        ├─> Receive new JWT with updated roles
        ├─> Store in localStorage
        │
Step 3: AuthService emits new session
        │
        ├─> session$ BehaviorSubject updates
        │
Step 4: RbacService reacts
        │
        ├─> setSession() called with new session
        ├─> RbacService recomputes grantedCache
        ├─> Emits granted$ Observable
        │
Step 5: NavFilterService reacts (computed signal)
        │
        ├─> entitlements.enabledModules() triggers
        ├─> authorization.can() re-evaluated
        ├─> filteredNavSections computed signal updates
        │
Step 6: Sidebar auto-updates
        │
        ├─> Nav hides modules no longer entitled
        ├─> Nav hides menu items user lacks permission for
        │   (happens reactively, no page reload)
        │
Step 7: User sees immediate change
        │
        ├─> Some nav items disappear
        ├─> Some routes become blocked
        ├─> No page reload needed
        │
Step 8: Modal closes (after 2s delay)
        │
        └─> User back at user list
```

## Audit Trail Example

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       AUDIT TRAIL EVENTS                                │
└─────────────────────────────────────────────────────────────────────────┘

User Invited:
  EventName: invite_created
  Timestamp: 2025-12-19T14:32:00Z
  Actor: admin@school.edu (admin-user-id)
  Data:
    inviteId: inv_xyz123
    email: newteacher@school.edu
    roleIds: [role-teacher, role-faculty]
    tenantId: school-001
    expiresAt: 2025-12-26T14:32:00Z

Invite Resent:
  EventName: invite_resent
  Timestamp: 2025-12-20T09:15:00Z
  Actor: admin@school.edu (admin-user-id)
  Data:
    inviteId: inv_xyz123
    email: newteacher@school.edu
    tenantId: school-001
    newExpiresAt: 2025-12-27T09:15:00Z

Invite Revoked:
  EventName: invite_revoked
  Timestamp: 2025-12-20T10:45:00Z
  Actor: admin@school.edu (admin-user-id)
  Data:
    inviteId: inv_xyz123
    email: newteacher@school.edu
    reason: "User will not join"
    tenantId: school-001

Invite Accepted:
  EventName: invite_accepted
  Timestamp: 2025-12-21T11:20:00Z
  Actor: newteacher@school.edu (auto)
  Data:
    inviteId: inv_xyz123
    userId: user-teacher-001
    email: newteacher@school.edu
    assignedRoles: [role-teacher, role-faculty]
    tenantId: school-001

Role Assignment Updated:
  EventName: role_assignment_updated
  Timestamp: 2025-12-22T15:30:00Z
  Actor: admin@school.edu (admin-user-id)
  Data:
    userId: user-teacher-001
    tenantId: school-001
    previousRoleIds: [role-teacher]
    newRoleIds: [role-teacher, role-department-head]
    affectedUser: newteacher@school.edu
    permissionsAdded: [
      "reports:read", "reports:write",
      "budgets:read", "budgets:write"
    ]
    permissionsRemoved: []
    safeguardChecked: true
    adminCountBeforeChange: 3
```

## Component Integration Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      COMPONENT TREE STRUCTURE                           │
└─────────────────────────────────────────────────────────────────────────┘

app-root
  │
  ├─> app-layout (authenticated routes)
  │   │
  │   └─> setup-overview
  │       │
  │       └─> setup-nav
  │           ├─> [link to /setup/users]
  │           └─> [link to /setup/users/invites]
  │
  └─> public routes
      │
      └─> accept-invite-page
          │
          ├─> invite-token-validator (validates token)
          │
          ├─> invite-form (for accepted invites)
          │   ├─> name-input
          │   ├─> password-input (or SSO button)
          │   └─> submit-button
          │
          └─> invite-error-display (for invalid/expired)


/setup/users route (user list + management)
  │
  ├─> user-list-page
  │   │
  │   ├─ [Users Table]
  │   │  └─> [Tabs]
  │   │      │
  │   │      ├─> [Active Users Tab]
  │   │      │   ├─> user-list-row (repeat)
  │   │      │   │  ├─> [Name]
  │   │      │   │  ├─> [Email]
  │   │      │   │  ├─> [Roles (chips)]
  │   │      │   │  ├─> [Created At]
  │   │      │   │  └─> [Actions]
  │   │      │   │      └─> "Edit Roles" button
  │   │      │   │         (→ opens role-assignment-modal)
  │   │      │   │
  │   │      │   └─> Pagination + Search
  │   │      │
  │   │      └─> [Pending Invites Tab]
  │   │          ├─> invites-list
  │   │          │  └─> invite-row (repeat)
  │   │          │     ├─> [Email]
  │   │          │     ├─> [Roles (chips)]
  │   │          │     ├─> [Status (chip)]
  │   │          │     ├─> [Invited At]
  │   │          │     ├─> [Expires At]
  │   │          │     └─> [Actions]
  │   │          │        ├─> "Resend" button (INVITED)
  │   │          │        ├─> "Revoke" button (INVITED/EXPIRED)
  │   │          │        └─> "Resend" button (EXPIRED)
  │   │          │
  │   │          └─> Refresh button
  │   │
  │   └─> [Header]
  │       └─> "Invite User" button
  │          (→ opens invite-user-dialog)
  │
  ├─> invite-user-dialog (modal)
  │   ├─> email-input
  │   │   ├─> validation: format, not-duplicate
  │   │   └─> error message
  │   │
  │   ├─> role-multi-select
  │   │   ├─> available-roles (from RolesService)
  │   │   └─> selected-roles (preview)
  │   │
  │   └─> [Send Invite] button
  │       └─> Creates UserInvite + shows toast
  │
  └─> role-assignment-modal (modal)
      │
      ├─> user-access-panel (read-only display)
      │   ├─> "Current Roles" (chips)
      │   ├─> "Effective Permissions" (preview table)
      │   └─> "Last Updated By" (info)
      │
      ├─> role-multi-select
      │   ├─> available-roles list
      │   ├─> checkboxes (current + new selection)
      │   └─> [Preview] section
      │       ├─> "Selected roles grant X permissions"
      │       ├─> Permissions table (resource | actions)
      │       └─> Auto-updates as checkboxes change
      │
      ├─> safeguard-warning (conditional)
      │   └─> Shows if removing admin role
      │       "Warning: This will remove admin access"
      │
      └─> [Save] button
          └─> Calls UserRolesService.updateUserRoles()
              → Handles safeguard check
              → Token refresh if self
              → Nav updates automatically
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      REACTIVE DATA FLOW                                 │
└─────────────────────────────────────────────────────────────────────────┘

Invite Creation Flow:
  User Input (email, roles)
    ↓
  invite-user-dialog validates
    ↓
  UserInvitesService.createInvite() → API POST
    ↓
  Backend creates UserInvite (INVITED status)
    ↓
  AuditService.track('invite_created', {...})
    ↓
  Toast: "Invite sent to X"
    ↓
  Refresh invites-list (GET /invites)
    ↓
  invites-list displayed with new invite


Role Assignment Flow:
  User clicks "Edit Roles"
    ↓
  role-assignment-modal loads
    ├─> RolesService.getAvailableRoles() → Observable
    ├─> UserRolesService.getUserRoles(userId) → Observable
    ├─> PermissionHelperService.getEffectivePermissions([selected]) → computed
    │
  Admin modifies selection (checkboxes)
    ├─> selectedRoles[] signal updates
    ├─> effectivePermissions computed signal updates
    ├─> preview displays immediately
    │
  Click "Save"
    ├─> Safeguard check (API call or local)
    │   └─> If unsafe → [Block] show error
    │   └─> If safe → proceed
    │
    ├─> UserRolesService.updateUserRoles(userId, newRoleIds[])
    │   ├─> API PUT /users/{id}/roles
    │   ├─> AuditService.track('role_assignment_updated', {...})
    │   ├─> Check: updatedUserId === currentUser.id?
    │   │   ├─> YES: AuthService.refreshToken()
    │   │   │   └─> RbacService.setSession() recomputes
    │   │   │       └─> NavFilterService computed updates
    │   │   │           └─> Sidebar nav reactively hides/shows items
    │   │   │
    │   │   └─> NO: Toast "Changes on next login"
    │   │
    │   └─> Close modal
    │
    ├─> Success toast or error
    │
  Invite Acceptance Flow:
  Invited user clicks email link → /accept-invite?token=xyz
    │
  Page loads
    ├─> UserInvitesService.validateInviteToken(token)
    │   └─> Check: valid? not expired? not revoked?
    │
    ├─> If invalid:
    │   └─> Show error message + "Contact admin"
    │
    └─> If valid:
        ├─> Form displayed (name, password)
        │
        User fills form + submits
        ├─> UserInvitesService.acceptInvite(token, name, password)
        │   ├─> API POST /invites/accept
        │   ├─> Backend creates User, updates invite to ACCEPTED
        │   ├─> AuditService.track('invite_accepted', {...})
        │   │
        │   └─> Response: { user, sessionToken }
        │
        ├─> AuthService updates session (OR user redirected to /login)
        ├─> Redirect to /dashboard (or /onboarding)
        │
        └─> Success! User now ACTIVE after first login
```

---

## Summary
- **Invite Workflow**: Coherent 4-state lifecycle with resend/revoke actions
- **Role Assignment**: Safe multi-role assignment with admin safeguard + audit
- **Reactive Updates**: Token refresh + nav updates happen automatically
- **Audit Trail**: All changes tracked for compliance + debugging
- **UX-Focused**: Clear statuses, friendly errors, no dead links

Ready to implement!
