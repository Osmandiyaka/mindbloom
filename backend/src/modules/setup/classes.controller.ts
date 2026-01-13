import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@ApiTags('setup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('setup/classes')
export class ClassesController {
    constructor(private readonly classesService: ClassesService) { }

    @Get()
    @ApiOperation({ summary: 'List classes' })
    async listClasses() {
        return this.classesService.listClasses();
    }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Create class' })
    async createClass(@Body() dto: CreateClassDto) {
        return this.classesService.createClass(dto);
    }

    @Patch(':id')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Update class' })
    async updateClass(@Param('id') id: string, @Body() dto: UpdateClassDto) {
        return this.classesService.updateClass(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete class' })
    async deleteClass(@Param('id') id: string) {
        return this.classesService.deleteClass(id);
    }

    @Get('sections')
    @ApiOperation({ summary: 'List sections' })
    async listSections(@Query('classId') classId?: string) {
        return this.classesService.listSections(classId);
    }

    @Post('sections')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Create section' })
    async createSection(@Body() dto: CreateSectionDto) {
        return this.classesService.createSection(dto);
    }

    @Patch('sections/:id')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Update section' })
    async updateSection(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
        return this.classesService.updateSection(id, dto);
    }

    @Delete('sections/:id')
    @ApiOperation({ summary: 'Delete section' })
    async deleteSection(@Param('id') id: string) {
        return this.classesService.deleteSection(id);
    }
}
