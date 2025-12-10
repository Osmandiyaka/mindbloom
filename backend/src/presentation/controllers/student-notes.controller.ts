import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { CreateStudentNoteUseCase } from '../../application/services/student-notes/create-student-note.use-case';
import { GetStudentNotesUseCase } from '../../application/services/student-notes/get-student-notes.use-case';
import { CreateStudentNoteDto } from '../dtos/requests/students/create-student-note.dto';
import { StudentNote } from '../../domain/student/entities/student-note.entity';

@ApiTags('student-notes')
@Controller('student-notes')
@UseGuards(TenantGuard)
export class StudentNotesController {
  constructor(
    private readonly createNote: CreateStudentNoteUseCase,
    private readonly getNotes: GetStudentNotesUseCase,
    private readonly tenantContext: TenantContext,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add a note to a student' })
  @ApiResponse({ status: 201, description: 'Note created' })
  async create(@Body() dto: CreateStudentNoteDto): Promise<StudentNote> {
    const tenantId = this.tenantContext.tenantId;
    return this.createNote.execute({
      tenantId,
      studentId: dto.studentId,
      staffId: dto.staffId,
      category: dto.category,
      content: dto.content,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List notes for a student' })
  @ApiQuery({ name: 'studentId', required: true })
  @ApiQuery({ name: 'category', required: false, enum: ['general', 'conduct', 'academic'] })
  async findAll(
    @Query('studentId') studentId: string,
    @Query('category') category?: 'general' | 'conduct' | 'academic',
  ): Promise<StudentNote[]> {
    const tenantId = this.tenantContext.tenantId;
    return this.getNotes.execute(tenantId, { studentId, category });
  }
}
