import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PermissionAction, PermissionScope } from '../../../domain/rbac/entities/permission.entity';

export class PermissionDto {
  @ApiProperty({ example: 'students' })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({ example: ['read', 'create'], enum: PermissionAction, isArray: true })
  @IsArray()
  @IsEnum(PermissionAction, { each: true })
  actions: PermissionAction[];

  @ApiProperty({ example: 'own', enum: PermissionScope })
  @IsEnum(PermissionScope)
  scope: PermissionScope;
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
