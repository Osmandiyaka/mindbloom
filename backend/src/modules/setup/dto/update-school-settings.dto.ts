export class UpdateSchoolSettingsDto {
    schoolName: string;
    domain?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    timezone?: string;
    locale?: string;
    academicYear?: { start?: Date; end?: Date };
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    logoUrl?: string;
    gradingScheme?: { type?: string; passThreshold?: number };
}
