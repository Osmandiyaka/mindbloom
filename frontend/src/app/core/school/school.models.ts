export type SchoolAddress = {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
};

export type SchoolContact = {
    email?: string;
    phone?: string;
    website?: string;
};

export type SchoolSettings = Record<string, any>;

export interface School {
    id: string;
    name: string;
    code?: string;
    domain?: string;
    status?: string;
    type?: string;
    address?: SchoolAddress;
    contact?: SchoolContact;
    settings?: SchoolSettings;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}
