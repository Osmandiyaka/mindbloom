export interface RefreshToken {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IRefreshTokenRepository {
    create(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken>;
    findByHash(tokenHash: string): Promise<RefreshToken | null>;
    revokeById(id: string): Promise<void>;
    revokeByHash(tokenHash: string): Promise<void>;
    revokeAllForUser(userId: string): Promise<void>;
}
