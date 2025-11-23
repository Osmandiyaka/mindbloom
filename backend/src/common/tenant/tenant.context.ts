import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
    private _tenantId: string | null = null;

    get tenantId(): string {
        if (!this._tenantId) {
            throw new Error('Tenant context not set');
        }
        return this._tenantId;
    }

    setTenantId(tenantId: string): void {
        this._tenantId = tenantId;
    }

    hasTenantId(): boolean {
        return this._tenantId !== null;
    }
}
