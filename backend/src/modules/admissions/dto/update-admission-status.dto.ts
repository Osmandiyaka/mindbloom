import { IsIn, IsOptional, IsString } from 'class-validator';

type AdmissionStatus = 'review' | 'rejected' | 'enrolled';

export class UpdateAdmissionStatusDto {
    @IsIn(['review', 'rejected', 'enrolled'])
    status: AdmissionStatus;

    @IsString()
    @IsOptional()
    note?: string;

    @IsString()
    @IsOptional()
    tenantId?: string;

    @IsString()
    @IsOptional()
    userId?: string;
}
