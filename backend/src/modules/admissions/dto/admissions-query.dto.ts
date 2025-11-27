import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

type AdmissionStatus = 'review' | 'rejected' | 'enrolled';

export class AdmissionsQueryDto {
    @IsString()
    @IsOptional()
    tenantId?: string;

    @IsArray()
    @IsIn(['review', 'rejected', 'enrolled'], { each: true })
    @IsOptional()
    @Transform(({ value }) => typeof value === 'string' ? value.split(',') : value)
    statuses?: AdmissionStatus[];
}
