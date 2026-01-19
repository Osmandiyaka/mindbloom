import { Inject, Injectable } from '@nestjs/common';
import { CLASS_CONFIG_REPOSITORY, IClassConfigRepository } from '../../../domain/ports/out/class-config-repository.port';
import { GetClassConfigInput } from '../dto/class-config.inputs';
import { validateInput } from '../validation/validate-input';
import { getClassConfigSchema } from '../validation/schemas';
import { defaultClassConfig } from './shared';

@Injectable()
export class GetClassConfigUseCase {
    constructor(@Inject(CLASS_CONFIG_REPOSITORY) private readonly classConfigRepository: IClassConfigRepository) {}

    async execute(input: GetClassConfigInput) {
        const command = validateInput(getClassConfigSchema, input);
        const config = await this.classConfigRepository.get(command.tenantId);
        return (config ?? defaultClassConfig(command.tenantId)).toPrimitives();
    }
}
