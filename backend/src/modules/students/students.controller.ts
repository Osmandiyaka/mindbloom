import { Body, Controller, Get, Post } from '@nestjs/common';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) { }

    @Get()
    findAll() {
        return this.studentsService.findAll();
    }

    @Post()
    create(@Body() dto: any) {
        return this.studentsService.create(dto);
    }
}
