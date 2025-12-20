import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { IAuditRepository } from '../../../domain/ports/out/audit-repository.port';
import { AUDIT_REPOSITORY } from '../../../domain/ports/out/repository.tokens';

describe('AuditService', () => {
    let service: AuditService;
    const repoMock: Partial<IAuditRepository> = {
        insert: jest.fn().mockResolvedValue(undefined),
        insertMany: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
        findById: jest.fn().mockResolvedValue(null),
        redact: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditService,
                { provide: AUDIT_REPOSITORY, useValue: repoMock },
            ],
        }).compile();

        service = module.get<AuditService>(AuditService);
    });

    it('should log event without throwing', async () => {
        await service.log({ category: 'TEST', action: 'TEST.A', scope: 'HOST' } as any);
        // confirm repository called
        expect((repoMock.insert as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1);
    });
});
