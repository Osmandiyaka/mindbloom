import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChartOfAccountSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/chart-of-account.schema';
import { JournalEntrySchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/journal-entry.schema';
import { FiscalPeriodSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/fiscal-period.schema';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'ChartAccount', schema: ChartOfAccountSchema },
            { name: 'JournalEntry', schema: JournalEntrySchema },
            { name: 'FiscalPeriod', schema: FiscalPeriodSchema },
        ]),
    ],
    controllers: [AccountingController],
    providers: [AccountingService],
    exports: [AccountingService],
})
export class AccountingModule { }
