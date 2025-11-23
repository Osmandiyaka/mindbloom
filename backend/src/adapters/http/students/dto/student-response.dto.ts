import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../../../../domain/student/entities/student.entity';

export class StudentResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    email: string;

    @ApiProperty({ required: false })
    phone?: string;

    @ApiProperty({ required: false })
    dob?: Date;

    @ApiProperty({ required: false })
    classId?: string;

    @ApiProperty({ required: false })
    rollNo?: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    static fromDomain(student: Student): StudentResponseDto {
        const dto = new StudentResponseDto();
        dto.id = student.id;
        dto.name = student.name;
        dto.email = student.email;
        dto.phone = student.phone;
        dto.dob = student.dob;
        dto.classId = student.classId;
        dto.rollNo = student.rollNo;
        dto.status = student.status;
        dto.createdAt = student.createdAt;
        dto.updatedAt = student.updatedAt;
        return dto;
    }
}
