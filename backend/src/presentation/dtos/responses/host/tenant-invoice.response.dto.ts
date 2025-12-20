import { ApiProperty } from '@nestjs/swagger';

export class TenantInvoiceItemDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    date!: Date;

    @ApiProperty()
    amount!: number;

    @ApiProperty()
    status!: string;
}
