import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';

const DEFAULT_STAFF_SCHEMA_CONFIG = {
    requiredFields: ['staffCode', 'firstName', 'lastName'],
    enabledFields: [
        'staffCode',
        'firstName',
        'lastName',
        'preferredName',
        'dob',
        'gender',
        'nationality',
        'photoUrl',
        'status',
        'primarySchoolId',
        'primaryContactId',
        'primaryEmergencyContactId',
        'userId',
    ],
    relationshipOptions: {
        guardianRelationships: ['parent', 'guardian', 'spouse', 'sibling', 'other'],
        emergencyRelationships: ['spouse', 'parent', 'sibling', 'friend', 'other'],
    },
    noteVisibilityOptions: ['internal', 'hr', 'admin'],
    employmentTypes: ['fullTime', 'partTime', 'contract', 'volunteer', 'intern'],
    roleInAssignmentOptions: ['teacher', 'homeroomTeacher', 'headOfDepartment', 'admin', 'support'],
};

@Injectable()
export class HrService {
    constructor(
        @InjectModel('Department') private deptModel: Model<any>,
        @InjectModel('Designation') private desigModel: Model<any>,
        @InjectModel('Staff') private staffModel: Model<any>,
        @InjectModel('StaffContact') private staffContactModel: Model<any>,
        @InjectModel('StaffEmployment') private staffEmploymentModel: Model<any>,
        @InjectModel('StaffAssignment') private staffAssignmentModel: Model<any>,
        @InjectModel('StaffSchemaConfig') private staffSchemaConfigModel: Model<any>,
        @InjectModel('StaffDocument') private staffDocumentModel: Model<any>,
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
    async listStaff(filters: any = {}) {
        const query: any = {};
        if (!filters.tenantId) {
            throw new BadRequestException('tenantId is required');
        }
        query.tenantId = filters.tenantId;
        if (filters.status) query.status = filters.status;
        if (filters.hasUserAccount === 'true') {
            query.userId = { $exists: true, $ne: null };
        }
        if (filters.hasUserAccount === 'false') {
            query.$or = [{ userId: { $exists: false } }, { userId: null }];
        }

        let searchOr: any[] = [];
        if (filters.search) {
            const term = filters.search.trim();
            if (term) {
                const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                searchOr = [
                    { staffCode: regex },
                    { firstName: regex },
                    { lastName: regex },
                    { preferredName: regex },
                ];
                const contactMatches = await this.staffContactModel
                    .find(
                        {
                            tenantId: filters.tenantId,
                            $or: [{ email: regex }, { phone: regex }],
                        },
                        { staffMemberId: 1 }
                    )
                    .lean();
                const contactStaffIds = contactMatches.map(contact => contact.staffMemberId).filter(Boolean);
                if (contactStaffIds.length) {
                    searchOr.push({ _id: { $in: contactStaffIds } });
                }
            }
        }
        if (searchOr.length) {
            if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: searchOr }];
                delete query.$or;
            } else {
                query.$or = searchOr;
            }
        }

        const employmentFilterActive =
            filters.schoolId || filters.departmentOuId || filters.employmentType || filters.jobTitle;
        const assignmentFilterActive = filters.academicYearId;

        const staffIdFilters: string[][] = [];

        if (employmentFilterActive) {
            const employmentQuery: any = { tenantId: filters.tenantId };
            if (filters.schoolId) employmentQuery.schoolId = filters.schoolId;
            if (filters.departmentOuId) employmentQuery.departmentOuId = filters.departmentOuId;
            if (filters.employmentType) employmentQuery.employmentType = filters.employmentType;
            if (filters.jobTitle) {
                employmentQuery.jobTitle = new RegExp(filters.jobTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            }
            const staffIds = await this.staffEmploymentModel.distinct('staffMemberId', employmentQuery);
            staffIdFilters.push(staffIds.map(id => String(id)));
        }

        if (assignmentFilterActive) {
            const assignmentQuery: any = { tenantId: filters.tenantId };
            if (filters.academicYearId) assignmentQuery.academicYearId = filters.academicYearId;
            if (filters.schoolId) assignmentQuery.schoolId = filters.schoolId;
            const staffIds = await this.staffAssignmentModel.distinct('staffMemberId', assignmentQuery);
            staffIdFilters.push(staffIds.map(id => String(id)));
        }

        if (staffIdFilters.length) {
            const intersection = staffIdFilters.reduce((acc, list) => {
                if (!acc) return new Set(list);
                return new Set(list.filter(id => acc.has(id)));
            }, null as Set<string> | null);
            query._id = { $in: Array.from(intersection || []) };
        }

        const sortKey = ['lastName', 'updatedAt', 'status'].includes(filters.sortKey)
            ? filters.sortKey
            : 'lastName';
        const sortDirection = filters.sortDirection === 'desc' ? -1 : 1;
        const sort: Record<string, SortOrder> = sortKey === 'lastName'
            ? { lastName: sortDirection as SortOrder, firstName: sortDirection as SortOrder }
            : { [sortKey]: sortDirection as SortOrder };

        const pageSize = Number(filters.pageSize || 0);
        const page = Math.max(1, Number(filters.page || 1));
        const cursor = this.staffModel.find(query).sort(sort);
        if (pageSize > 0) {
            cursor.skip((page - 1) * pageSize).limit(pageSize);
        }
        return cursor.lean();
    }
    createStaff(dto: any) {
        if (!dto.tenantId) {
            throw new BadRequestException('tenantId is required');
        }
        return new this.staffModel(dto).save();
    }
    updateStaff(id: string, dto: any) { return this.staffModel.findByIdAndUpdate(id, dto, { new: true }); }

    /* Staff schema config */
    async getStaffSchemaConfig(tenantId?: string) {
        if (!tenantId) {
            throw new BadRequestException('tenantId is required');
        }
        const existing = await this.staffSchemaConfigModel.findOne({ tenantId }).lean();
        if (existing) return existing;
        const created = new this.staffSchemaConfigModel({
            tenantId,
            ...DEFAULT_STAFF_SCHEMA_CONFIG,
        });
        const saved = await created.save();
        return saved.toObject();
    }

    async getStaffFilters(tenantId?: string) {
        if (!tenantId) {
            throw new BadRequestException('tenantId is required');
        }
        const config = await this.getStaffSchemaConfig(tenantId);
        const statuses = ['draft', 'pending', 'active', 'onLeave', 'suspended', 'archived', 'terminated'];

        const statusAggregation = await this.staffModel.aggregate([
            { $match: { tenantId } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const statusCounts = statusAggregation.reduce((acc: Record<string, number>, row: any) => {
            if (row._id) acc[row._id] = row.count;
            return acc;
        }, {});

        const missingContactCount = await this.staffModel.aggregate([
            { $match: { tenantId } },
            {
                $lookup: {
                    from: this.staffContactModel.collection.name,
                    localField: '_id',
                    foreignField: 'staffMemberId',
                    as: 'contacts',
                },
            },
            { $match: { contacts: { $size: 0 } } },
            { $count: 'count' },
        ]);

        const missingEmploymentCount = await this.staffModel.aggregate([
            { $match: { tenantId } },
            {
                $lookup: {
                    from: this.staffEmploymentModel.collection.name,
                    localField: '_id',
                    foreignField: 'staffMemberId',
                    as: 'employments',
                },
            },
            { $match: { employments: { $size: 0 } } },
            { $count: 'count' },
        ]);

        const missingDocumentsCount = await this.staffModel.aggregate([
            { $match: { tenantId } },
            {
                $lookup: {
                    from: this.staffDocumentModel.collection.name,
                    localField: '_id',
                    foreignField: 'staffMemberId',
                    as: 'documents',
                },
            },
            { $match: { documents: { $size: 0 } } },
            { $count: 'count' },
        ]);

        return {
            statuses,
            employmentTypes: config.employmentTypes || [],
            counts: {
                status: statusCounts,
                missingContact: missingContactCount[0]?.count || 0,
                missingEmployment: missingEmploymentCount[0]?.count || 0,
                missingRequiredDocuments: missingDocumentsCount[0]?.count || 0,
            },
        };
    }

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
