export type LockReason =
    | 'NOT_IN_PLAN'
    | 'ADDON_REQUIRED'
    | 'TRIAL_EXPIRED'
    | 'DISABLED_BY_OVERRIDE'
    | 'INSUFFICIENT_ROLE_PERMISSIONS'
    | 'PREREQUISITE_NOT_CONFIGURED';

export type LockCtaType =
    | 'upgrade'
    | 'request_access'
    | 'contact_sales'
    | 'view_plans'
    | 'view_overrides'
    | 'view_permissions'
    | 'start_setup'
    | 'none'
    | 'copy_details'
    | 'request_change';

export interface LockContext {
    requiredPlan?: string;
    moduleName?: string;
    featureName?: string;
    isBillingAdmin?: boolean;
}

export interface LockMessage {
    title: string;
    body: string;
    ctaLabel?: string;
    ctaType: LockCtaType;
    secondaryLabel?: string;
    secondaryType?: LockCtaType;
}

const planHint = (plan?: string) => (plan ? `Requires ${plan}+.` : 'Requires a higher plan.');

export const getLockMessage = (reason: LockReason, context: LockContext): LockMessage => {
    const isBillingAdmin = context.isBillingAdmin ?? false;

    if (!isBillingAdmin) {
        return {
            title: 'Access restricted',
            body: 'Ask an administrator to grant access or upgrade the plan.',
            ctaLabel: 'Request access',
            ctaType: 'request_access',
            secondaryLabel: 'Copy details',
            secondaryType: 'copy_details',
        };
    }

    switch (reason) {
        case 'NOT_IN_PLAN':
            return {
                title: 'Not included in your plan',
                body: planHint(context.requiredPlan),
                ctaLabel: 'View plans',
                ctaType: 'view_plans',
            };
        case 'ADDON_REQUIRED':
            return {
                title: 'Add-on required',
                body: 'This feature is available as an add-on.',
                ctaLabel: 'Contact sales',
                ctaType: 'contact_sales',
            };
        case 'TRIAL_EXPIRED':
            return {
                title: 'Trial expired',
                body: 'This feature is no longer available on the current plan.',
                ctaLabel: 'Request plan change',
                ctaType: 'request_change',
            };
        case 'DISABLED_BY_OVERRIDE':
            return {
                title: 'Disabled by tenant override',
                body: 'This module is included in your plan but currently disabled.',
                ctaLabel: 'View overrides',
                ctaType: 'view_overrides',
            };
        case 'INSUFFICIENT_ROLE_PERMISSIONS':
            return {
                title: 'You do not have access',
                body: 'Ask an administrator to grant the required permissions.',
                ctaLabel: 'View required permissions',
                ctaType: 'view_permissions',
            };
        case 'PREREQUISITE_NOT_CONFIGURED':
            return {
                title: 'Setup required',
                body: 'Complete setup to start using this feature.',
                ctaLabel: 'Start setup',
                ctaType: 'start_setup',
            };
        default:
            return {
                title: 'Access restricted',
                body: 'This feature is currently unavailable.',
                ctaType: 'none',
            };
    }
};
