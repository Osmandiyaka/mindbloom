import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { CreateAcademicRecordUseCase } from '../../application/services/academics/create-academic-record.use-case';
import { ListAcademicRecordsUseCase } from '../../application/services/academics/list-academic-records.use-case';
import { UpdateAcademicRecordUseCase } from '../../application/services/academics/update-academic-record.use-case';
import { DeleteAcademicRecordUseCase } from '../../application/services/academics/delete-academic-record.use-case';
import { CreateAcademicRecordDto } from '../../presentation/dtos/requests/academics/create-academic-record.dto';
import { ListAcademicRecordsDto } from '../../presentation/dtos/requests/academics/list-academic-records.dto';
import { UpdateAcademicRecordDto } from '../../presentation/dtos/requests/academics/update-academic-record.dto';
import { AcademicRecord } from '../../domain/academics/entities/academic-record.entity';

@ApiTags('academics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('students/:studentId/academics')
export class AcademicsController {
    constructor(
        private readonly createRecord: CreateAcademicRecordUseCase,
        private readonly listRecords: ListAcademicRecordsUseCase,
        private readonly updateRecord: UpdateAcademicRecordUseCase,
        private readonly deleteRecord: DeleteAcademicRecordUseCase,
        private readonly tenantContext: TenantContext,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List academic records for a student' })
    async findAll(
        @Param('studentId') studentId: string,
        @Query() query: ListAcademicRecordsDto,
    ): Promise<AcademicRecord[]> {
        const tenantId = this.tenantContext.tenantId;
        return this.listRecords.execute(tenantId, {
            studentId,
            subject: query.subject,
            exam: query.exam,
            term: query.term,
            academicYear: query.academicYear,
        });
    }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Create an academic record for a student' })
    async create(
        @Param('studentId') studentId: string,
        @Body() dto: CreateAcademicRecordDto,
    ): Promise<AcademicRecord> {
        const tenantId = this.tenantContext.tenantId;
        return this.createRecord.execute({
            tenantId,
            studentId,
            subject: dto.subject,
            exam: dto.exam,
            term: dto.term,
            academicYear: dto.academicYear,
            class: dto.class,
            section: dto.section,
            score: dto.score,
            grade: dto.grade,
            remarks: dto.remarks,
            recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
            recordedBy: dto.recordedBy,
        });
    }

    @Patch(':id')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Update academic record' })
    async update(
        @Param('studentId') studentId: string,
        @Param('id') id: string,
        @Body() dto: UpdateAcademicRecordDto,
    ): Promise<AcademicRecord> {
        const tenantId = this.tenantContext.tenantId;
        return this.updateRecord.execute({
            tenantId,
            id,
            score: dto.score,
            grade: dto.grade,
            remarks: dto.remarks,
        });
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete academic record' })
    async delete(
        @Param('studentId') studentId: string,
        @Param('id') id: string,
    ): Promise<void> {
        const tenantId = this.tenantContext.tenantId;
        await this.deleteRecord.execute(id, tenantId);
    }
}
