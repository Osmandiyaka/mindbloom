import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class HrService {
    constructor(
        @InjectModel('Department') private deptModel: Model<any>,
        @InjectModel('Designation') private desigModel: Model<any>,
        @InjectModel('Staff') private staffModel: Model<any>,
        @InjectModel('LeaveType') private leaveTypeModel: Model<any>,
        @InjectModel('LeaveRequest') private leaveReqModel: Model<any>,
        @InjectModel('StaffAttendance') private attModel: Model<any>,
    ) { }

    /* Departments */
    listDepartments() { return this.deptModel.find().sort({ name: 1 }).lean(); }
    createDepartment(dto: any) { return new this.deptModel(dto).save(); }
    updateDepartment(id: string, dto: any) { return this.deptModel.findByIdAndUpdate(id, dto, { new: true }); }

    /* Designations */
    listDesignations() { return this.desigModel.find().sort({ name: 1 }).lean(); }
    createDesignation(dto: any) { return new this.desigModel(dto).save(); }
    updateDesignation(id: string, dto: any) { return this.desigModel.findByIdAndUpdate(id, dto, { new: true }); }

    /* Staff */
    listStaff(filters: any = {}) {
        const query: any = {};
        if (filters.departmentCode) query.departmentCode = filters.departmentCode;
        if (filters.designationCode) query.designationCode = filters.designationCode;
        if (filters.status) query.status = filters.status;
        return this.staffModel.find(query).sort({ lastName: 1, firstName: 1 }).lean();
    }
    createStaff(dto: any) { return new this.staffModel(dto).save(); }
    updateStaff(id: string, dto: any) { return this.staffModel.findByIdAndUpdate(id, dto, { new: true }); }

    /* Leave Types */
    listLeaveTypes() { return this.leaveTypeModel.find().sort({ name: 1 }).lean(); }
    createLeaveType(dto: any) { return new this.leaveTypeModel(dto).save(); }
    updateLeaveType(id: string, dto: any) { return this.leaveTypeModel.findByIdAndUpdate(id, dto, { new: true }); }

    /* Leave Requests */
    async listLeaveRequests(filters: any = {}) {
        const query: any = {};
        if (filters.staffId) query.staffId = filters.staffId;
        if (filters.status) query.status = filters.status;
        return this.leaveReqModel.find(query).sort({ createdAt: -1 }).lean();
    }

    async requestLeave(dto: any) {
        return new this.leaveReqModel(dto).save();
    }

    async decideLeave(id: string, status: 'approved' | 'rejected', approver: string, comments?: string) {
        const req = await this.leaveReqModel.findById(id);
        if (!req) throw new NotFoundException('Leave request not found');
        req.status = status;
        req.approver = approver;
        req.decisionDate = new Date();
        req.comments = comments;
        return req.save();
    }

    /* Attendance */
    markAttendance(dto: any) {
        return this.attModel.findOneAndUpdate(
            { staffId: dto.staffId, date: dto.date },
            { $set: dto },
            { upsert: true, new: true }
        );
    }

    attendanceForDate(date: string) {
        return this.attModel.find({ date: new Date(date) }).lean();
    }
}
