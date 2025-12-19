import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/role.schema';
import { MongooseRoleRepository } from '../../infrastructure/adapters/persistence/mongoose/role.repository';
import { ROLE_REPOSITORY } from '../../domain/ports/out/role-repository.port';
import {
    CreateRoleUseCase,
    GetAllRolesUseCase,
    GetRoleByIdUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    InitializeSystemRolesUseCase,
    InitializeGlobalRolesUseCase,
} from '../../application/services/rbac';
import { GetPermissionTreeUseCase } from '../../application/services/rbac/get-permission-tree.use-case';
import { AddPermissionsToRoleUseCase } from '../../application/services/rbac/add-permissions-to-role.use-case';
import { RolesController, PermissionsController } from '../../presentation/controllers/roles.controller';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
class GlobalRolesInitializer implements OnModuleInit {
    constructor(private readonly initializeGlobalRoles: InitializeGlobalRolesUseCase) { }

    async onModuleInit(): Promise<void> {
        await this.initializeGlobalRoles.execute().catch(() => undefined);
    }
}

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'Role', schema: RoleSchema }]),
    ],
    controllers: [RolesController, PermissionsController],
    providers: [
        // Repository
        {
            provide: ROLE_REPOSITORY,
            useClass: MongooseRoleRepository,
        },
        // Use cases
        CreateRoleUseCase,
        GetAllRolesUseCase,
        GetRoleByIdUseCase,
        UpdateRoleUseCase,
        DeleteRoleUseCase,
        InitializeSystemRolesUseCase,
        InitializeGlobalRolesUseCase,
        GetPermissionTreeUseCase,
        AddPermissionsToRoleUseCase,
        GlobalRolesInitializer,
    ],
    exports: [ROLE_REPOSITORY, InitializeSystemRolesUseCase, InitializeGlobalRolesUseCase],
})
export class RolesModule { }
