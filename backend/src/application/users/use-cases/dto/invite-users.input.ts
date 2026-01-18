import { IsArray, IsEmail, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserSchoolAccessInput } from './user-school-access.input';

export class InviteUsersInput {
    @IsString()
    tenantId!: string;

    @IsArray()
    @IsEmail({}, { each: true })
    emails!: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    roleIds?: string[];

    @ValidateNested()
    @Type(() => UserSchoolAccessInput)
    @IsOptional()
    schoolAccess?: UserSchoolAccessInput;
}
