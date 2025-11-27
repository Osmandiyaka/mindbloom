import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RecentInvoicesQueryDto {
    @IsString()
    @IsOptional()
    tenantId?: string;

    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    @Max(50)
    @IsOptional()
    limit?: number;
}
