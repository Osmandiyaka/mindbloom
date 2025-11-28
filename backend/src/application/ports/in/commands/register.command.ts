export interface RegisterCommand {
    tenantId: string;
    email: string;
    password: string;
    name: string;
    role?: string;
}
