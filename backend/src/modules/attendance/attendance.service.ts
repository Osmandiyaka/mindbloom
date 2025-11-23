import { Injectable } from '@nestjs/common';

@Injectable()
export class AttendanceService {
    async findAll() {
        return { message: 'Attendance data' };
    }
}
