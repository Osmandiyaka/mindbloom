import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLogSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/audit.schema';
import { MongooseAuditRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-audit.repository';
import { AUDIT_REPOSITORY } from '../../domain/ports/out/repository.tokens';
import { AuditService } from '../../application/services/audit/audit.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: 'AuditLog', schema: AuditLogSchema }])],
    providers: [
        { provide: AUDIT_REPOSITORY, useClass: MongooseAuditRepository },
        AuditService,
    ],
    exports: [AuditService],
})
export class AuditModule { }
