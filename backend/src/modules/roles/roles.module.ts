import { Module, forwardRef } from '@nestjs/common';
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
import { PermissionsMeController } from '../../presentation/controllers/permissions-me.controller';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PermissionGuard } from '../../common/guards/permission.guard';

@Injectable()
class RolesInitializer implements OnApplicationBootstrap {
    private readonly logger = new Logger(RolesInitializer.name);

    constructor(
        private readonly initializeGlobalRoles: InitializeGlobalRolesUseCase,
        private readonly initializeSystemRoles: InitializeSystemRolesUseCase,
    ) { }

    async onApplicationBootstrap(): Promise<void> {
        try {
            const globalRoles = await this.initializeGlobalRoles.execute();
            this.logger.log(`Global roles ready (${globalRoles.length})`);

            // Initialize system roles once (delegates to global in repository implementation)
            const systemRoles = await this.initializeSystemRoles.execute('global-seed');
            this.logger.log(`System roles initialized (${systemRoles.length})`);
        } catch (err) {
            this.logger.error('Failed to initialize roles', err?.stack || String(err));
            throw err;
        }
    }
}

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'Role', schema: RoleSchema }]),
        forwardRef(() => UsersModule),
    ],
    controllers: [RolesController, PermissionsController, PermissionsMeController],
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
        PermissionGuard,
        RolesInitializer,
        {
            provide: 'ROLES_INITIALIZER_RUNNER',
            useFactory: async (initializer: RolesInitializer) => initializer.onApplicationBootstrap(),
            inject: [RolesInitializer],
        },
    ],
    exports: [ROLE_REPOSITORY, InitializeSystemRolesUseCase, InitializeGlobalRolesUseCase],
})
export class RolesModule { }
