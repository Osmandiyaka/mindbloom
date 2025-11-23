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
    CreateStudentUseCase,
    GetAllStudentsUseCase,
    GetStudentByIdUseCase,
    UpdateStudentUseCase,
    DeleteStudentUseCase,
} from '../../../application/student/use-cases';
import { AddGuardianToStudentUseCase } from '../../../application/student/use-cases/add-guardian-to-student.use-case';
import { UpdateStudentEnrollmentUseCase } from '../../../application/student/use-cases/update-student-enrollment.use-case';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';
import { TenantGuard } from '../../../common/tenant/tenant.guard';
import { TenantContext } from '../../../common/tenant/tenant.context';

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
}
