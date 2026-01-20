import { Inject, Injectable, Logger } from '@nestjs/common';
import { AUDIT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { IAuditRepository, AuditEventInput, AuditQuery, PagedResult, AuditEvent } from '../../../domain/ports/out/audit-repository.port';
// lightweight in-file helpers (avoid extra deps)
function computeSimpleDiff(before: any, after: any): any {
    if (!before || !after) return null;
    const diffs: any = {};

    function walk(b: any, a: any, path: string[]) {
        const keys = new Set<string>([...(b ? Object.keys(b) : []), ...(a ? Object.keys(a) : [])]);
        for (const k of keys) {
            const pb = b ? b[k] : undefined;
            const pa = a ? a[k] : undefined;
            const p = [...path, k];
            if (typeof pb === 'object' && pb !== null && typeof pa === 'object' && pa !== null) {
                walk(pb, pa, p);
            } else if (JSON.stringify(pb) !== JSON.stringify(pa)) {
                diffs[p.join('.')] = { from: pb === undefined ? null : pb, to: pa === undefined ? null : pa };
            }
        }
    }

    walk(before, after, []);
    return Object.keys(diffs).length ? diffs : null;
}

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);
    private readonly disabled = process.env.AUDIT_DISABLED === 'true';

    constructor(@Inject(AUDIT_REPOSITORY) private readonly repo: IAuditRepository) { }

    async log(input: AuditEventInput): Promise<void> {
        if (this.disabled) return;
        try {
            // compute a simple diff if before/after provided
            if (input.before && input.after && !input.diff) {
                try {
                    const diffs = computeSimpleDiff(input.before, input.after);
                    input.diff = diffs;
                    input.changedFields = diffs ? Object.keys(diffs) : [];
                } catch (e) {
                    // ignore diff errors
                }
            }

            await this.repo.insert(input);
        } catch (err) {
            // auditing must not block the business flow
            this.logger.error('Failed to write audit event', err as any);
        }
    }

    async logMany(inputs: AuditEventInput[]): Promise<void> {
        if (this.disabled) return;
        try {
            await this.repo.insertMany(inputs);
        } catch (err) {
            this.logger.error('Failed to write multiple audit events', err as any);
        }
    }

    async query(filters: AuditQuery): Promise<PagedResult<AuditEvent>> {
        return this.repo.query(filters);
    }

    async findById(id: string): Promise<AuditEvent | null> {
        return this.repo.findById(id);
    }

    async exportCsv(filters: AuditQuery): Promise<string> {
        const res = await this.repo.query({ ...filters, page: 1, pageSize: 10000 });
        const items = res.items || [];

        // Build CSV manually
        const header = ['timestamp', 'tenantId', 'actor', 'action', 'category', 'result', 'message'];
        const rows = [header.join(',')];

        for (const i of items) {
            const row = [
                `"${new Date(i.timestamp).toISOString()}"`,
                `"${(i as any).tenantId ?? ''}"`,
                `"${((i as any).actorEmailSnapshot ?? '').replace(/"/g, '""')}"`,
                `"${((i as any).action ?? '').replace(/"/g, '""')}"`,
                `"${((i as any).category ?? '').replace(/"/g, '""')}"`,
                `"${((i as any).result ?? '').replace(/"/g, '""')}"`,
                `"${((i as any).message ?? '').replace(/"/g, '""')}"`,
            ];
            rows.push(row.join(','));
        }

        return rows.join('\n');
    }

    async redact(id: string, strategy: 'PARTIAL' | 'FULL') {
        await this.repo.redact(id, strategy);
    }
}
