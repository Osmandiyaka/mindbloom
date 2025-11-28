export interface CreateTenantCommand {
    name: string;
    subdomain: string;
    plan?: 'free' | 'basic' | 'premium' | 'enterprise';
    status?: 'active' | 'suspended' | 'inactive';
}
