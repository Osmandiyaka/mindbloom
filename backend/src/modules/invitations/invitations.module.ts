import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvitationsController } from '../../presentation/controllers/invitations.controller';
import { InvitationSchema } from '../../infrastructure/persistence/mongoose/schemas/invitation.schema';
import { MongooseInvitationRepository } from '../../infrastructure/persistence/mongoose/repositories/mongoose-invitation.repository';
import { INVITATION_REPOSITORY } from '../../domain/invitation/ports/invitation.repository';
import { CreateInvitationUseCase } from '../../application/invitation/use-cases/create-invitation.use-case';
import { ListInvitationsUseCase } from '../../application/invitation/use-cases/list-invitations.use-case';
import { ResendInvitationUseCase } from '../../application/invitation/use-cases/resend-invitation.use-case';
import { RevokeInvitationUseCase } from '../../application/invitation/use-cases/revoke-invitation.use-case';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Invitation', schema: InvitationSchema },
        ]),
    ],
    controllers: [InvitationsController],
    providers: [
        { provide: INVITATION_REPOSITORY, useClass: MongooseInvitationRepository },
        CreateInvitationUseCase,
        ListInvitationsUseCase,
        ResendInvitationUseCase,
        RevokeInvitationUseCase,
    ],
    exports: [
        INVITATION_REPOSITORY,
        CreateInvitationUseCase,
        ListInvitationsUseCase,
        ResendInvitationUseCase,
        RevokeInvitationUseCase,
    ],
})
export class InvitationsModule { }
