export class UpdateTenantSettingsCommand {
    constructor(
        public readonly tenantId: string,
        public readonly settings: TenantSettingsUpdate,
    ) { }
}

export interface TenantSettingsUpdate {
    contactInfo?: {
        email?: string;
        phone?: string;
        alternateEmail?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
        };
    };
    billing?: Record<string, any>;
    limits?: Record<string, any>;
    usage?: Record<string, any>;
    customization?: Record<string, any>;
    enabledModules?: string[];
    locale?: string;
    timezone?: string;
    weekStartsOn?: string;
    currency?: string;
    academicYear?: {
        start?: Date;
        end?: Date;
        name?: string;
    };
    allowedIpAddresses?: string[];
    twoFactorRequired?: boolean;
    ssoEnabled?: boolean;
    ssoConfig?: Record<string, any>;
    dataRetentionDays?: number;
    metadata?: Record<string, any>;
    editionId?: string | null;
    tags?: string[];
    trialEndsAt?: Date;
    idTemplates?: {
        admissionPrefix?: string;
        admissionSeqLength?: number;
        includeYear?: boolean;
        resetPerYear?: boolean;
        rollPrefix?: string;
        rollSeqLength?: number;
        sampleClass?: string;
        sampleSection?: string;
        resetPerClass?: boolean;
    };
}
