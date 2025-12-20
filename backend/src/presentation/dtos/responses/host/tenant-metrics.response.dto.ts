import { ApiProperty } from '@nestjs/swagger';

export class TenantMetricsResponseDto {
    @ApiProperty()
    tenantId!: string;

    @ApiProperty()
    studentsCount!: number;

    @ApiProperty()
    teachersCount!: number;

    @ApiProperty()
    usersCount!: number;

    @ApiProperty({ required: false })
    classesCount?: number;

    @ApiProperty({ required: false })
    staffCount?: number;

    @ApiProperty({ required: false })
    storageUsedMb?: number;

    @ApiProperty({ required: false })
    storageLimitMb?: number;

    @ApiProperty({ required: false })
    mrr?: number;

    @ApiProperty({ required: false })
    currency?: string;
}
