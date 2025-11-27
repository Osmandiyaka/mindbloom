import { Body, Controller, Get, Param, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionGuard } from '../../common/guards/permission.guard';

@Controller('finance')
export class FinanceController {
    constructor(private readonly finance: FinanceService) { }

    @Get('budgets')
    listBudgets(@Query('tenantId') tenantId?: string) {
        return this.finance.listBudgets(tenantId);
    }

    @Post('budgets')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true, skipMissingProperties: true }))
    createBudget(@Body() dto: any) {
        return this.finance.createBudget(dto);
    }

    @Get('purchase-requests')
    listPurchaseRequests(@Query('status') status?: string, @Query('tenantId') tenantId?: string) {
        return this.finance.listPurchaseRequests(status, tenantId);
    }

    @Post('purchase-requests')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    createPurchase(@Body() dto: any) {
        return this.finance.requestPurchase(dto);
    }

    @Post('purchase-requests/:id/approve')
    @Permissions('finance.expenses:approve')
    @UseGuards(PermissionGuard)
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true, skipMissingProperties: true }))
    approvePurchase(@Param('id') id: string, @Body() dto: any) {
        return this.finance.approvePurchase(id, { id: dto.approverId, name: dto.approverName, note: dto.note });
    }

    @Get('expenses')
    listExpenses(@Query('status') status?: string, @Query('tenantId') tenantId?: string) {
        return this.finance.listExpenses(status, tenantId);
    }

    @Post('expenses')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    createExpense(@Body() dto: any) {
        return this.finance.createExpense(dto);
    }

    @Post('expenses/:id/approve')
    @Permissions('finance.expenses:approve')
    @UseGuards(PermissionGuard)
    approveExpense(@Param('id') id: string, @Body() dto: any) {
        return this.finance.approveExpense(id, { id: dto.approverId, name: dto.approverName });
    }
}
