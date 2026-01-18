import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class UserSchoolAccessInput {
    @IsIn(['all', 'selected'])
    scope!: 'all' | 'selected';

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    schoolIds?: string[];
}
