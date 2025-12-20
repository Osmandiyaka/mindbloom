import { ApiProperty } from '@nestjs/swagger';

export class TenantActivityItemDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    tenantId!: string;

    @ApiProperty()
    type!: string;

    @ApiProperty()
    message!: string;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty({ required: false })
    actorEmail?: string | null;
}
