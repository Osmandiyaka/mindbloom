import { AuditEventInput } from '../../../domain/ports/out/audit-repository.port';

export interface AuditLogPort {
    log(event: AuditEventInput): Promise<void>;
}
