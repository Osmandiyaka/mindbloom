import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student } from '../../../../domain/student/entities/student.entity';
import { IStudentRepository } from '../../../../domain/student/ports/student.repository.interface';
import { StudentDocument } from '../schemas/student.schema';
import { TenantContext } from '../../../../common/tenant/tenant.context';

@Injectable()
export class MongooseStudentRepository implements IStudentRepository {
    constructor(
        @InjectModel('Student')
        private readonly studentModel: Model<StudentDocument>,
        private readonly tenantContext: TenantContext,
    ) { }

    async findAll(): Promise<Student[]> {
        const tenantId = this.tenantContext.tenantId;
        const students = await this.studentModel.find({ tenantId }).populate('classId').exec();
        return students.map(this.toDomain);
    }

    async findById(id: string): Promise<Student | null> {
        const tenantId = this.tenantContext.tenantId;
        const student = await this.studentModel.findOne({ _id: id, tenantId }).populate('classId').exec();
        return student ? this.toDomain(student) : null;
    }

    async findByEmail(email: string): Promise<Student | null> {
        const tenantId = this.tenantContext.tenantId;
        const student = await this.studentModel.findOne({ email, tenantId }).populate('classId').exec();
        return student ? this.toDomain(student) : null;
    }

    async create(student: Student): Promise<Student> {
        const tenantId = this.tenantContext.tenantId;
        const created = await this.studentModel.create({
            tenantId,
            name: student.name,
            email: student.email,
            phone: student.phone,
            dob: student.dob,
            classId: student.classId,
            rollNo: student.rollNo,
            status: student.status,
        });

        const populated = await created.populate('classId');
        return this.toDomain(populated);
    }

    async update(id: string, data: Partial<Student>): Promise<Student> {
        const tenantId = this.tenantContext.tenantId;
        const updated = await this.studentModel
            .findOneAndUpdate(
                { _id: id, tenantId },
                {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    dob: data.dob,
                    classId: data.classId,
                    rollNo: data.rollNo,
                    status: data.status,
                },
                { new: true }
            )
            .populate('classId')
            .exec();

        if (!updated) {
            throw new Error(`Student with id ${id} not found`);
        }

        return this.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        const tenantId = this.tenantContext.tenantId;
        await this.studentModel.findOneAndDelete({ _id: id, tenantId }).exec();
    }

    private toDomain(doc: StudentDocument): Student {
        return new Student(
            doc._id.toString(),
            doc.tenantId.toString(),
            doc.name,
            doc.email,
            doc.phone,
            doc.dob,
            doc.classId?.toString(),
            doc.rollNo,
            doc.status,
            doc.createdAt,
            doc.updatedAt,
        );
    }
}
