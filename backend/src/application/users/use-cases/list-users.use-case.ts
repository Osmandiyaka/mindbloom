import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, UserListQuery } from '../../../domain/ports/out/user-repository.port';
import { USER_REPOSITORY } from '../../../domain/ports/out/repository.tokens';
import { validateInput } from '../validation/validate-input';
import { ListUsersInput } from './dto/list-users.input';
import { toUserDto } from '../mappers/user.mapper';

@Injectable()
export class ListUsersUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
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
        return {
            items: result.items.map(toUserDto),
            meta: {
                total: result.total,
                page: result.page,
                pageSize: result.pageSize,
            },
        };
    }
}
