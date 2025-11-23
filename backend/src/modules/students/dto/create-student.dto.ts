import { IsString, IsEmail, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ required: false })
    @IsDateString()
    @IsOptional()
    dob?: string;

    @ApiProperty()
    @IsString()
    classId: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    rollNo?: string;
}
