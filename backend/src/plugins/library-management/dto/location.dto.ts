import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsMongoId, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationType } from '../schemas/location.schema';

export class CreateLocationDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsEnum(LocationType)
    @IsNotEmpty()
    type: LocationType;

    @IsMongoId()
    @IsOptional()
    parentId?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    capacity?: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    floor?: number;

    @IsNumber()
    @IsOptional()
    latitude?: number;

    @IsNumber()
    @IsOptional()
    longitude?: number;

    @IsString()
    @IsOptional()
    mapImageUrl?: string;

    @IsOptional()
    isRestricted?: boolean;

    @IsString({ each: true })
    @IsOptional()
    allowedRoles?: string[];

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateLocationDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    code?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    capacity?: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsOptional()
    isRestricted?: boolean;

    @IsString({ each: true })
    @IsOptional()
    allowedRoles?: string[];

    @IsString()
    @IsOptional()
    notes?: string;

    @IsOptional()
    isActive?: boolean;
}

export class LocationQueryDto {
    @IsEnum(LocationType)
    @IsOptional()
    type?: LocationType;

    @IsMongoId()
    @IsOptional()
    parentId?: string;

    @IsOptional()
    @Type(() => Boolean)
    isActive?: boolean;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    @Max(10)
    level?: number;
}
