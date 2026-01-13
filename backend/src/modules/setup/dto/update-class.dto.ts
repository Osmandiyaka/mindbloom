import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateClassDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    levelType?: string;

    @IsOptional()
    sortOrder?: number;

    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @IsOptional()
    @IsArray()
    schoolIds?: string[] | null;

    @IsOptional()
    @IsString()
    notes?: string;
}
