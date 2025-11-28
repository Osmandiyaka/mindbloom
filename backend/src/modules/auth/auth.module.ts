import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { USER_REPOSITORY } from '../../domain/ports/out/repository.tokens';
import { MongooseUserRepository } from '../../infrastructure/adapters/persistence/mongoose/user.repository';
import { UserSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/user.schema';
import { LoginUseCase, RegisterUseCase } from '../../application/auth/use-cases';
import { AuthController } from '../../presentation/controllers/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_SECRET') || 'your-secret-key',
                signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '1d' },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        // Repository adapter
        {
            provide: USER_REPOSITORY,
            useClass: MongooseUserRepository,
        },
        // Use cases
        LoginUseCase,
        RegisterUseCase,
        // Strategies
        JwtStrategy,
        LocalStrategy,
    ],
    exports: [USER_REPOSITORY, LoginUseCase],
})
export class AuthModule { }
