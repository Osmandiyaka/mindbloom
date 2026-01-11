export enum SchoolType {
    PRIMARY = 'primary',
    SECONDARY = 'secondary',
    TERTIARY = 'tertiary',
    VOCATIONAL = 'vocational',
    MIXED = 'mixed',
}

export enum SchoolStatus {
    PENDING_SETUP = 'pending_setup',
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    ARCHIVED = 'archived',
}

export interface SchoolAddress {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}

export interface SchoolContact {
    email?: string;
    phone?: string;
    website?: string;
}

export interface SchoolSettings {
    gradingSystem?: string;
    termsConfig?: Record<string, any>;
    attendanceRules?: Record<string, any>;
}

export class School {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly name: string,
        public readonly code: string,
        public readonly type: SchoolType,
        public readonly status: SchoolStatus,
        public readonly address?: SchoolAddress,
        public readonly contact?: SchoolContact,
        public readonly settings?: SchoolSettings,
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date(),
    ) { }

    static create(data: {
        id?: string;
        tenantId: string;
        name: string;
        code: string;
        type?: SchoolType;
        status?: SchoolStatus;
        address?: SchoolAddress;
        contact?: SchoolContact;
        settings?: SchoolSettings;
        createdAt?: Date;
        updatedAt?: Date;
    }): School {
        return new School(
            data.id ?? crypto.randomUUID(),
            data.tenantId,
            data.name,
            data.code,
            data.type ?? SchoolType.MIXED,
            data.status ?? SchoolStatus.PENDING_SETUP,
            data.address,
            data.contact,
            data.settings,
            data.createdAt ?? new Date(),
            data.updatedAt ?? new Date(),
        );
    }
}
