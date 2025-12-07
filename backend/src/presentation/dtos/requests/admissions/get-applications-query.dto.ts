import { IsString, IsOptional, IsArray, IsEnum, IsDateString } from 'class-validator';

export class GetApplicationsQueryDto {
    @IsString()
    @IsOptional()
    search?: string;

    @IsString()
    @IsOptional()
    @IsEnum([
        'inquiry',
        'submitted',
        'under_review',
        'accepted',
        'rejected',
        'waitlisted',
        'enrolled',
        'withdrawn',
    ])
    status?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    statuses?: string[];

    @IsString()
    @IsOptional()
    gradeApplying?: string;

    @IsString()
    @IsOptional()
    academicYear?: string;

    @IsString()
    @IsOptional()
    @IsEnum(['online', 'walk_in', 'referral', 'agent'])
    source?: string;

    @IsDateString()
    @IsOptional()
    dateFrom?: string;

    @IsDateString()
    @IsOptional()
    dateTo?: string;
}
