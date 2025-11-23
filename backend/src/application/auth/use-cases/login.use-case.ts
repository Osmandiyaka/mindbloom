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
        email: string;
        name: string;
        role: string;
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

        // Generate JWT token
        const payload = { sub: user.id, email: user.email, role: user.role };
        const access_token = this.jwtService.sign(payload);

        return {
            access_token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }
}
