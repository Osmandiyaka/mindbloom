import { IsString } from 'class-validator';

export class StatusChangeInput {
    @IsString()
    tenantId!: string;

    @IsString()
    userId!: string;
}
