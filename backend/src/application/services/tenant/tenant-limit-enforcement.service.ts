import { Inject, Injectable, Logger } from '@nestjs/common';
import { EffectiveFeatureResolver } from '../features/effective-feature-resolver.service';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/ports/out/student-repository.port';
import { StudentStatus } from '../../../domain/student/entities/student.entity';
import { TenantLimitExceededException } from '../../../domain/exceptions/tenant-limit.exception';
import { EventBus, PlatformEvent } from '../../../core/plugins/event-bus.service';

@Injectable()
export class TenantLimitEnforcementService {
    private readonly logger = new Logger(TenantLimitEnforcementService.name);
    private readonly warnDedup = new Map<string, number>();
    private readonly warnThresholdRatio = 0.8; // Warn when projected usage crosses 80%
    private readonly warnTtlMs = 5 * 60 * 1000; // Deduplicate warnings for 5 minutes

    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
        private readonly features: EffectiveFeatureResolver,
        private readonly events: EventBus,
    ) { }

    async assertCanCreateStudent(tenantId: string): Promise<void> {
        const maxStudents = await this.features.getInt(tenantId, 'limits.students.max');
        if (maxStudents < 0) {
            return; // Unlimited
        }

        const current = await this.studentRepository.count(tenantId, { status: StudentStatus.ACTIVE });
        const projected = current + 1;

        this.maybeWarn('limits.students.max', tenantId, current, projected, maxStudents);

        if (projected > maxStudents) {
            throw new TenantLimitExceededException(tenantId, 'limits.students.max', maxStudents, projected);
        }
    }

    private maybeWarn(limitKey: string, tenantId: string, current: number, projected: number, max: number): void {
        if (max <= 0) return;

        const threshold = Math.ceil(max * this.warnThresholdRatio);
        if (projected < threshold) return;

        const cacheKey = `${tenantId}:${limitKey}`;
        const now = Date.now();
        const expiresAt = this.warnDedup.get(cacheKey) || 0;
        if (expiresAt > now) return;

        this.warnDedup.set(cacheKey, now + this.warnTtlMs);

        this.events.publish(PlatformEvent.TENANT_LIMIT_THRESHOLD_REACHED, {
            tenantId,
            limitKey,
            max,
            current,
            projected,
        }, tenantId);

        this.logger.warn(`Tenant ${tenantId} is nearing limit ${limitKey}: projected ${projected}/${max}`);
    }
}
