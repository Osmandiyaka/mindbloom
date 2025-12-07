import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Invitation, InvitationStatus } from '../../domain/invitation/entities/invitation.entity';
import { INVITATION_REPOSITORY, InvitationRepository } from '../../domain/ports/out/invitation-repository.port';

/**
 * Development-only seeder to provide sample invitations for UI testing.
 * Controlled via SEED_INVITATIONS=true and skipped entirely in production.
 */
@Injectable()
export class InvitationsSeeder implements OnModuleInit {
    private readonly logger = new Logger(InvitationsSeeder.name);

    constructor(
        @Inject(INVITATION_REPOSITORY)
        private readonly invitationRepository: InvitationRepository,
    ) { }

    async onModuleInit(): Promise<void> {
        if (process.env.NODE_ENV === 'production') return;
        if (process.env.SEED_INVITATIONS !== 'true') return;

        const tenantId = process.env.DEV_TENANT_ID || '6922e847e5f00fc50aff02b1';
        const existing = await this.invitationRepository.findByTenant(tenantId);
        if (existing.length) {
            this.logger.verbose(`Invitations already present for tenant ${tenantId}; skipping seed.`);
            return;
        }

        const now = new Date();
        const makeInvite = (email: string, status: InvitationStatus, expiresInDays: number, sentAt?: Date) =>
            new Invitation(
                '',
                tenantId,
                email,
                ['admin'],
                status,
                randomUUID(),
                new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
                'system',
                now,
                sentAt ?? now,
                sentAt,
            );

        const seeds = [
            makeInvite('pending@example.com', InvitationStatus.PENDING, 14),
            makeInvite('accepted@example.com', InvitationStatus.ACCEPTED, 30, now),
            makeInvite('revoked@example.com', InvitationStatus.REVOKED, 21, now),
        ];

        for (const invite of seeds) {
            await this.invitationRepository.create(invite);
        }

        this.logger.log(`Seeded ${seeds.length} invitations for tenant ${tenantId}.`);
    }
}
