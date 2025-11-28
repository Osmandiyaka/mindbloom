import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from '../../presentation/controllers/users.controller';
import { USER_REPOSITORY } from '../../domain/ports/out/repository.tokens';
import { MongooseUserRepository } from '../../infrastructure/adapters/persistence/mongoose/user.repository';
import { UserSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/user.schema';
import { AddPermissionsToUserUseCase } from '../../application/services/rbac/add-permissions-to-user.use-case';
import { GetPermissionTreeUseCase } from '../../application/services/rbac/get-permission-tree.use-case';
import { CreateUserUseCase, UpdateUserUseCase } from '../../application/services/user';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    ],
    controllers: [UsersController],
    providers: [
        {
            provide: USER_REPOSITORY,
            useClass: MongooseUserRepository,
        },
        AddPermissionsToUserUseCase,
        GetPermissionTreeUseCase,
        CreateUserUseCase,
        UpdateUserUseCase,
    ],
    exports: [USER_REPOSITORY],
})
export class UsersModule { }
