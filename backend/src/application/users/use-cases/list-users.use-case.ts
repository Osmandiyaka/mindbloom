import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, UserListQuery } from '../../../domain/ports/out/user-repository.port';
import { ISchoolRepository } from '../../../domain/ports/out/school-repository.port';
import { SCHOOL_REPOSITORY, USER_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { validateInput } from '../validation/validate-input';
import { ListUsersInput } from './dto/list-users.input';
import { toUserDto } from '../mappers/user.mapper';

@Injectable()
export class ListUsersUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(SCHOOL_REPOSITORY)
        private readonly schoolRepository: ISchoolRepository,
    ) { }

    async execute(input: ListUsersInput) {
        const command = validateInput(ListUsersInput, input);
        const query: UserListQuery = {
            tenantId: command.tenantId,
            search: command.search,
            status: command.status,
            roleId: command.roleId,
            schoolId: command.schoolId,
            page: command.page,
            pageSize: command.pageSize,
        };

        const result = await this.userRepository.list(query);
        const needsSelectedSchools = result.items.some(
            user => user.schoolAccess.scope === 'selected' && user.schoolAccess.schoolIds.length > 0,
        );
        const schoolMap = needsSelectedSchools
            ? new Map(
                (await this.schoolRepository.findAll(command.tenantId)).map(school => [school.id, school]),
            )
            : new Map();
        return {
            items: result.items.map(user => {
                const selectedSchools = user.schoolAccess.scope === 'selected'
                    ? user.schoolAccess.schoolIds
                        .map(id => schoolMap.get(id))
                        .filter((school): school is NonNullable<typeof school> => Boolean(school))
                    : [];
                return toUserDto(user, selectedSchools);
            }),
            meta: {
                total: result.total,
                page: result.page,
                pageSize: result.pageSize,
            },
        };
    }
}
