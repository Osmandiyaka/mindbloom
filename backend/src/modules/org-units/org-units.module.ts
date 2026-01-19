import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrgUnitsController } from '../../presentation/controllers/org-units.controller';
import {
    ORG_UNIT_MEMBER_REPOSITORY,
    ORG_UNIT_REPOSITORY,
    ORG_UNIT_ROLE_REPOSITORY,
} from '../../domain/ports/out/repository.tokens';
import { OrgUnitSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/org-unit.schema';
import { OrgUnitMemberSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/org-unit-member.schema';
import { OrgUnitRoleAssignmentSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/org-unit-role-assignment.schema';
import { UserSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/user.schema';
import { RoleSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/role.schema';
import { MongooseOrgUnitRepository } from '../../infrastructure/adapters/persistence/mongoose/org-unit.repository';
import { MongooseOrgUnitMemberRepository } from '../../infrastructure/adapters/persistence/mongoose/org-unit-member.repository';
import { MongooseOrgUnitRoleRepository } from '../../infrastructure/adapters/persistence/mongoose/org-unit-role.repository';
import { AuditModule } from '../audit/audit.module';
import { CreateOrgUnitUseCase } from '../../application/org-units/use-cases/create-org-unit.use-case';
import { UpdateOrgUnitUseCase } from '../../application/org-units/use-cases/update-org-unit.use-case';
import { ListOrgUnitsUseCase } from '../../application/org-units/use-cases/list-org-units.use-case';
import { GetOrgUnitTreeUseCase } from '../../application/org-units/use-cases/get-org-unit-tree.use-case';
import { GetOrgUnitUseCase } from '../../application/org-units/use-cases/get-org-unit.use-case';
import { DeleteOrgUnitImpactUseCase } from '../../application/org-units/use-cases/delete-org-unit-impact.use-case';
import { DeleteOrgUnitUseCase } from '../../application/org-units/use-cases/delete-org-unit.use-case';
import { RestoreOrgUnitUseCase } from '../../application/org-units/use-cases/restore-org-unit.use-case';
import { ListOrgUnitMembersUseCase } from '../../application/org-units/use-cases/list-org-unit-members.use-case';
import { AddOrgUnitMembersUseCase } from '../../application/org-units/use-cases/add-org-unit-members.use-case';
import { RemoveOrgUnitMemberUseCase } from '../../application/org-units/use-cases/remove-org-unit-member.use-case';
import { ListOrgUnitRolesUseCase } from '../../application/org-units/use-cases/list-org-unit-roles.use-case';
import { AddOrgUnitRolesUseCase } from '../../application/org-units/use-cases/add-org-unit-roles.use-case';
import { RemoveOrgUnitRoleUseCase } from '../../application/org-units/use-cases/remove-org-unit-role.use-case';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'OrgUnit', schema: OrgUnitSchema },
            { name: 'OrgUnitMember', schema: OrgUnitMemberSchema },
            { name: 'OrgUnitRoleAssignment', schema: OrgUnitRoleAssignmentSchema },
            { name: 'User', schema: UserSchema },
            { name: 'Role', schema: RoleSchema },
        ]),
        AuditModule,
        UsersModule,
        RolesModule,
    ],
    controllers: [OrgUnitsController],
    providers: [
        {
            provide: ORG_UNIT_REPOSITORY,
            useClass: MongooseOrgUnitRepository,
        },
        {
            provide: ORG_UNIT_MEMBER_REPOSITORY,
            useClass: MongooseOrgUnitMemberRepository,
        },
        {
            provide: ORG_UNIT_ROLE_REPOSITORY,
            useClass: MongooseOrgUnitRoleRepository,
        },
        CreateOrgUnitUseCase,
        UpdateOrgUnitUseCase,
        ListOrgUnitsUseCase,
        GetOrgUnitTreeUseCase,
        GetOrgUnitUseCase,
        DeleteOrgUnitImpactUseCase,
        DeleteOrgUnitUseCase,
        RestoreOrgUnitUseCase,
        ListOrgUnitMembersUseCase,
        AddOrgUnitMembersUseCase,
        RemoveOrgUnitMemberUseCase,
        ListOrgUnitRolesUseCase,
        AddOrgUnitRolesUseCase,
        RemoveOrgUnitRoleUseCase,
    ],
})
export class OrgUnitsModule { }
