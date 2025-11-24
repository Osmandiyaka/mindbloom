import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { CopiesService } from '../../../plugins/library-management/services/copies.service';
import { CreateCopyDto, UpdateCopyDto, BulkCreateCopiesDto, CopyQueryDto } from '../../../plugins/library-management/dto/copy.dto';
import { TenantGuard } from '../../../common/tenant/tenant.guard';

@Controller('plugins/library/copies')
@UseGuards(TenantGuard)
export class CopiesController {
    constructor(private readonly copiesService: CopiesService) { }

    @Post()
    async create(@Body() createDto: CreateCopyDto) {
        return this.copiesService.create(createDto);
    }

    @Post('bulk')
    async bulkCreate(@Body() bulkDto: BulkCreateCopiesDto) {
        return this.copiesService.bulkCreate(bulkDto);
    }

    @Get()
    async findAll(
        @Query('bookTitleId') bookTitleId?: string,
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<any> {
        const queryDto: CopyQueryDto = {
            bookTitleId,
            status: status as any,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        };

        return this.copiesService.findAll(queryDto);
    }

    @Get('barcode/:barcode')
    async findByBarcode(@Param('barcode') barcode: string) {
        return this.copiesService.findByBarcode(barcode);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.copiesService.findById(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateDto: UpdateCopyDto) {
        return this.copiesService.update(id, updateDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.copiesService.delete(id);
    }
}

