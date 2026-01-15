import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    Student,
    Gender,
    BloodGroup,
    StudentStatus,
    RelationshipType,
    Address,
    Guardian,
    MedicalInfo,
    Document as StudentDocument,
    EnrollmentInfo,
    StudentProps
} from '../../../../domain/student/entities/student.entity';
import { IStudentRepository, StudentFilters } from '../../../../domain/ports/out/student-repository.port';
import { StudentDocument as StudentDoc } from './schemas/student.schema';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { TenantContext } from '../../../../common/tenant/tenant.context';

@Injectable()
export class MongooseStudentRepository extends TenantScopedRepository<StudentDoc, Student> implements IStudentRepository {
    constructor(
        @InjectModel('Student')
        private readonly studentModel: Model<StudentDoc>,
        tenantContext: TenantContext,
    ) {
        super(tenantContext);
    }

    async create(student: Student): Promise<Student> {
        const tenantId = this.requireTenant(student.tenantId);
        const studentDoc = new this.studentModel({
            _id: new Types.ObjectId(student.id), // Use the ObjectId from domain
            tenantId: new Types.ObjectId(tenantId),
            schoolId: student.schoolId,
            firstName: student.firstName,
            lastName: student.lastName,
            middleName: student['props'].middleName,
            dateOfBirth: student.dateOfBirth,
            gender: student.gender,
            nationality: student['props'].nationality,
            religion: student['props'].religion,
            caste: student['props'].caste,
            email: student.email,
            phone: student.phone,
            address: student.address,
            guardians: student.guardians,
            medicalInfo: student.medicalInfo,
            enrollment: student.enrollment,
            status: student.status,
            documents: student.documents,
            photo: student.photo,
        });

        const saved = await studentDoc.save();
        return this.toDomain(saved);
    }

    async findById(id: string, tenantId: string): Promise<Student | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.studentModel.findOne({
            _id: id,
            tenantId: new Types.ObjectId(resolved),
        });

        return doc ? this.toDomain(doc) : null;
    }

    async findByAdmissionNumber(admissionNumber: string, tenantId: string): Promise<Student | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.studentModel.findOne({
            'enrollment.admissionNumber': admissionNumber,
            tenantId: new Types.ObjectId(resolved),
        });

        return doc ? this.toDomain(doc) : null;
    }

    async findByIds(ids: string[], tenantId: string): Promise<Student[]> {
        const resolved = this.requireTenant(tenantId);
        if (!ids.length) {
            return [];
        }
        const docs = await this.studentModel.find({
            _id: { $in: ids },
            tenantId: new Types.ObjectId(resolved),
        });
        return docs.map(doc => this.toDomain(doc));
    }

    async findAll(tenantId: string, filters?: StudentFilters): Promise<Student[]> {
        const resolved = this.requireTenant(tenantId);
        const query: any = { tenantId: new Types.ObjectId(resolved) };

        const { page, pageSize, sort } = filters || {};

        if (filters) {
            if (filters.search) {
                query.$or = [
                    { firstName: { $regex: filters.search, $options: 'i' } },
                    { lastName: { $regex: filters.search, $options: 'i' } },
                    { 'enrollment.admissionNumber': { $regex: filters.search, $options: 'i' } },
                    { email: { $regex: filters.search, $options: 'i' } },
                ];
            }
            if (filters.schoolId) {
                query.schoolId = filters.schoolId;
            }
            if (filters.class) {
                query['enrollment.class'] = filters.class;
            }
            if (filters.section) {
                query['enrollment.section'] = filters.section;
            }
            if (filters.status) {
                query.status = filters.status;
            }
            if (filters.academicYear) {
                query['enrollment.academicYear'] = filters.academicYear;
            }
            if (filters.gender) {
                query.gender = filters.gender;
            }
        }

        const sortSpec = this.resolveSort(sort);
        const cursor = this.studentModel.find(query).sort(sortSpec);
        if (page && pageSize) {
            cursor.skip((page - 1) * pageSize).limit(pageSize);
        }
        const docs = await cursor.exec();
        return docs.map(doc => this.toDomain(doc));
    }

    async update(student: Student): Promise<Student> {
        const resolved = this.requireTenant(student.tenantId);
        const doc = await this.studentModel.findOneAndUpdate(
            { _id: student.id, tenantId: new Types.ObjectId(resolved) },
            {
                $set: {
                    schoolId: student.schoolId,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    middleName: student['props'].middleName,
                    dateOfBirth: student.dateOfBirth,
                    gender: student.gender,
                    nationality: student['props'].nationality,
                    religion: student['props'].religion,
                    caste: student['props'].caste,
                    email: student.email,
                    phone: student.phone,
                    address: student.address,
                    guardians: student.guardians,
                    medicalInfo: student.medicalInfo,
                    enrollment: student.enrollment,
                    status: student.status,
                    documents: student.documents,
                    photo: student.photo,
                    updatedAt: new Date(),
                },
            },
            { new: true },
        );

        if (!doc) {
            throw new Error('Student not found');
        }

        return this.toDomain(doc);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await this.studentModel.deleteOne({
            _id: id,
            tenantId: new Types.ObjectId(tenantId),
        });
    }

    async deleteMany(ids: string[], tenantId: string): Promise<number> {
        if (!ids.length) {
            return 0;
        }
        const result = await this.studentModel.deleteMany({
            _id: { $in: ids },
            tenantId: new Types.ObjectId(tenantId),
        });
        return result.deletedCount ?? 0;
    }

    async count(tenantId: string, filters?: StudentFilters): Promise<number> {
        const query: any = { tenantId: new Types.ObjectId(tenantId) };

        if (filters) {
            if (filters.search) {
                query.$or = [
                    { firstName: { $regex: filters.search, $options: 'i' } },
                    { lastName: { $regex: filters.search, $options: 'i' } },
                    { 'enrollment.admissionNumber': { $regex: filters.search, $options: 'i' } },
                    { email: { $regex: filters.search, $options: 'i' } },
                ];
            }
            if (filters.schoolId) {
                query.schoolId = filters.schoolId;
            }
            if (filters.class) {
                query['enrollment.class'] = filters.class;
            }
            if (filters.section) {
                query['enrollment.section'] = filters.section;
            }
            if (filters.status) {
                query.status = filters.status;
            }
            if (filters.academicYear) {
                query['enrollment.academicYear'] = filters.academicYear;
            }
            if (filters.gender) {
                query.gender = filters.gender;
            }
        }

        return this.studentModel.countDocuments(query);
    }

    async getFilterStats(tenantId: string, filters?: StudentFilters): Promise<{
        grades: Array<{ value: string; count: number }>;
        sections: Array<{ value: string; count: number }>;
        years: Array<{ value: string; count: number }>;
        statuses: Array<{ value: string; count: number }>;
    }> {
        const resolved = this.requireTenant(tenantId);
        const match: any = { tenantId: new Types.ObjectId(resolved) };

        if (filters?.search) {
            match.$or = [
                { firstName: { $regex: filters.search, $options: 'i' } },
                { lastName: { $regex: filters.search, $options: 'i' } },
                { 'enrollment.admissionNumber': { $regex: filters.search, $options: 'i' } },
                { email: { $regex: filters.search, $options: 'i' } },
            ];
        }
        if (filters?.schoolId) match.schoolId = filters.schoolId;
        if (filters?.class) match['enrollment.class'] = filters.class;
        if (filters?.section) match['enrollment.section'] = filters.section;
        if (filters?.status) match.status = filters.status;
        if (filters?.academicYear) match['enrollment.academicYear'] = filters.academicYear;
        if (filters?.gender) match.gender = filters.gender;

        const [result] = await this.studentModel.aggregate([
            { $match: match },
            {
                $facet: {
                    grades: [
                        { $group: { _id: '$enrollment.class', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
                        { $sort: { _id: 1 } },
                    ],
                    sections: [
                        { $group: { _id: '$enrollment.section', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
                        { $sort: { _id: 1 } },
                    ],
                    years: [
                        { $group: { _id: '$enrollment.academicYear', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
                        { $sort: { _id: 1 } },
                    ],
                    statuses: [
                        { $group: { _id: '$status', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
                        { $sort: { _id: 1 } },
                    ],
                },
            },
        ]);

        const mapValues = (items: any[]) =>
            (items || []).map((item) => ({ value: String(item._id), count: item.count }));

        return {
            grades: mapValues(result?.grades),
            sections: mapValues(result?.sections),
            years: mapValues(result?.years),
            statuses: mapValues(result?.statuses),
        };
    }

    private resolveSort(sort?: string): Record<string, 1 | -1> {
        if (!sort) {
            return { firstName: 1, lastName: 1 };
        }
        const [field, dir] = sort.split(':');
        const direction = dir?.toLowerCase() === 'desc' ? -1 : 1;
        switch (field) {
            case 'updatedAt':
                return { updatedAt: direction };
            case 'firstName':
                return { firstName: direction };
            case 'lastName':
                return { lastName: direction };
            case 'status':
                return { status: direction };
            case 'class':
                return { 'enrollment.class': direction };
            default:
                return { firstName: 1, lastName: 1 };
        }
    }

    private toDomain(doc: StudentDoc): Student {
        const props: StudentProps = {
            id: doc._id.toString(),
            tenantId: doc.tenantId ? doc.tenantId.toString() : '',
            schoolId: doc.schoolId,
            firstName: doc.firstName,
            lastName: doc.lastName,
            middleName: doc.middleName,
            dateOfBirth: doc.dateOfBirth,
            gender: doc.gender as Gender,
            nationality: doc.nationality,
            religion: doc.religion,
            caste: doc.caste,
            email: doc.email,
            phone: doc.phone,
            address: doc.address as Address,
            guardians: doc.guardians.map(g => ({
                id: g.id,
                name: g.name,
                relationship: g.relationship as RelationshipType,
                phone: g.phone,
                email: g.email,
                occupation: g.occupation,
                address: g.address as Address,
                isPrimary: g.isPrimary,
                isEmergencyContact: g.isEmergencyContact,
            })),
            medicalInfo: doc.medicalInfo ? {
                bloodGroup: doc.medicalInfo.bloodGroup as BloodGroup,
                allergies: doc.medicalInfo.allergies,
                medicalConditions: doc.medicalInfo.medicalConditions,
                medications: doc.medicalInfo.medications,
                doctorName: doc.medicalInfo.doctorName,
                doctorPhone: doc.medicalInfo.doctorPhone,
                insuranceProvider: doc.medicalInfo.insuranceProvider,
                insuranceNumber: doc.medicalInfo.insuranceNumber,
            } : undefined,
            enrollment: {
                admissionNumber: doc.enrollment.admissionNumber,
                admissionDate: doc.enrollment.admissionDate,
                academicYear: doc.enrollment.academicYear,
                class: doc.enrollment.class,
                section: doc.enrollment.section,
                rollNumber: doc.enrollment.rollNumber,
                previousSchool: doc.enrollment.previousSchool,
                previousClass: doc.enrollment.previousClass,
            },
            status: doc.status as StudentStatus,
            documents: doc.documents?.map(d => ({
                id: d.id,
                name: d.name,
                type: d.type,
                url: d.url,
                uploadedAt: d.uploadedAt,
            })),
            photo: doc.photo,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };

        return new Student(props);
    }
}
