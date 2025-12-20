export interface LoginCommand {
    email: string;
    password: string;
    tenantId?: string | null;
}
