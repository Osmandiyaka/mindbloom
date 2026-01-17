import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { HrService } from './hr.service';

@Controller('hr')
export class HrController {
    constructor(private readonly hr: HrService) { }

    /* Departments */
    @Get('departments')
    listDepartments() { return this.hr.listDepartments(); }

    @Post('departments')
    createDept(@Body() dto: any) { return this.hr.createDepartment(dto); }

    @Patch('departments/:id')
    updateDept(@Param('id') id: string, @Body() dto: any) { return this.hr.updateDepartment(id, dto); }

    /* Designations */
    @Get('designations')
    listDesignations() { return this.hr.listDesignations(); }

    @Post('designations')
    createDesignation(@Body() dto: any) { return this.hr.createDesignation(dto); }

    @Patch('designations/:id')
    updateDesignation(@Param('id') id: string, @Body() dto: any) { return this.hr.updateDesignation(id, dto); }

    /* Staff */
    @Get('staff')
    listStaff(@Query() query: any) { return this.hr.listStaff(query); }

    @Get('staff/filters')
    staffFilters(@Query('tenantId') tenantId?: string) { return this.hr.getStaffFilters(tenantId); }

    @Post('staff')
    createStaff(@Body() dto: any) { return this.hr.createStaff(dto); }

    @Patch('staff/:id')
    updateStaff(@Param('id') id: string, @Body() dto: any) { return this.hr.updateStaff(id, dto); }

    @Get('staff/schema')
    staffSchema(@Query('tenantId') tenantId?: string) { return this.hr.getStaffSchemaConfig(tenantId); }

    /* Leave types */
    @Get('leave-types')
    listLeaveTypes() { return this.hr.listLeaveTypes(); }

    @Post('leave-types')
    createLeaveType(@Body() dto: any) { return this.hr.createLeaveType(dto); }

    @Patch('leave-types/:id')
    updateLeaveType(@Param('id') id: string, @Body() dto: any) { return this.hr.updateLeaveType(id, dto); }

    /* Leave requests */
    @Get('leave-requests')
    listLeaveRequests(@Query() query: any) { return this.hr.listLeaveRequests(query); }

    @Post('leave-requests')
    requestLeave(@Body() dto: any) { return this.hr.requestLeave(dto); }

    @Post('leave-requests/:id/approve')
    approveLeave(@Param('id') id: string, @Body('approver') approver: string, @Body('comments') comments?: string) {
        return this.hr.decideLeave(id, 'approved', approver, comments);
    }

    @Post('leave-requests/:id/reject')
    rejectLeave(@Param('id') id: string, @Body('approver') approver: string, @Body('comments') comments?: string) {
        return this.hr.decideLeave(id, 'rejected', approver, comments);
    }

    /* Attendance */
    @Post('attendance')
    markAttendance(@Body() dto: any) { return this.hr.markAttendance(dto); }

    @Get('attendance')
    attendance(@Query('date') date: string) { return this.hr.attendanceForDate(date); }
}
