import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { IRefreshTokenRepository, RefreshToken } from '../../../../domain/ports/out/refresh-token-repository.port';
import { RefreshTokenDocument } from './schemas/refresh-token.schema';

@Injectable()
export class MongooseRefreshTokenRepository implements IRefreshTokenRepository {
    constructor(
        @InjectModel('RefreshToken')
        private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    ) { }

    async create(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
        const doc = await this.refreshTokenModel.create({
            userId,
            tokenHash,
            expiresAt,
            revokedAt: null,
        });
        return this.toDomain(doc);
    }

    async findByHash(tokenHash: string): Promise<RefreshToken | null> {
        const token = await this.refreshTokenModel.findOne({ tokenHash }).exec();
        return token ? this.toDomain(token) : null;
    }

    async revokeById(id: string): Promise<void> {
        await this.refreshTokenModel.findByIdAndUpdate(id, { revokedAt: new Date() }).exec();
    }

    async revokeByHash(tokenHash: string): Promise<void> {
        await this.refreshTokenModel.updateOne({ tokenHash }, { revokedAt: new Date() }).exec();
    }

    async revokeAllForUser(userId: string): Promise<void> {
        await this.refreshTokenModel.updateMany({ userId }, { revokedAt: new Date() }).exec();
    }

    private toDomain(doc: RefreshTokenDocument): RefreshToken {
        return {
            id: doc.id,
            userId: doc.userId?.toString(),
            tokenHash: doc.tokenHash,
            expiresAt: doc.expiresAt,
            revokedAt: doc.revokedAt || null,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
    }
}
