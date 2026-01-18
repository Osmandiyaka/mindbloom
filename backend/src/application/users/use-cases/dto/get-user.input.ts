import { IsString } from 'class-validator';

export class GetUserInput {
    @IsString()
    tenantId!: string;

    @IsString()
    userId!: string;
}
