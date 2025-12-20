import { Inject, Injectable } from '@nestjs/common';
import { Edition } from '../../../domain/edition/entities/edition.entity';
import { IEditionRepository } from '../../../domain/ports/out/edition-repository.port';
import { EDITION_REPOSITORY } from '../../../domain/ports/out/repository.tokens';

/**
 * Ensures global editions exist. Safe to call repeatedly.
 */
@Injectable()
export class InitializeGlobalEditionsUseCase {
    constructor(
        @Inject(EDITION_REPOSITORY)
        private readonly editionRepository: IEditionRepository,
    ) { }

    async execute(): Promise<Edition[]> {
        return this.editionRepository.initializeGlobalEditions();
    }
}
