export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface TenantMembership {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  roles: string[];
  permissions?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType?: 'Bearer';
}

export interface AuthSession {
  user: AuthUser;
  memberships: TenantMembership[];
  activeTenantId?: string;
  tokens: AuthTokens;
  expiresAt: string;
  issuedAt?: string;
}

export function validateAuthSession(data: unknown): AuthSession | null {
  try {
    if (!data || typeof data !== 'object') return null;

    const session = data as Record<string, unknown>;

    if (!session['user'] || typeof session['user'] !== 'object') return null;
    if (!session['tokens'] || typeof session['tokens'] !== 'object') return null;
    if (typeof session['expiresAt'] !== 'string') return null;

    const user = session['user'] as Record<string, unknown>;
    if (typeof user['id'] !== 'string' || typeof user['email'] !== 'string') return null;

    const tokens = session['tokens'] as Record<string, unknown>;
    if (typeof tokens['accessToken'] !== 'string') return null;

    return session as unknown as AuthSession;
  } catch {
    return null;
  }
}
