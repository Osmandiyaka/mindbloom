import { Injectable } from '@nestjs/common';

@Injectable()
export class AcademicsService {
    async findAll() {
        return { message: 'Academic data' };
    }
}
