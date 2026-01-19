import { OrgUnit } from '../../org-units/org-unit.entity';
import { OrgUnitStatus } from '../../org-units/org-unit.types';
import { ORG_UNIT_REPOSITORY } from './repository.tokens';

export type OrgUnitListQuery = {
    tenantId: string;
    parentId?: string | null;
    status?: OrgUnitStatus;
    search?: string;
    limit?: number;
    cursor?: string;
};

export type OrgUnitListResult = {
    items: OrgUnit[];
    nextCursor?: string | null;
};

export interface IOrgUnitRepository {
    findById(id: string, tenantId: string): Promise<OrgUnit | null>;
    findByIds(ids: string[], tenantId: string): Promise<OrgUnit[]>;
    findAll(tenantId: string, status?: OrgUnitStatus): Promise<OrgUnit[]>;
    list(query: OrgUnitListQuery): Promise<OrgUnitListResult>;
    create(unit: OrgUnit): Promise<OrgUnit>;
    update(unit: OrgUnit): Promise<OrgUnit>;
    updateMany(ids: string[], tenantId: string, patch: Partial<OrgUnit>): Promise<void>;
    findDescendants(tenantId: string, orgUnitId: string): Promise<OrgUnit[]>;
}

export { ORG_UNIT_REPOSITORY };
