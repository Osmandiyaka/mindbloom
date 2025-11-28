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
} from '../../application/services/student';
import { AddGuardianToStudentUseCase } from '../../application/services/student/add-guardian-to-student.use-case';
import { UpdateStudentEnrollmentUseCase } from '../../application/services/student/update-student-enrollment.use-case';
import { CreateStudentDto } from '../dtos/requests/students/create-student.dto';
import { UpdateStudentDto } from '../dtos/requests/students/update-student.dto';
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
        private readonly addGuardianUseCase: AddGuardianToStudentUseCase,
        private readonly updateEnrollmentUseCase: UpdateStudentEnrollmentUseCase,
        private readonly tenantContext: TenantContext,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new student' })
    @ApiResponse({ status: 201, description: 'Student created successfully', type: StudentResponseDto })
    async create(@Body() createStudentDto: CreateStudentDto): Promise<StudentResponseDto> {
        const tenantId = this.tenantContext.tenantId;
        const student = await this.createStudentUseCase.execute(createStudentDto as any, tenantId);
        return StudentResponseDto.fromDomain(student);
    }

    @Get()
    @ApiOperation({ summary: 'Get all students' })
    @ApiResponse({ status: 200, description: 'List of students', type: [StudentResponseDto] })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'class', required: false })
    @ApiQuery({ name: 'section', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'academicYear', required: false })
    @ApiQuery({ name: 'gender', required: false })
    async findAll(
        @Query('search') search?: string,
        @Query('class') classFilter?: string,
        @Query('section') section?: string,
        @Query('status') status?: string,
        @Query('academicYear') academicYear?: string,
        @Query('gender') gender?: string,
    ): Promise<StudentResponseDto[]> {
        const tenantId = this.tenantContext.tenantId;
        const filters = {
            search,
            class: classFilter,
            section,
            status,
            academicYear,
            gender,
        };
        const students = await this.getAllStudentsUseCase.execute(tenantId, filters);
        return students.map(StudentResponseDto.fromDomain);
    }

    @Get('export')
    @ApiOperation({ summary: 'Export students to CSV' })
    @ApiResponse({ status: 200, description: 'CSV file' })
    async exportStudents(
        @Query('search') search?: string,
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
                await this.createStudentUseCase.execute(studentData, tenantId);
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

    @Get(':id')
    @ApiOperation({ summary: 'Get student by ID' })
    @ApiResponse({ status: 200, description: 'Student found', type: StudentResponseDto })
    @ApiResponse({ status: 404, description: 'Student not found' })
    async findOne(@Param('id') id: string): Promise<StudentResponseDto> {
        const tenantId = this.tenantContext.tenantId;
        const student = await this.getStudentByIdUseCase.execute(id, tenantId);
        return StudentResponseDto.fromDomain(student);
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
        const student = await this.updateStudentUseCase.execute(id, tenantId, updateStudentDto as any);
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
        const student = await this.addGuardianUseCase.execute(id, tenantId, guardianDto);
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
        const student = await this.updateEnrollmentUseCase.execute(id, tenantId, enrollmentDto);
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
