import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { StudentNoteCategory } from '../../../../domain/student/entities/student-note.entity';

export class CreateStudentNoteDto {
  @ApiProperty({ enum: ['general', 'conduct', 'academic'] })
  @IsEnum(['general', 'conduct', 'academic'])
  category: StudentNoteCategory;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  staffId: string;
}
