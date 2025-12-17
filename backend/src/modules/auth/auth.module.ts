import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { USER_REPOSITORY } from '../../domain/ports/out/repository.tokens';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/ports/out/repository.tokens';
import { MongooseUserRepository } from '../../infrastructure/adapters/persistence/mongoose/user.repository';
import { MongooseRefreshTokenRepository } from '../../infrastructure/adapters/persistence/mongoose/refresh-token.repository';
import { UserSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/user.schema';
import { RefreshTokenSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/refresh-token.schema';
import { LoginUseCase, RegisterUseCase, ForgotPasswordUseCase, ResetPasswordUseCase, PasswordResetMailer, RefreshTokenUseCase, LogoutUseCase, TokenService } from '../../application/services/auth';
import { AuthController } from '../../presentation/controllers/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { MailModule } from '../../infrastructure/mail/mail.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'User', schema: UserSchema },
            { name: 'RefreshToken', schema: RefreshTokenSchema },
        ]),
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_SECRET') || 'your-secret-key',
                signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '15m' },
            }),
        }),
        MailModule,
    ],
    controllers: [AuthController],
    providers: [
        // Repository adapter
        {
            provide: USER_REPOSITORY,
            useClass: MongooseUserRepository,
        },
        {
            provide: REFRESH_TOKEN_REPOSITORY,
            useClass: MongooseRefreshTokenRepository,
        },
        // Use cases
        LoginUseCase,
        RegisterUseCase,
        ForgotPasswordUseCase,
        ResetPasswordUseCase,
        PasswordResetMailer,
        RefreshTokenUseCase,
        LogoutUseCase,
        TokenService,
        // Strategies
        JwtStrategy,
        LocalStrategy,
    ],
    exports: [USER_REPOSITORY, LoginUseCase],
})
export class AuthModule { }
