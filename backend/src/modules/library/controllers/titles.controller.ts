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
import { TitlesService } from '../../../plugins/library-management/services/titles.service';
import { CreateTitleDto, UpdateTitleDto, TitleQueryDto } from '../../../plugins/library-management/dto/title.dto';
import { TenantGuard } from '../../../common/tenant/tenant.guard';

@Controller('plugins/library/titles')
@UseGuards(TenantGuard)
export class TitlesController {
    constructor(private readonly titlesService: TitlesService) { }

    @Post()
    async create(@Body() createDto: CreateTitleDto) {
        return this.titlesService.create(createDto);
    }

    @Get()
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('categories') categories?: string,
        @Query('authors') authors?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ): Promise<any> {
        const queryDto: TitleQueryDto = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            search,
            categories: categories ? [categories] : undefined,
            authors: authors ? [authors] : undefined,
            sortBy: sortBy || 'title',
            sortOrder: sortOrder || 'asc',
        };

        return this.titlesService.findAll(queryDto);
    }

    @Get('categories')
    async getCategories() {
        return this.titlesService.getDistinctCategories();
    }

    @Get('popular')
    async getPopular(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit) : 10;
        return this.titlesService.findPopular(limitNum);
    }

    @Get('recent')
    async getRecent(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit) : 10;
        return this.titlesService.findRecent(limitNum);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.titlesService.findById(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateDto: UpdateTitleDto) {
        return this.titlesService.update(id, updateDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.titlesService.softDelete(id);
    }
}
