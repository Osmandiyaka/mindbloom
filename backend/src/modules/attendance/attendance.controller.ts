import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { FeatureGateGuard } from '../../common/guards/feature-gate.guard';
import { RequiresFeature } from '../../common/decorators/requires-feature.decorator';
import { RecordAttendanceUseCase } from '../../application/services/attendance/record-attendance.use-case';
import { UpdateAttendanceUseCase } from '../../application/services/attendance/update-attendance.use-case';
import { ListAttendanceUseCase } from '../../application/services/attendance/list-attendance.use-case';
import { DeleteAttendanceUseCase } from '../../application/services/attendance/delete-attendance.use-case';
import { CreateAttendanceDto } from '../../presentation/dtos/requests/attendance/create-attendance.dto';
import { UpdateAttendanceDto } from '../../presentation/dtos/requests/attendance/update-attendance.dto';
import { ListAttendanceDto } from '../../presentation/dtos/requests/attendance/list-attendance.dto';
import { AttendanceRecord } from '../../domain/attendance/entities/attendance-record.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, FeatureGateGuard)
@RequiresFeature('modules.attendance.enabled')
@Controller('students/:studentId/attendance')
export class AttendanceController {
  constructor(
    private readonly recordAttendance: RecordAttendanceUseCase,
    private readonly updateAttendance: UpdateAttendanceUseCase,
    private readonly listAttendance: ListAttendanceUseCase,
    private readonly deleteAttendance: DeleteAttendanceUseCase,
    private readonly tenantContext: TenantContext,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Record attendance for a student' })
  @ApiResponse({ status: 201, type: AttendanceRecord })
  async create(
    @Param('studentId') studentId: string,
    @Body() dto: CreateAttendanceDto,
  ): Promise<AttendanceRecord> {
    const tenantId = this.tenantContext.tenantId;
    return this.recordAttendance.execute({
      tenantId,
      studentId,
      class: dto.class,
      section: dto.section,
      date: new Date(dto.date),
      status: dto.status,
      reason: dto.reason,
      recordedBy: dto.recordedBy,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List attendance records' })
  async findAll(
    @Param('studentId') studentId: string,
    @Query() query: ListAttendanceDto,
  ): Promise<AttendanceRecord[]> {
    const tenantId = this.tenantContext.tenantId;
    return this.listAttendance.execute(tenantId, {
      studentId,
      class: query.class,
      section: query.section,
      status: query.status,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an attendance record' })
  async update(
    @Param('studentId') studentId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
  ): Promise<AttendanceRecord> {
    const tenantId = this.tenantContext.tenantId;
    return this.updateAttendance.execute({
      tenantId,
      id,
      status: dto.status,
      reason: dto.reason,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an attendance record' })
  async remove(
    @Param('studentId') studentId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const tenantId = this.tenantContext.tenantId;
    await this.deleteAttendance.execute(id, tenantId);
  }
}
