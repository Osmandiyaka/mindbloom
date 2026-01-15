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
    UseInterceptors,
    UploadedFile,
    Res,
    StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import {
    CreateStudentUseCase,
    GetAllStudentsUseCase,
    GetStudentByIdUseCase,
    UpdateStudentUseCase,
    DeleteStudentUseCase,
    BulkDeleteStudentsUseCase,
    GetStudentArchiveImpactUseCase,
} from '../../application/services/student';
import { AuditService } from '../../application/services/audit/audit.service';
import { AddGuardianToStudentUseCase } from '../../application/services/student/add-guardian-to-student.use-case';
import { UpdateStudentEnrollmentUseCase } from '../../application/services/student/update-student-enrollment.use-case';
import { CreateStudentDto } from '../dtos/requests/students/create-student.dto';
import { UpdateStudentDto } from '../dtos/requests/students/update-student.dto';
import { BulkStudentIdsDto } from '../dtos/requests/students/bulk-student-ids.dto';
import { StudentResponseDto } from '../dtos/responses/students/student-response.dto';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantContext } from '../../common/tenant/tenant.context';

@ApiTags('students')
@Controller('students')
@UseGuards(TenantGuard)
export class StudentsController {
    constructor(
        private readonly createStudentUseCase: CreateStudentUseCase,
        private readonly getAllStudentsUseCase: GetAllStudentsUseCase,
        private readonly getStudentByIdUseCase: GetStudentByIdUseCase,
        private readonly updateStudentUseCase: UpdateStudentUseCase,
        private readonly deleteStudentUseCase: DeleteStudentUseCase,
        private readonly bulkDeleteStudentsUseCase: BulkDeleteStudentsUseCase,
        private readonly getStudentArchiveImpactUseCase: GetStudentArchiveImpactUseCase,
        private readonly addGuardianUseCase: AddGuardianToStudentUseCase,
        private readonly updateEnrollmentUseCase: UpdateStudentEnrollmentUseCase,
        private readonly tenantContext: TenantContext,
        private readonly auditService: AuditService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new student' })
    @ApiResponse({ status: 201, description: 'Student created successfully', type: StudentResponseDto })
    async create(@Body() createStudentDto: CreateStudentDto): Promise<StudentResponseDto> {
        const tenantId = this.tenantContext.tenantId;
        const student = await this.createStudentUseCase.execute({
            ...(createStudentDto as any),
            tenantId,
        });
        return StudentResponseDto.fromDomain(student);
    }

    @Get()
    @ApiOperation({ summary: 'Get all students' })
    @ApiResponse({ status: 200, description: 'List of students', type: [StudentResponseDto] })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'schoolId', required: false })
    @ApiQuery({ name: 'class', required: false })
    @ApiQuery({ name: 'section', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'academicYear', required: false })
    @ApiQuery({ name: 'gender', required: false })
    async findAll(
        @Query('search') search?: string,
        @Query('schoolId') schoolId?: string,
        @Query('class') classFilter?: string,
        @Query('section') section?: string,
        @Query('status') status?: string,
        @Query('academicYear') academicYear?: string,
        @Query('gender') gender?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sort') sort?: string,
    ): Promise<StudentResponseDto[]> {
        const tenantId = this.tenantContext.tenantId;
        const filters = {
            search,
            schoolId,
            class: classFilter,
            section,
            status,
            academicYear,
            gender,
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined,
            sort,
        };
        const students = await this.getAllStudentsUseCase.execute(tenantId, filters);
        return students.map(StudentResponseDto.fromDomain);
    }

    @Get('filters')
    @ApiOperation({ summary: 'Get student filter options with counts' })
    async getFilters(
        @Query('search') search?: string,
        @Query('schoolId') schoolId?: string,
        @Query('class') classFilter?: string,
        @Query('section') section?: string,
        @Query('status') status?: string,
        @Query('academicYear') academicYear?: string,
        @Query('gender') gender?: string,
    ): Promise<any> {
        const tenantId = this.tenantContext.tenantId;
        const filters = {
            search,
            schoolId,
            class: classFilter,
            section,
            status,
            academicYear,
            gender,
        };
        return this.getAllStudentsUseCase.getFilterStats(tenantId, filters);
    }

    @Get('export')
    @ApiOperation({ summary: 'Export students to CSV' })
    @ApiResponse({ status: 200, description: 'CSV file' })
    async exportStudents(
        @Query('search') search?: string,
        @Query('schoolId') schoolId?: string,
        @Query('class') classFilter?: string,
        @Query('section') section?: string,
        @Query('status') status?: string,
        @Query('academicYear') academicYear?: string,
        @Query('gender') gender?: string,
        @Res({ passthrough: true }) res?: Response,
    ): Promise<StreamableFile> {
        const tenantId = this.tenantContext.tenantId;
        const filters = {
            search,
            schoolId,
            class: classFilter,
            section,
            status,
            academicYear,
            gender,
        };

        const students = await this.getAllStudentsUseCase.execute(tenantId, filters);

        // Generate CSV
        const headers = [
            'ID', 'First Name', 'Last Name', 'Middle Name', 'Date of Birth', 'Gender',
            'Email', 'Phone', 'Nationality', 'Religion',
            'Street', 'City', 'State', 'Postal Code', 'Country',
            'Admission Number', 'Admission Date', 'Academic Year', 'Class', 'Section',
            'Status', 'Blood Group',
        ];

        const rows = students.map(student => [
            student.id,
            student.firstName,
            student.lastName,
            student.middleName || '',
            student.dateOfBirth.toISOString().split('T')[0],
            student.gender,
            student.email || '',
            student.phone || '',
            student.nationality || '',
            student.religion || '',
            student.address?.street || '',
            student.address?.city || '',
            student.address?.state || '',
            student.address?.postalCode || '',
            student.address?.country || '',
            student.enrollment.admissionNumber,
            student.enrollment.admissionDate.toISOString().split('T')[0],
            student.enrollment.academicYear,
            student.enrollment.class,
            student.enrollment.section || '',
            student.status,
            student.medicalInfo?.bloodGroup || '',
        ]);

        const csv = [headers.join(','), ...rows.map(row => row.map(cell => this.escapeCSV(cell)).join(','))].join('\n');

        const buffer = Buffer.from(csv, 'utf-8');

        if (res) {
            res.set({
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="students_export_${new Date().toISOString().split('T')[0]}.csv"`,
            });
        }

        return new StreamableFile(buffer);
    }

    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Import students from CSV file' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 200, description: 'Import result' })
    async importStudents(
        @UploadedFile() file: any,
        @Query('schoolId') schoolId?: string,
    ): Promise<any> {
        const tenantId = this.tenantContext.tenantId;

        if (!file) {
            throw new Error('No file uploaded');
        }

        // Parse CSV file
        const content = file.buffer.toString('utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            throw new Error('File must contain at least a header row and one data row');
        }

        const headers = this.parseCSVLine(lines[0]);
        const results = {
            total: 0,
            successful: 0,
            failed: 0,
            errors: [] as any[],
        };

        for (let i = 1; i < lines.length; i++) {
            try {
                const values = this.parseCSVLine(lines[i]);

                // Skip empty rows
                if (values.every(v => !v || v.trim() === '')) continue;

                results.total++;

                const studentData = this.mapCSVToStudent(headers, values);
                if (schoolId && !studentData.schoolId) {
                    studentData.schoolId = schoolId;
                }
                await this.createStudentUseCase.execute({
                    ...studentData,
                    tenantId,
                });
                results.successful++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: i + 1,
                    message: error.message,
                });
            }
        }

        return results;
    }

    @Post('archive/impact')
    @ApiOperation({ summary: 'Preview bulk archive impact' })
    async previewArchiveImpact(@Body() body: BulkStudentIdsDto): Promise<any> {
        const tenantId = this.tenantContext.tenantId;
        return this.getStudentArchiveImpactUseCase.execute(body.ids, tenantId);
    }

    @Post('archive')
    @ApiOperation({ summary: 'Archive students in bulk' })
    async bulkArchive(@Body() body: BulkStudentIdsDto): Promise<{ deleted: number }> {
        const tenantId = this.tenantContext.tenantId;
        const deleted = await this.bulkDeleteStudentsUseCase.execute(body.ids, tenantId);
        return { deleted };
    }

    @Get(':id/activity')
    @ApiOperation({ summary: 'Get student activity feed' })
    async activity(
        @Param('id') id: string,
        @Query('category') category?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
    ): Promise<any[]> {
        const tenantId = this.tenantContext.tenantId;
        const results = await this.auditService.query({
            tenantId,
            targetType: 'student',
            targetId: id,
            category: category && category !== 'all' ? category : undefined,
            page: page ? Number(page) : 1,
            pageSize: pageSize ? Number(pageSize) : 20,
        });
        return results.items.map((event) => ({
            id: event.id,
            title: event.action,
            category: event.category,
            createdAt: event.timestamp,
            actor: event.actorEmailSnapshot ?? 'System',
            metadata: event.message ?? undefined,
        }));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get student by ID' })
    @ApiResponse({ status: 200, description: 'Student found', type: StudentResponseDto })
    @ApiResponse({ status: 404, description: 'Student not found' })
    async findOne(@Param('id') id: string): Promise<StudentResponseDto> {
        const tenantId = this.tenantContext.tenantId;
        const student = await this.getStudentByIdUseCase.execute(id, tenantId);
        return StudentResponseDto.fromDomain(student);
    }

    @Get(':id/guardians')
    @ApiOperation({ summary: 'Get student guardians' })
    @ApiResponse({ status: 200, description: 'Student guardians' })
    async getGuardians(@Param('id') id: string) {
        const tenantId = this.tenantContext.tenantId;
        const student = await this.getStudentByIdUseCase.execute(id, tenantId);
        return student.guardians || [];
    }

    @Get(':id/documents')
    @ApiOperation({ summary: 'Get student documents' })
    @ApiResponse({ status: 200, description: 'Student documents' })
    async getDocuments(@Param('id') id: string) {
        const tenantId = this.tenantContext.tenantId;
        const student = await this.getStudentByIdUseCase.execute(id, tenantId);
        return student.documents || [];
    }

    @Get(':id/notes')
    @ApiOperation({ summary: 'Get student notes' })
    @ApiResponse({ status: 200, description: 'Student notes' })
    async getNotes(@Param('id') id: string) {
        const tenantId = this.tenantContext.tenantId;
        await this.getStudentByIdUseCase.execute(id, tenantId);
        return [];
    }

    @Get(':id/academics')
    @ApiOperation({ summary: 'Get student academics' })
    @ApiResponse({ status: 200, description: 'Student academics' })
    async getAcademics(@Param('id') id: string) {
        const tenantId = this.tenantContext.tenantId;
        await this.getStudentByIdUseCase.execute(id, tenantId);
        return { subjects: [], terms: [] };
    }

    @Get(':id/fees')
    @ApiOperation({ summary: 'Get student fees summary' })
    @ApiResponse({ status: 200, description: 'Student fees' })
    async getFees(@Param('id') id: string) {
        const tenantId = this.tenantContext.tenantId;
        await this.getStudentByIdUseCase.execute(id, tenantId);
        return { summary: { balance: null, paidYtd: null, outstandingCount: 0 }, invoices: [], payments: [] };
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update student' })
    @ApiResponse({ status: 200, description: 'Student updated successfully', type: StudentResponseDto })
    @ApiResponse({ status: 404, description: 'Student not found' })
    async update(
        @Param('id') id: string,
        @Body() updateStudentDto: UpdateStudentDto,
    ): Promise<StudentResponseDto> {
        const tenantId = this.tenantContext.tenantId;
        const student = await this.updateStudentUseCase.execute({
            id,
            tenantId,
            ...(updateStudentDto as any),
        });
        return StudentResponseDto.fromDomain(student);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete student' })
    @ApiResponse({ status: 204, description: 'Student deleted successfully' })
    @ApiResponse({ status: 404, description: 'Student not found' })
    async remove(@Param('id') id: string): Promise<void> {
        const tenantId = this.tenantContext.tenantId;
        await this.deleteStudentUseCase.execute(id, tenantId);
    }

    @Post(':id/guardians')
    @ApiOperation({ summary: 'Add a guardian to student' })
    @ApiResponse({ status: 200, description: 'Guardian added successfully', type: StudentResponseDto })
    async addGuardian(
        @Param('id') id: string,
        @Body() guardianDto: any,
    ): Promise<StudentResponseDto> {
        const tenantId = this.tenantContext.tenantId;
        const student = await this.addGuardianUseCase.execute({
            studentId: id,
            tenantId,
            ...guardianDto,
        });
        return StudentResponseDto.fromDomain(student);
    }

    @Patch(':id/enrollment')
    @ApiOperation({ summary: 'Update student enrollment information' })
    @ApiResponse({ status: 200, description: 'Enrollment updated successfully', type: StudentResponseDto })
    async updateEnrollment(
        @Param('id') id: string,
        @Body() enrollmentDto: any,
    ): Promise<StudentResponseDto> {
        const tenantId = this.tenantContext.tenantId;
        const student = await this.updateEnrollmentUseCase.execute({
            studentId: id,
            tenantId,
            ...enrollmentDto,
        });
        return StudentResponseDto.fromDomain(student);
    }

    private parseCSVLine(line: string): string[] {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current.trim());
        return values;
    }

    private mapCSVToStudent(headers: string[], values: string[]): any {
        const data: any = {
            guardians: [],
            enrollment: {},
        };

        headers.forEach((header, index) => {
            const value = values[index]?.trim();
            const key = header.toLowerCase().replace(/\s+/g, '');

            if (!value) return;

            // Map fields
            switch (key) {
                case 'firstname':
                    data.firstName = value;
                    break;
                case 'lastname':
                    data.lastName = value;
                    break;
                case 'middlename':
                    data.middleName = value;
                    break;
                case 'dateofbirth':
                    data.dateOfBirth = new Date(value);
                    break;
                case 'gender':
                    data.gender = value;
                    break;
                case 'email':
                    data.email = value;
                    break;
                case 'phone':
                    data.phone = value;
                    break;
                case 'schoolid':
                    data.schoolId = value;
                    break;
                case 'nationality':
                    data.nationality = value;
                    break;
                case 'religion':
                    data.religion = value;
                    break;
                case 'street':
                case 'city':
                case 'state':
                case 'postalcode':
                case 'country':
                    if (!data.address) data.address = {};
                    data.address[key === 'postalcode' ? 'postalCode' : key] = value;
                    break;
                case 'admissionnumber':
                    data.enrollment.admissionNumber = value;
                    break;
                case 'admissiondate':
                    data.enrollment.admissionDate = new Date(value);
                    break;
                case 'academicyear':
                    data.enrollment.academicYear = value;
                    break;
                case 'class':
                    data.enrollment.class = value;
                    break;
                case 'section':
                    data.enrollment.section = value;
                    break;
                case 'guardianname':
                case 'guardianrelationship':
                case 'guardianphone':
                case 'guardianemail':
                    if (!data.guardians[0]) {
                        data.guardians[0] = { isPrimary: true, isEmergencyContact: true };
                    }
                    const guardianKey = key.replace('guardian', '');
                    data.guardians[0][guardianKey] = value;
                    break;
            }
        });

        return data;
    }

    private escapeCSV(value: any): string {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }
}
