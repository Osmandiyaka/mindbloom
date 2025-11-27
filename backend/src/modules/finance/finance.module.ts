import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BudgetSchema } from '../../infrastructure/persistence/mongoose/schemas/budget.schema';
import { PurchaseRequestSchema } from '../../infrastructure/persistence/mongoose/schemas/purchase-request.schema';
import { ExpenseClaimSchema } from '../../infrastructure/persistence/mongoose/schemas/expense-claim.schema';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { AccountingModule } from '../accounting/accounting.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        AccountingModule,
        UsersModule, // Import UsersModule for USER_REPOSITORY provider (required by PermissionGuard)
        MongooseModule.forFeature([
            { name: 'Budget', schema: BudgetSchema },
            { name: 'PurchaseRequest', schema: PurchaseRequestSchema },
            { name: 'ExpenseClaim', schema: ExpenseClaimSchema },
        ]),
    ],
    controllers: [FinanceController],
    providers: [FinanceService],
    exports: [FinanceService],
})
export class FinanceModule { }
