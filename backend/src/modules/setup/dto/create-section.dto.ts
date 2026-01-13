import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSectionDto {
    @IsString()
    classId: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    capacity?: number | null;

    @IsOptional()
    @IsString()
    homeroomTeacherId?: string | null;

    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @IsOptional()
    sortOrder?: number;
}
