export interface SchoolRepositoryPort {
    findById(id: string, tenantId: string): Promise<{ id: string } | null>;
}
