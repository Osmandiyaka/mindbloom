import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvitationsController } from '../../presentation/controllers/invitations.controller';
import { InvitationSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/invitation.schema';
import { MongooseInvitationRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-invitation.repository';
import { INVITATION_REPOSITORY } from '../../domain/ports/out/invitation-repository.port';
import { CreateInvitationUseCase } from '../../application/services/invitation/create-invitation.use-case';
import { ListInvitationsUseCase } from '../../application/services/invitation/list-invitations.use-case';
import { ResendInvitationUseCase } from '../../application/services/invitation/resend-invitation.use-case';
import { RevokeInvitationUseCase } from '../../application/services/invitation/revoke-invitation.use-case';
import { InvitationsSeeder } from './invitations.seeder';
import { InvitationMailer } from '../../application/services/invitation/invitation.mailer';

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
        InvitationsSeeder,
        InvitationMailer,
    ],
    exports: [
        INVITATION_REPOSITORY,
        CreateInvitationUseCase,
        ListInvitationsUseCase,
        ResendInvitationUseCase,
        RevokeInvitationUseCase,
        InvitationMailer,
    ],
})
export class InvitationsModule { }
