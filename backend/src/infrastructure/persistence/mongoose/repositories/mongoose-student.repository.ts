import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student } from '../../../../domain/student/entities/student.entity';
import { IStudentRepository } from '../../../../domain/student/ports/student.repository.interface';
import { StudentDocument } from '../schemas/student.schema';

@Injectable()
export class MongooseStudentRepository implements IStudentRepository {
    constructor(
        @InjectModel('Student')
        private readonly studentModel: Model<StudentDocument>,
    ) { }

    async findAll(): Promise<Student[]> {
        const students = await this.studentModel.find().populate('classId').exec();
        return students.map(this.toDomain);
    }

    async findById(id: string): Promise<Student | null> {
        const student = await this.studentModel.findById(id).populate('classId').exec();
        return student ? this.toDomain(student) : null;
    }

    async findByEmail(email: string): Promise<Student | null> {
        const student = await this.studentModel.findOne({ email }).populate('classId').exec();
        return student ? this.toDomain(student) : null;
    }

    async create(student: Student): Promise<Student> {
        const created = await this.studentModel.create({
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
        const updated = await this.studentModel
            .findByIdAndUpdate(
                id,
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
        await this.studentModel.findByIdAndDelete(id).exec();
    }

    private toDomain(doc: StudentDocument): Student {
        return new Student(
            doc._id.toString(),
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
