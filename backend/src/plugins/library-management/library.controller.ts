import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantContext } from '../../common/tenant/tenant.context';
import { LibraryService } from './library.service';

@ApiTags('Library')
@Controller('plugins/library')
@UseGuards(JwtAuthGuard, TenantGuard)
export class LibraryController {
    constructor(
        private readonly libraryService: LibraryService,
        private readonly tenantContext: TenantContext,
    ) { }

    @Get('books')
    @ApiOperation({ summary: 'Get all books' })
    async getBooks(@Query() filters: any) {
        return this.libraryService.getBooks(this.tenantContext.tenantId, filters);
    }

    @Get('books/:id')
    @ApiOperation({ summary: 'Get book by ID' })
    async getBook(@Param('id') id: string) {
        return this.libraryService.getBookById(this.tenantContext.tenantId, id);
    }

    @Post('books')
    @ApiOperation({ summary: 'Create new book' })
    async createBook(@Body() bookData: any) {
        return this.libraryService.createBook(this.tenantContext.tenantId, bookData);
    }

    @Post('books/:id/copies')
    @ApiOperation({ summary: 'Add copies to book' })
    async addCopies(@Param('id') id: string, @Body() data: { count: number }) {
        await this.libraryService.generateBookCopies(this.tenantContext.tenantId, id, data.count);
        return { success: true, message: `${data.count} copies added` };
    }

    @Get('circulation/scan/:barcode')
    @ApiOperation({ summary: 'Scan barcode' })
    async scanBarcode(@Param('barcode') barcode: string) {
        return this.libraryService.scanBarcode(this.tenantContext.tenantId, barcode);
    }

    @Get('members/:id/loans')
    @ApiOperation({ summary: 'Get member active loans' })
    async getMemberLoans(@Param('id') id: string) {
        return this.libraryService.getMemberLoans(this.tenantContext.tenantId, id);
    }
}
