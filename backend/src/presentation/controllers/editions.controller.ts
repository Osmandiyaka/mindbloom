import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/tenant/public.decorator';
import { listCanonicalEditions } from '../../domain/edition/entities/canonical-editions';

@ApiTags('Editions')
@Controller('editions')
export class EditionsController {
    @Public()
    @Get()
    @ApiOperation({ summary: 'List public editions with their feature flags' })
    async listPublic() {
        return listCanonicalEditions()
            .filter((edition) => edition.isActive)
            .map((edition) => ({
                id: edition.code,
                name: edition.code,
                displayName: edition.displayName,
                description: edition.description,
                sortOrder: edition.sortOrder,
                isActive: edition.isActive,
                monthlyPrice: edition.monthlyPrice ?? null,
                annualPrice: edition.annualPrice ?? null,
                perStudentMonthly: edition.perStudentMonthly ?? null,
                annualPriceNotes: edition.annualPriceNotes ?? null,
                features: edition.features,
                modules: edition.modules,
            }));
    }
}
