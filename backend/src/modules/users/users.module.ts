import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from '../../presentation/controllers/users.controller';
import { USER_REPOSITORY } from '../../domain/ports/out/repository.tokens';
import { MongooseUserRepository } from '../../infrastructure/adapters/persistence/mongoose/user.repository';
import { UserSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/user.schema';
import { AddPermissionsToUserUseCase } from '../../application/services/rbac/add-permissions-to-user.use-case';
import { GetPermissionTreeUseCase } from '../../application/services/rbac/get-permission-tree.use-case';
import { RolesModule } from '../roles/roles.module';
import { SchoolsModule } from '../schools/schools.module';
import { AuditModule } from '../audit/audit.module';
import { CreateUserUseCase, UpdateUserUseCase, DeleteUserUseCase } from '../../application/services/user';
import {
    ActivateUserUseCase,
    CreateUserUseCase as CreateTenantUserUseCase,
    GetUserUseCase,
    InviteUsersUseCase,
    ListUsersUseCase,
    SuspendUserUseCase,
    UpdateUserUseCase as UpdateTenantUserUseCase,
} from '../../application/users/use-cases';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
        AuditModule,
        SchoolsModule,
        forwardRef(() => RolesModule),
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
        DeleteUserUseCase,
        CreateTenantUserUseCase,
        InviteUsersUseCase,
        UpdateTenantUserUseCase,
        ListUsersUseCase,
        GetUserUseCase,
        SuspendUserUseCase,
        ActivateUserUseCase,
    ],
    exports: [USER_REPOSITORY, CreateUserUseCase],
})
export class UsersModule { }
