# Module Lock State System - Task List

- [ ] Define lock reason enum and shared copy/CTA map (NOT_IN_PLAN, ADDON_REQUIRED, TRIAL_EXPIRED, DISABLED_BY_OVERRIDE, INSUFFICIENT_ROLE_PERMISSIONS, PREREQUISITE_NOT_CONFIGURED).
- [ ] Implement EntitlementReasonRenderer helper (reason -> title/body/cta/link/role-based variants).
- [ ] Build EntitlementBadge component (Included/Add-on/Locked/Overridden) with low-chrome styling.
- [ ] Build LockedPopover component for gated controls (reason + CTA + "Why?" link).
- [ ] Build GatedLandingPanel component for full-page module lock state.
- [ ] Wire nav locked state: lock icon + tooltip + gated landing on click.
- [ ] Add in-page feature gating pattern (disable control + LockedPopover on click).
- [ ] Update Plan & Entitlements module table notes to use standardized lock reasons + "Why locked?" popover CTA overrides when applicable.
- [ ] Add "Request access" modal flow (auto-fill module/feature + reason + timestamp) and role-based CTA gating.
- [ ] Provide example usage: Fees module page (Level B) and Export button (Level C).
- [ ] Validate behavior rules: single banner per view, avoid repeated "Locked" pills, always show reason + next step.
