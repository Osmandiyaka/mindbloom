import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/user/ports/user.repository.interface';
import { MongooseUserRepository } from '../../../infrastructure/persistence/mongoose/repositories/mongoose-user.repository';

export interface LoginCommand {
    email: string;
    password: string;
}

export interface LoginResult {
    access_token: string;
    user: {
        id: string;
        tenantId: string;
        email: string;
        name: string;
        roleId: string | null;
        role: {
            id: string;
            name: string;
            description: string;
            isSystemRole: boolean;
            permissions: Array<{
                id: string;
                resource: string;
                displayName: string;
                description: string;
                actions: string[];
                scope: string;
            }>
        } | null;
    };
}

@Injectable()
export class LoginUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository & MongooseUserRepository,
        private readonly jwtService: JwtService,
    ) { }

    async execute(command: LoginCommand): Promise<LoginResult> {
        // Validate credentials
        const isValid = await this.userRepository.validatePassword(
            command.email,
            command.password,
        );

        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const user = await this.userRepository.findByEmail(command.email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate JWT token with tenant and role information
        const payload = {
            sub: user.id,
            tenantId: user.tenantId,
            email: user.email,
            roleId: user.roleId,
            roleName: user.role?.name || null
        };
        const access_token = this.jwtService.sign(payload);

        return {
            access_token,
            user: {
                id: user.id,
                tenantId: user.tenantId,
                email: user.email,
                name: user.name,
                roleId: user.roleId,
                role: user.role ? {
                    id: user.role.id,
                    name: user.role.name,
                    description: user.role.description,
                    isSystemRole: user.role.isSystemRole,
                    permissions: user.role.permissions.map(p => ({
                        id: p.id,
                        resource: p.resource,
                        displayName: p.displayName,
                        description: p.description,
                        actions: p.actions,
                        scope: p.scope
                    }))
                } : null,
            },
        };
    }
}
