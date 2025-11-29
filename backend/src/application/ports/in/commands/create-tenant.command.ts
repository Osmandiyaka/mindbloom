export interface CreateTenantCommand {
    name: string;
    subdomain: string;
    contactEmail: string;
    ownerId?: string;
    plan?: 'trial' | 'free' | 'basic' | 'premium' | 'enterprise';
    status?: 'pending' | 'active' | 'suspended' | 'inactive';
    contactPhone?: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
}
