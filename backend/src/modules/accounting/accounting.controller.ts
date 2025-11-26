import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { AccountingService } from './accounting.service';

@Controller('accounting')
export class AccountingController {
    constructor(private readonly accounting: AccountingService) { }

    @Get('accounts')
    listAccounts() {
        return this.accounting.listAccounts();
    }

    @Post('accounts')
    @UsePipes(new ValidationPipe({ transform: true }))
    createAccount(@Body() dto: any) {
        return this.accounting.createAccount(dto);
    }

    @Post('journals')
    postJournal(@Body() dto: any) {
        return this.accounting.postJournal({ ...dto, date: new Date(dto.date) });
    }

    @Get('trial-balance')
    trialBalance(@Query('asOf') asOf?: string) {
        return this.accounting.trialBalance(asOf ? new Date(asOf) : undefined);
    }

    @Get('periods')
    periods() {
        return this.accounting.listPeriods();
    }

    @Post('periods')
    upsertPeriod(@Body() dto: any) {
        return this.accounting.upsertPeriod({ ...dto, start: new Date(dto.start), end: new Date(dto.end) });
    }

    @Post('periods/:id/close')
    close(@Query('id') id: string) {
        return this.accounting.closePeriod(id);
    }

    @Post('periods/:id/reopen')
    reopen(@Query('id') id: string) {
        return this.accounting.reopenPeriod(id);
    }
}
