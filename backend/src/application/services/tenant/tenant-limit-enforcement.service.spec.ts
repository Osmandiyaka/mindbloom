import { expect, jest } from '@jest/globals';
import { TenantLimitEnforcementService } from './tenant-limit-enforcement.service';
import { TenantLimitExceededException } from '../../../domain/exceptions/tenant-limit.exception';
import { StudentStatus } from '../../../domain/student/entities/student.entity';

describe('TenantLimitEnforcementService', () => {
    const features = { getInt: jest.fn() } as any;
    const studentRepository = { count: jest.fn() } as any;
    const events = { publish: jest.fn() } as any;

    const tenantId = 't-1';

    let service: TenantLimitEnforcementService;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(0);
        service = new TenantLimitEnforcementService(studentRepository, features, events);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('allows creating a student when under limit', async () => {
        features.getInt.mockResolvedValue(100);
        studentRepository.count.mockResolvedValue(10);

        await service.assertCanCreateStudent(tenantId);

        expect(studentRepository.count).toHaveBeenCalledWith(tenantId, { status: StudentStatus.ACTIVE });
        expect(events.publish).not.toHaveBeenCalled();
    });

    it('warns once when crossing threshold', async () => {
        features.getInt.mockResolvedValue(100);
        studentRepository.count.mockResolvedValue(79);

        await service.assertCanCreateStudent(tenantId);
        await service.assertCanCreateStudent(tenantId);

        expect(events.publish).toHaveBeenCalledTimes(1);
        expect(events.publish).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ tenantId, limitKey: 'limits.students.max', projected: 80, max: 100 }),
            tenantId,
        );
    });

    it('throws when projected students exceed limit', async () => {
        features.getInt.mockResolvedValue(1);
        studentRepository.count.mockResolvedValue(1);

        await expect(service.assertCanCreateStudent(tenantId)).rejects.toBeInstanceOf(TenantLimitExceededException);
        expect(events.publish).toHaveBeenCalledTimes(1);
    });
});
