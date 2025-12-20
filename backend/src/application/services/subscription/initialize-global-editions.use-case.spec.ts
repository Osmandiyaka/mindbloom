import { InitializeGlobalEditionsUseCase } from './initialize-global-editions.use-case';

describe('InitializeGlobalEditionsUseCase', () => {
    it('delegates to editionRepository.initializeGlobalEditions', async () => {
        const fakeEditions = [{ name: 'x', displayName: 'X' } as any];
        const repo = { initializeGlobalEditions: jest.fn().mockResolvedValue(fakeEditions) } as any;
        const uc = new InitializeGlobalEditionsUseCase(repo);

        const res = await uc.execute();
        expect(repo.initializeGlobalEditions).toHaveBeenCalled();
        expect(res).toBe(fakeEditions);
    });
});
