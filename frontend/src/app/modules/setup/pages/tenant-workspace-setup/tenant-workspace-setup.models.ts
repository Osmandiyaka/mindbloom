import { AddressValue } from '../../../../shared/components/address/address.component';

export interface SchoolRow {
    id?: string;
    name: string;
    code: string;
    country: string;
    timezone: string;
    status: 'Active' | 'Inactive' | 'Archived';
    address?: AddressValue;
}

export type UserRole = 'Owner' | 'Administrator' | 'Staff' | 'Teacher';
export type UserStatus = 'Invited' | 'Active' | 'Suspended';

export interface UserRow {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    schoolAccess: 'all' | string[];
    status: UserStatus;
    jobTitle?: string;
    department?: string;
    staffId?: string;
    lastLogin?: string;
    createdAt?: string;
}

export type ClassLevelType = 'Early Years' | 'Primary' | 'JHS' | 'SHS' | 'College' | 'Other';

export interface ClassRow {
    id: string;
    name: string;
    code?: string;
    levelType?: ClassLevelType | '';
    sortOrder: number;
    active: boolean;
    schoolIds: string[] | null;
    notes?: string;
}

export interface SectionRow {
    id: string;
    classId: string;
    name: string;
    code?: string;
    capacity?: number | null;
    homeroomTeacherId?: string | null;
    active: boolean;
    sortOrder: number;
}

export type OrgUnitStatus = 'Active' | 'Inactive';
export type OrgUnitType = 'District' | 'School' | 'Division' | 'Department' | 'Grade' | 'Section' | 'Custom';

export type OrgUnitRole = {
    id: string;
    name: string;
    description?: string;
};

export interface OrgUnit {
    id: string;
    name: string;
    type: OrgUnitType;
    status: OrgUnitStatus;
    parentId?: string | null;
}

export interface OrgUnitNode extends OrgUnit {
    children: OrgUnitNode[];
}

export type GradingScaleType = 'Letter' | 'Percent' | 'GPA' | 'Rubric';
export type GradingScaleStatus = 'Active' | 'Draft' | 'Archived';

export type GradingBand = {
    id: string;
    label: string;
    min: number;
    max: number;
    pass: boolean;
    gpa?: number | null;
};

export type GradingScaleSettings = {
    passMark: number | null;
    allowDecimals: boolean;
    preventOverlap: boolean;
    calculationMethod: 'Average' | 'Highest' | 'Lowest' | 'Weighted';
    rounding: 'Nearest' | 'Up' | 'Down';
    showGpa: boolean;
    showPercent: boolean;
    transcriptFormat: 'Letter' | 'Letter + Percent' | 'Percent';
};

export type GradingScale = {
    id: string;
    name: string;
    type: GradingScaleType;
    status: GradingScaleStatus;
    schoolIds: string[] | null;
    bands: GradingBand[];
    settings: GradingScaleSettings;
};

export type OrgUnitDeleteImpact = {
    childUnits: number;
    members: number;
    roles: number;
};

export interface FirstLoginSetupData {
    schoolRows?: SchoolRow[];
    departments?: string[];
    orgUnits?: OrgUnit[];
    orgUnitMemberIds?: Record<string, string[]>;
    orgUnitRoles?: Record<string, OrgUnitRole[]>;
    levelsTemplate?: 'k12' | 'primary_secondary' | 'custom';
    levels?: string[];
    classes?: ClassRow[] | Array<{ name: string; level: string; sections: string }>;
    sections?: SectionRow[];
    gradingModel?: 'letter' | 'numeric' | 'gpa' | 'custom';
    gradingScales?: GradingScale[];
    users?: UserRow[];
    usersStepSkipped?: boolean;
}
