import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/tenant/public.decorator';
import { EditionManager } from '../../application/services/subscription/edition-manager.service';

@ApiTags('Editions')
@Controller('editions')
export class EditionsController {
    constructor(private readonly editionManager: EditionManager) { }

    @Public()
    @Get()
    @ApiOperation({ summary: 'List public editions with their feature flags' })
    async listPublic() {
        const rows = await this.editionManager.listEditionsWithFeatures();
        return rows
            .filter(r => r.edition.isActive)
            .sort((a, b) => (a.edition.sortOrder ?? 0) - (b.edition.sortOrder ?? 0))
            .map((r) => ({
                id: r.edition.id,
                name: r.edition.name,
                displayName: r.edition.displayName,
                description: r.edition.description,
                sortOrder: r.edition.sortOrder,
                isActive: r.edition.isActive, monthlyPrice: r.edition.monthlyPrice ?? null,
                annualPrice: r.edition.annualPrice ?? null,
                perStudentMonthly: r.edition.perStudentMonthly ?? null,
                annualPriceNotes: r.edition.annualPriceNotes ?? null, features: r.features,
            }));
    }
}
