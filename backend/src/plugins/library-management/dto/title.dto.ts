import { IsString, IsNotEmpty, IsArray, IsOptional, IsNumber, IsBoolean, IsISBN, IsUrl, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTitleDto {
    @IsISBN('13')
    @IsNotEmpty()
    isbn: string;

    @IsISBN('10')
    @IsOptional()
    isbn10?: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    subtitle?: string;

    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    authors: string[];

    @IsString()
    @IsOptional()
    publisher?: string;

    @IsNumber()
    @IsOptional()
    @Min(1000)
    @Max(9999)
    publishedYear?: number;

    @IsString()
    @IsOptional()
    edition?: string;

    @IsString()
    @IsOptional()
    language?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    pages?: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    categories?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    genres?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @IsString()
    @IsOptional()
    deweyDecimal?: string;

    @IsString()
    @IsOptional()
    locCallNumber?: string;

    @IsUrl()
    @IsOptional()
    coverImageUrl?: string;

    @IsString()
    @IsOptional()
    goodreadsId?: string;

    @IsString()
    @IsOptional()
    googleBooksId?: string;

    @IsString()
    @IsOptional()
    openLibraryId?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    retailPrice?: number;

    @IsString()
    @IsOptional()
    format?: string; // 'HARDCOVER', 'PAPERBACK', 'EBOOK', 'AUDIOBOOK'

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateTitleDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    subtitle?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    authors?: string[];

    @IsString()
    @IsOptional()
    publisher?: string;

    @IsNumber()
    @IsOptional()
    @Min(1000)
    @Max(9999)
    publishedYear?: number;

    @IsString()
    @IsOptional()
    edition?: string;

    @IsString()
    @IsOptional()
    language?: string;

    @IsNumber()
    @IsOptional()
    @Min(1)
    pages?: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    categories?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    genres?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @IsString()
    @IsOptional()
    deweyDecimal?: string;

    @IsString()
    @IsOptional()
    locCallNumber?: string;

    @IsUrl()
    @IsOptional()
    coverImageUrl?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    retailPrice?: number;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class TitleQueryDto {
    @IsString()
    @IsOptional()
    search?: string; // Full-text search across title, authors, description

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
    authors?: string[];

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    publishedYear?: number;

    @IsString()
    @IsOptional()
    language?: string;

    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    isActive?: boolean;

    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    hasAvailableCopies?: boolean;

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
    sortBy?: string = 'title';

    @IsString()
    @IsOptional()
    sortOrder?: 'asc' | 'desc' = 'asc';
}
