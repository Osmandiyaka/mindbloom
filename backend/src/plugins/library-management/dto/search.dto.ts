import { IsString, IsOptional, IsNumber, IsArray, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
    @IsString()
    @IsOptional()
    q?: string; // General search query

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    author?: string;

    @IsString()
    @IsOptional()
    isbn?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    categories?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    genres?: string[];

    @IsString()
    @IsOptional()
    language?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    publishedYearFrom?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    publishedYearTo?: number;

    @IsOptional()
    @Type(() => Boolean)
    availableOnly?: boolean;

    @IsString()
    @IsOptional()
    locationId?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @IsString()
    @IsOptional()
    sortBy?: string = 'relevance'; // 'relevance', 'title', 'author', 'publishedYear', 'popularity'

    @IsString()
    @IsOptional()
    sortOrder?: 'asc' | 'desc' = 'desc';
}
