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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
    CreateStudentUseCase,
    GetAllStudentsUseCase,
    GetStudentByIdUseCase,
    UpdateStudentUseCase,
    DeleteStudentUseCase,
} from '../../../application/student/use-cases';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';

@ApiTags('students')
@Controller('students')
export class StudentsController {
    constructor(
        private readonly createStudentUseCase: CreateStudentUseCase,
        private readonly getAllStudentsUseCase: GetAllStudentsUseCase,
        private readonly getStudentByIdUseCase: GetStudentByIdUseCase,
        private readonly updateStudentUseCase: UpdateStudentUseCase,
        private readonly deleteStudentUseCase: DeleteStudentUseCase,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new student' })
    @ApiResponse({ status: 201, description: 'Student created successfully', type: StudentResponseDto })
    async create(@Body() createStudentDto: CreateStudentDto): Promise<StudentResponseDto> {
        const student = await this.createStudentUseCase.execute({
            name: createStudentDto.name,
            email: createStudentDto.email,
            phone: createStudentDto.phone,
            dob: createStudentDto.dob,
            classId: createStudentDto.classId,
            rollNo: createStudentDto.rollNo,
            status: createStudentDto.status,
        });

        return StudentResponseDto.fromDomain(student);
    }

    @Get()
    @ApiOperation({ summary: 'Get all students' })
    @ApiResponse({ status: 200, description: 'List of students', type: [StudentResponseDto] })
    async findAll(): Promise<StudentResponseDto[]> {
        const students = await this.getAllStudentsUseCase.execute();
        return students.map(StudentResponseDto.fromDomain);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get student by ID' })
    @ApiResponse({ status: 200, description: 'Student found', type: StudentResponseDto })
    @ApiResponse({ status: 404, description: 'Student not found' })
    async findOne(@Param('id') id: string): Promise<StudentResponseDto> {
        const student = await this.getStudentByIdUseCase.execute(id);
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
        const student = await this.updateStudentUseCase.execute(id, updateStudentDto);
        return StudentResponseDto.fromDomain(student);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete student' })
    @ApiResponse({ status: 204, description: 'Student deleted successfully' })
    @ApiResponse({ status: 404, description: 'Student not found' })
    async remove(@Param('id') id: string): Promise<void> {
        await this.deleteStudentUseCase.execute(id);
    }
}
