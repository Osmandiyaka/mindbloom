import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleSchema } from '../../infrastructure/persistence/mongoose/schemas/role.schema';
import { MongooseRoleRepository } from '../../infrastructure/persistence/mongoose/repositories/mongoose-role.repository';
import { ROLE_REPOSITORY } from '../../domain/rbac/ports/role.repository.interface';
import {
  CreateRoleUseCase,
  GetAllRolesUseCase,
  GetRoleByIdUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
  InitializeSystemRolesUseCase,
} from '../../application/rbac/use-cases';
import { RolesController } from '../../adapters/http/roles/roles.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Role', schema: RoleSchema }]),
  ],
  controllers: [RolesController],
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
  ],
  exports: [ROLE_REPOSITORY, InitializeSystemRolesUseCase],
})
export class RolesModule {}
