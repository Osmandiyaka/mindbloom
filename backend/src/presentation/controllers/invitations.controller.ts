import { Body, Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { CreateInvitationUseCase, CreateInvitationCommand } from '../../application/services/invitation/create-invitation.use-case';
import { ListInvitationsUseCase } from '../../application/services/invitation/list-invitations.use-case';
import { ResendInvitationUseCase, ResendInvitationCommand } from '../../application/services/invitation/resend-invitation.use-case';
import { RevokeInvitationUseCase, RevokeInvitationCommand } from '../../application/services/invitation/revoke-invitation.use-case';
import { Invitation } from '../../domain/invitation/entities/invitation.entity';

class CreateInvitationDto {
    email!: string;
    roles!: string[];
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
