export type UserStatus = 'active' | 'suspended' | 'invited';

export type SchoolAccessAll = {
    scope: 'all';
};

export type SchoolAccessSelected = {
    scope: 'selected';
    schoolIds: string[];
};

export type SchoolAccess = SchoolAccessAll | SchoolAccessSelected;
