import { Body, Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { CreateInvitationUseCase } from '../../application/services/invitation/create-invitation.use-case';
import { ListInvitationsUseCase } from '../../application/services/invitation/list-invitations.use-case';
import { ResendInvitationUseCase } from '../../application/services/invitation/resend-invitation.use-case';
import { RevokeInvitationUseCase } from '../../application/services/invitation/revoke-invitation.use-case';
import { CreateInvitationCommand } from '../../application/ports/in/commands/create-invitation.command';
import { ResendInvitationCommand } from '../../application/ports/in/commands/resend-invitation.command';
import { RevokeInvitationCommand } from '../../application/ports/in/commands/revoke-invitation.command';
import { Invitation } from '../../domain/invitation/entities/invitation.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsEmail, IsOptional, IsString, IsDateString } from 'class-validator';

class CreateInvitationDto {
    @ApiProperty({ example: 'user@school.com' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: ['Teacher', 'Librarian'] })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    roles!: string[];

    @ApiProperty({ required: false, example: '2024-12-31T00:00:00.000Z' })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}

@ApiTags('Invitations')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('invitations')
export class InvitationsController {
    constructor(
        private readonly tenantContext: TenantContext,
        private readonly createInvitationUseCase: CreateInvitationUseCase,
        private readonly listInvitationsUseCase: ListInvitationsUseCase,
        private readonly resendInvitationUseCase: ResendInvitationUseCase,
        private readonly revokeInvitationUseCase: RevokeInvitationUseCase,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List invitations for current tenant' })
    async list(): Promise<Invitation[]> {
        return this.listInvitationsUseCase.execute(this.tenantContext.tenantId);
    }

    @Post()
    @ApiOperation({ summary: 'Create invitation for current tenant' })
    async create(@Body() dto: CreateInvitationDto): Promise<Invitation> {
        const command = new CreateInvitationCommand(
            this.tenantContext.tenantId,
            dto.email,
            dto.roles || [],
            dto.expiresAt ? new Date(dto.expiresAt) : undefined,
            'admin'
        );
        return this.createInvitationUseCase.execute(command);
    }

    @Post(':id/resend')
    @ApiOperation({ summary: 'Resend an invitation email' })
    async resend(@Param('id') id: string): Promise<Invitation> {
        const command = new ResendInvitationCommand(this.tenantContext.tenantId, id);
        return this.resendInvitationUseCase.execute(command);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Revoke an invitation' })
    async revoke(@Param('id') id: string): Promise<Invitation> {
        const command = new RevokeInvitationCommand(this.tenantContext.tenantId, id);
        return this.revokeInvitationUseCase.execute(command);
    }
}
