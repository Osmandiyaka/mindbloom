# Module Entitlements Quick Reference

## Adding a New Module

### 1. Add Module Key
**File:** `frontend/src/app/shared/types/module-keys.ts`

```typescript
export const MODULE_KEYS = {
  // ... existing keys
  YOUR_MODULE: 'your-module'
} as const;

export const MODULE_NAMES: Record<ModuleKey, string> = {
  // ... existing names
  'your-module': 'Your Module Display Name'
};
```

### 2. Update Plan Entitlements
**File:** `frontend/src/app/shared/services/entitlements.service.ts`

Add your module to appropriate plans:
```typescript
const PLAN_ENTITLEMENTS: Record<TenantPlan, ReadonlySet<ModuleKey>> = {
  trial: new Set([
    // ... existing modules
    MODULE_KEYS.YOUR_MODULE  // If trial should have it
  ]),
  premium: new Set([
    // ... existing modules
    MODULE_KEYS.YOUR_MODULE  // Premium gets it
  ]),
  // ... other plans
};
```

### 3. Add Route with Guard
**File:** `frontend/src/app/app.routes.ts`

```typescript
{
  path: 'your-module',
  loadChildren: () => import('./modules/your-module/your-module.routes'),
  canMatch: [moduleEntitlementGuard, permissionMatchGuard],
  data: { 
    moduleKey: 'your-module',  // Must match MODULE_KEYS
    permissions: ['your-module:read']
  }
}
```

### 4. Add to Sidebar Navigation
**File:** `frontend/src/app/shared/components/sidebar/sidebar.component.ts`

```typescript
navSections: NavSection[] = [
  {
    title: 'Your Section',
    items: [
      { 
        label: 'Your Module', 
        path: '/your-module', 
        icon: 'your-icon',
        moduleKey: 'your-module',  // Must match MODULE_KEYS
        permission: PERMS.YOUR_MODULE_READ  // Optional
      }
    ]
  }
];
```

### 5. Test It
```bash
# Unit tests
cd frontend
npm test -- --include='**/entitlements.service.spec.ts'

# Manual testing
# 1. Change tenant plan in database
# 2. Refresh app
# 3. Verify module appears/disappears in nav
# 4. Try accessing route directly
```

## Checking Entitlements in Components

### Simple Check
```typescript
import { EntitlementsService } from '@shared/services/entitlements.service';

export class MyComponent {
  private entitlements = inject(EntitlementsService);

  ngOnInit() {
    if (this.entitlements.isEnabled('library')) {
      // Show library-specific UI
    }
  }
}
```

### Reactive Check
```typescript
export class MyComponent {
  private entitlements = inject(EntitlementsService);
  
  isLibraryEnabled$ = this.entitlements.isEnabled$('library');
}
```

```html
<div *ngIf="isLibraryEnabled$ | async">
  Library features here
</div>
```

### Multiple Modules
```typescript
export class MyComponent {
  private entitlements = inject(EntitlementsService);
  
  hasFinanceAccess = computed(() => {
    const modules = this.entitlements.enabledModules();
    return modules.has('fees') || modules.has('accounting') || modules.has('finance');
  });
}
```

## Debugging

### Check Current Entitlements
```typescript
// In browser console
const entitlements = window.ng.getComponent(document.querySelector('app-root'))
  .injector.get(EntitlementsService);

console.log('Enabled modules:', Array.from(entitlements.enabledModules()));
console.log('Is library enabled:', entitlements.isEnabled('library'));
```

### Check Current Plan
```typescript
const tenantService = window.ng.getComponent(document.querySelector('app-root'))
  .injector.get(TenantService);

console.log('Current tenant:', tenantService.currentTenant());
console.log('Plan:', tenantService.currentTenant()?.plan);
```

### Guard Behavior
Check console logs when navigating:
```
[ModuleEntitlement] Access denied to module: library Attempted path: /library
```

## Plan Upgrade Scenarios

### User Tries Disabled Module
1. User clicks nav item (if visible due to misconfiguration)
2. OR user types URL directly: `/library`
3. `moduleEntitlementGuard` intercepts
4. Redirects to `/module-not-enabled?module=library&returnUrl=/library`
5. User sees upgrade prompt with current plan badge

### Admin Enables Custom Modules
```typescript
// Future: When backend API is ready
const tenant = await tenantService.getCurrentTenant();
tenant.enabledModules = ['library', 'hr']; // Custom override
await tenantService.updateTenant(tenant);
await entitlements.refresh(); // Reload entitlements
```

## Common Patterns

### Hide Feature Based on Plan
```html
<button *ngIf="entitlements.isEnabled('accounting')" 
        (click)="exportToAccounting()">
  Export to Accounting
</button>
```

### Show Upgrade Prompt
```html
<div *ngIf="!entitlements.isEnabled('library')" class="upgrade-prompt">
  <p>Library module requires Premium plan</p>
  <a routerLink="/setup/plans">Upgrade Now</a>
</div>
```

### Conditional Routing
```typescript
goToLibrary() {
  if (this.entitlements.isEnabled('library')) {
    this.router.navigate(['/library']);
  } else {
    this.router.navigate(['/module-not-enabled'], {
      queryParams: { module: 'library', returnUrl: '/library' }
    });
  }
}
```

## Plan Comparison

### Quick Plan Matrix
```typescript
import { PLAN_ENTITLEMENTS } from '@shared/services/entitlements.service';

// Get modules for a specific plan
const premiumModules = PLAN_ENTITLEMENTS.premium;
console.log('Premium includes:', Array.from(premiumModules));

// Compare plans
const upgradeToEnterprise = entitlements.getAdditionalModulesInPlan('enterprise');
console.log('Enterprise adds:', upgradeToEnterprise);
```

### Plan Tier Hierarchy
```
Free (3 modules)
  ↓
Trial / Basic (7 modules)
  ↓
Premium (13 modules)
  ↓
Enterprise (18 modules - ALL)
```

## FAQ

**Q: Can I bypass entitlements for testing?**
A: Change tenant.plan in database or mock EntitlementsService in tests

**Q: What if I need sub-module permissions (e.g., library:reports)?**
A: Use RBAC permissions. Entitlements are module-level, permissions are feature-level

**Q: How do I handle module deprecation?**
A: Remove from all PLAN_ENTITLEMENTS, keep moduleKey for backward compatibility

**Q: Can a user have modules not in their plan?**
A: Yes, via tenant.enabledModules[] custom override (backend integration needed)

**Q: What happens if module is enabled but user lacks permission?**
A: permissionMatchGuard redirects to /access-denied AFTER entitlement check passes

**Q: How often does the system check entitlements?**
A: Every navigation attempt. Uses computed signal, so updates automatically when tenant changes

## Testing Checklist

When adding a new module:

- [ ] Module key added to MODULE_KEYS and MODULE_NAMES
- [ ] Module added to appropriate plan entitlements
- [ ] Route configured with moduleKey and guard
- [ ] Nav item added with moduleKey
- [ ] Manual test: Module visible in correct plans
- [ ] Manual test: Module hidden in other plans
- [ ] Manual test: Direct URL blocked when disabled
- [ ] Manual test: Upgrade prompt shows correct info
- [ ] Unit test: EntitlementsService includes module in correct plans
- [ ] Unit test: NavFilterService shows/hides nav item correctly

## Performance Notes

- NavFilterService uses `computed()` signal - filters only when dependencies change
- Guard checks are synchronous - no API calls on every navigation
- Module list stored in memory (Set for O(1) lookup)
- No watchers or subscriptions in guard - pure functional approach

## Security Notes

- Guards execute on server-side routing (SSR safe)
- Cannot be bypassed via browser devtools
- Entitlements checked BEFORE lazy loading (prevents code download)
- Always verify on backend API even if frontend allows access
