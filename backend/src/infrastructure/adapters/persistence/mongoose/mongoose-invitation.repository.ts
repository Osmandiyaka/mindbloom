import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invitation, InvitationStatus } from '../../../../domain/invitation/entities/invitation.entity';
import { InvitationRepository } from '../../../../domain/invitation/ports/invitation.repository';
import { InvitationDocument } from './schemas/invitation.schema';

@Injectable()
export class MongooseInvitationRepository implements InvitationRepository {
    constructor(
        @InjectModel('Invitation')
        private readonly invitationModel: Model<InvitationDocument>,
    ) { }

    async findByTenant(tenantId: string): Promise<Invitation[]> {
        const docs = await this.invitationModel.find({ tenantId }).sort({ createdAt: -1 }).exec();
        return docs.map(this.toDomain);
    }

    async findById(id: string, tenantId: string): Promise<Invitation | null> {
        const doc = await this.invitationModel.findOne({ _id: id, tenantId }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByToken(token: string): Promise<Invitation | null> {
        const doc = await this.invitationModel.findOne({ token }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async create(invitation: Invitation): Promise<Invitation> {
        const doc = await this.invitationModel.create({
            tenantId: invitation.tenantId,
            email: invitation.email,
            roles: invitation.roles,
            status: invitation.status,
            token: invitation.token,
            expiresAt: invitation.expiresAt,
            createdBy: invitation.createdBy,
            sentAt: invitation.sentAt,
        });
        return this.toDomain(doc);
    }

    async save(invitation: Invitation): Promise<Invitation> {
        const updated = await this.invitationModel.findByIdAndUpdate(
            invitation.id,
            {
                tenantId: invitation.tenantId,
                email: invitation.email,
                roles: invitation.roles,
                status: invitation.status,
                token: invitation.token,
                expiresAt: invitation.expiresAt,
                createdBy: invitation.createdBy,
                sentAt: invitation.sentAt,
                updatedAt: new Date(),
            },
            { new: true }
        ).exec();
        if (!updated) {
            throw new Error('Invitation not found');
        }
        return this.toDomain(updated);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await this.invitationModel.deleteOne({ _id: id, tenantId }).exec();
    }

    async updateStatus(id: string, tenantId: string, status: InvitationStatus): Promise<Invitation | null> {
        const updated = await this.invitationModel.findOneAndUpdate(
            { _id: id, tenantId },
            { status, updatedAt: new Date() },
            { new: true }
        ).exec();
        return updated ? this.toDomain(updated) : null;
    }

    private toDomain(doc: InvitationDocument): Invitation {
        return new Invitation(
            doc._id.toString(),
            doc.tenantId,
            doc.email,
            doc.roles,
            doc.status as InvitationStatus,
            doc.token,
            doc.expiresAt,
            doc.createdBy,
            doc.createdAt,
            doc.updatedAt,
            doc.sentAt,
        );
    }
}
