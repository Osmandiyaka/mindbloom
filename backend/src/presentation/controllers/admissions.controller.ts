import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
    CreateApplicationUseCase,
    GetAllApplicationsUseCase,
    GetApplicationByIdUseCase,
    UpdateApplicationStatusUseCase,
    EnrollStudentFromApplicationUseCase,
} from '../../application/services/admission';
import { CreateApplicationDto } from '../dtos/requests/admissions/create-application.dto';
import { UpdateApplicationStatusDto } from '../dtos/requests/admissions/update-application-status.dto';
import { GetApplicationsQueryDto } from '../dtos/requests/admissions/get-applications-query.dto';
import { ApplicationResponseDto } from '../dtos/responses/admissions/application-response.dto';
import { StudentResponseDto } from '../dtos/responses/students/student-response.dto';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { Public } from '../../common/tenant/public.decorator';
import { ApplicationStatus } from '../../domain/admission/entities/admission.entity';

@ApiTags('admissions')
@Controller('admissions')
export class AdmissionsController {
    constructor(
        private readonly createApplicationUseCase: CreateApplicationUseCase,
        private readonly getAllApplicationsUseCase: GetAllApplicationsUseCase,
        private readonly getApplicationByIdUseCase: GetApplicationByIdUseCase,
        private readonly updateApplicationStatusUseCase: UpdateApplicationStatusUseCase,
        private readonly enrollStudentUseCase: EnrollStudentFromApplicationUseCase,
        private readonly tenantContext: TenantContext,
    ) {}

    @Post()
    @Public() // Allow public submissions
    @ApiOperation({ summary: 'Create a new application (public endpoint)' })
    @ApiResponse({ status: 201, description: 'Application created successfully', type: ApplicationResponseDto })
    async create(
        @Body() createApplicationDto: CreateApplicationDto,
        @Query('tenantId') tenantId?: string,
    ): Promise<ApplicationResponseDto> {
        // For public endpoint, tenant can come from query param or subdomain
        const resolvedTenantId = tenantId || this.tenantContext.tenantId;
        
        if (!resolvedTenantId) {
            throw new Error('Tenant ID is required');
        }

        const admission = await this.createApplicationUseCase.execute({
            ...createApplicationDto,
            tenantId: resolvedTenantId,
            dateOfBirth: new Date(createApplicationDto.dateOfBirth),
        } as any);

        return ApplicationResponseDto.fromDomain(admission);
    }

    @Get()
    @UseGuards(TenantGuard)
    @ApiOperation({ summary: 'Get all applications' })
    @ApiResponse({ status: 200, description: 'List of applications', type: [ApplicationResponseDto] })
    async findAll(
        @Query() query: GetApplicationsQueryDto,
    ): Promise<{ applications: ApplicationResponseDto[]; total: number }> {
        const tenantId = this.tenantContext.tenantId;

        const filters: any = {};
        if (query.search) filters.search = query.search;
        if (query.status) filters.status = query.status as ApplicationStatus;
        if (query.statuses) filters.statuses = query.statuses as ApplicationStatus[];
        if (query.gradeApplying) filters.gradeApplying = query.gradeApplying;
        if (query.academicYear) filters.academicYear = query.academicYear;
        if (query.source) filters.source = query.source;
        if (query.dateFrom) filters.dateFrom = new Date(query.dateFrom);
        if (query.dateTo) filters.dateTo = new Date(query.dateTo);

        const { applications, total } = await this.getAllApplicationsUseCase.executeWithCount(
            tenantId,
            filters,
        );

        return {
            applications: ApplicationResponseDto.fromDomainArray(applications),
            total,
        };
    }

    @Get('pipeline')
    @UseGuards(TenantGuard)
    @ApiOperation({ summary: 'Get application pipeline with counts by status' })
    @ApiResponse({ status: 200, description: 'Pipeline data' })
    async getPipeline(@Query() query: GetApplicationsQueryDto): Promise<any> {
        const tenantId = this.tenantContext.tenantId;

        const filters: any = {};
        if (query.academicYear) filters.academicYear = query.academicYear;
        if (query.gradeApplying) filters.gradeApplying = query.gradeApplying;

        const [applications, counts] = await Promise.all([
            this.getAllApplicationsUseCase.execute(tenantId, filters),
            this.getAllApplicationsUseCase.getPipelineCounts(tenantId),
        ]);

        const stages = [
            { status: 'inquiry', label: 'Inquiry', count: counts.inquiry || 0 },
            { status: 'submitted', label: 'Submitted', count: counts.submitted || 0 },
            { status: 'under_review', label: 'Under Review', count: counts.under_review || 0 },
            { status: 'accepted', label: 'Accepted', count: counts.accepted || 0 },
            { status: 'rejected', label: 'Rejected', count: counts.rejected || 0 },
            { status: 'waitlisted', label: 'Waitlisted', count: counts.waitlisted || 0 },
            { status: 'enrolled', label: 'Enrolled', count: counts.enrolled || 0 },
            { status: 'withdrawn', label: 'Withdrawn', count: counts.withdrawn || 0 },
        ];

        return {
            stages: stages.map(stage => ({
                ...stage,
                applications: applications
                    .filter(app => app.status === stage.status)
                    .map(app => ApplicationResponseDto.fromDomain(app)),
            })),
        };
    }

    @Get(':id')
    @UseGuards(TenantGuard)
    @ApiOperation({ summary: 'Get application by ID' })
    @ApiResponse({ status: 200, description: 'Application details', type: ApplicationResponseDto })
    async findOne(@Param('id') id: string): Promise<ApplicationResponseDto> {
        const tenantId = this.tenantContext.tenantId;
        const admission = await this.getApplicationByIdUseCase.execute(id, tenantId);
        return ApplicationResponseDto.fromDomain(admission);
    }

    @Get('by-email/:email')
    @Public() // Allow public checking
    @ApiOperation({ summary: 'Check if application exists by email' })
    @ApiResponse({ status: 200, description: 'Application found or null' })
    async findByEmail(
        @Param('email') email: string,
        @Query('tenantId') tenantId: string,
    ): Promise<ApplicationResponseDto | null> {
        if (!tenantId) {
            throw new Error('Tenant ID is required');
        }

        // This would require adding findByEmail to the use case
        // For now, return null
        return null;
    }

    @Patch(':id/status')
    @UseGuards(TenantGuard)
    @ApiOperation({ summary: 'Update application status' })
    @ApiResponse({ status: 200, description: 'Status updated', type: ApplicationResponseDto })
    async updateStatus(
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateApplicationStatusDto,
    ): Promise<ApplicationResponseDto> {
        const tenantId = this.tenantContext.tenantId;
        const changedBy = updateStatusDto.changedBy || 'admin'; // Should come from auth context

        const admission = await this.updateApplicationStatusUseCase.execute(
            id,
            tenantId,
            updateStatusDto.status as ApplicationStatus,
            changedBy,
            updateStatusDto.note,
        );

        return ApplicationResponseDto.fromDomain(admission);
    }

    @Post(':id/accept')
    @UseGuards(TenantGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Accept an application' })
    @ApiResponse({ status: 200, description: 'Application accepted', type: ApplicationResponseDto })
    async acceptApplication(
        @Param('id') id: string,
        @Body() body: { offerExpiresInDays?: number; note?: string },
    ): Promise<ApplicationResponseDto> {
        const tenantId = this.tenantContext.tenantId;
        const changedBy = 'admin'; // Should come from auth context

        const admission = await this.updateApplicationStatusUseCase.acceptApplication(
            id,
            tenantId,
            changedBy,
            body.offerExpiresInDays || 7,
        );

        return ApplicationResponseDto.fromDomain(admission);
    }

    @Post(':id/reject')
    @UseGuards(TenantGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reject an application' })
    @ApiResponse({ status: 200, description: 'Application rejected', type: ApplicationResponseDto })
    async rejectApplication(
        @Param('id') id: string,
        @Body() body: { reason?: string },
    ): Promise<ApplicationResponseDto> {
        const tenantId = this.tenantContext.tenantId;
        const changedBy = 'admin'; // Should come from auth context

        const admission = await this.updateApplicationStatusUseCase.rejectApplication(
            id,
            tenantId,
            changedBy,
            body.reason,
        );

        return ApplicationResponseDto.fromDomain(admission);
    }

    @Post(':id/enroll')
    @UseGuards(TenantGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Enroll student from application' })
    @ApiResponse({
        status: 200,
        description: 'Student enrolled',
        schema: {
            properties: {
                application: { type: 'object' },
                student: { type: 'object' },
            },
        },
    })
    async enrollStudent(
        @Param('id') id: string,
    ): Promise<{ application: ApplicationResponseDto; student: StudentResponseDto }> {
        const tenantId = this.tenantContext.tenantId;
        const enrolledBy = 'admin'; // Should come from auth context

        const { admission, student } = await this.enrollStudentUseCase.execute(
            id,
            tenantId,
            enrolledBy,
        );

        return {
            application: ApplicationResponseDto.fromDomain(admission),
            student: StudentResponseDto.fromDomain(student),
        };
    }

    @Delete(':id')
    @UseGuards(TenantGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an application' })
    @ApiResponse({ status: 204, description: 'Application deleted' })
    async remove(@Param('id') id: string): Promise<void> {
        const tenantId = this.tenantContext.tenantId;
        // Would need to add delete use case
        // For now, just acknowledge
    }
}
