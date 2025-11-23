import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from '../../adapters/http/users/users.controller';
import { USER_REPOSITORY } from '../../domain/user/ports/user.repository.interface';
import { MongooseUserRepository } from '../../infrastructure/persistence/mongoose/repositories/mongoose-user.repository';
import { UserSchema } from '../../infrastructure/persistence/mongoose/schemas/user.schema';
import { AddPermissionsToUserUseCase } from '../../application/rbac/use-cases/add-permissions-to-user.use-case';
import { GetPermissionTreeUseCase } from '../../application/rbac/use-cases/get-permission-tree.use-case';

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
    ],
    exports: [USER_REPOSITORY],
})
export class UsersModule { }
