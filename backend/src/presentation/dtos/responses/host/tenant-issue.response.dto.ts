import { ApiProperty } from '@nestjs/swagger';

export class TenantIssueItemDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    message!: string;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty({ required: false })
    actorEmail?: string | null;
}
