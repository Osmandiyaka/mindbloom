import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty, IsEnum, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PermissionAction, PermissionScope } from '../../../../domain/rbac/entities/permission.entity';

export class PermissionDto {
    @ApiProperty({ example: 'students', required: false })
    @IsString()
    @IsOptional()
    id?: string;

    @ApiProperty({ example: 'students' })
    @IsString()
    @IsNotEmpty()
    resource: string;

    @ApiProperty({ example: 'Student Management', required: false })
    @IsString()
    @IsOptional()
    displayName?: string;

    @ApiProperty({ example: 'Manage student information', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: ['read', 'create'], enum: PermissionAction, isArray: true })
    @IsArray()
    @IsEnum(PermissionAction, { each: true })
    actions: PermissionAction[];

    @ApiProperty({ example: 'own', enum: PermissionScope })
    @IsEnum(PermissionScope)
    scope: PermissionScope;

    @ApiProperty({ example: null, required: false })
    @IsString()
    @IsOptional()
    parentId?: string;

    @ApiProperty({ type: [PermissionDto], required: false })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => PermissionDto)
    children?: PermissionDto[];

    @ApiProperty({ required: false })
    @IsOptional()
    conditions?: Record<string, any>;

    @ApiProperty({ example: '📚', required: false })
    @IsString()
    @IsOptional()
    icon?: string;

    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    order?: number;
}

export class CreateRoleDto {
    @ApiProperty({ example: 'Exam Coordinator' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Manages exams and assessments' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ type: [PermissionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PermissionDto)
    permissions: PermissionDto[];
}

export class UpdateRoleDto {
    @ApiProperty({ example: 'Exam Coordinator', required: false })
    @IsString()
    @IsNotEmpty()
    name?: string;

    @ApiProperty({ example: 'Manages exams and assessments', required: false })
    @IsString()
    description?: string;

    @ApiProperty({ type: [PermissionDto], required: false })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PermissionDto)
    permissions?: PermissionDto[];
}
