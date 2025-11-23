import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { Student, StudentProps, StudentStatus } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/student/ports/student.repository.interface';

export interface CreateStudentCommand {
    // Personal Information
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    nationality?: string;
    religion?: string;
    caste?: string;
    motherTongue?: string;

    // Contact Information
    email?: string;
    phone?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };

    // Guardians
    guardians: Array<{
        id?: string;
        name: string;
        relationship: 'father' | 'mother' | 'guardian' | 'sibling' | 'grandparent' | 'other';
        phone: string;
        email?: string;
        occupation?: string;
        address?: {
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        };
        isPrimary: boolean;
        isEmergencyContact: boolean;
    }>;

    // Medical Information
    medicalInfo?: {
        bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
        allergies?: string[];
        medicalConditions?: string[];
        medications?: string[];
        doctorName?: string;
        doctorPhone?: string;
        insuranceProvider?: string;
        insuranceNumber?: string;
    };

    // Enrollment Information
    enrollment: {
        admissionNumber: string;
        admissionDate: Date;
        academicYear: string;
        class: string;
        section?: string;
        rollNumber?: string;
        previousSchool?: string;
        previousClass?: string;
    };

    // Additional Information
    photo?: string;
    notes?: string;
}

@Injectable()
export class CreateStudentUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(command: CreateStudentCommand, tenantId: string): Promise<Student> {
        // Check if admission number already exists
        const existing = await this.studentRepository.findByAdmissionNumber(
            command.enrollment.admissionNumber,
            tenantId,
        );

        if (existing) {
            throw new Error(`Student with admission number ${command.enrollment.admissionNumber} already exists`);
        }

        // Ensure guardians have IDs
        const guardians = command.guardians.map(g => ({
            ...g,
            id: g.id || randomUUID(),
        }));

        // Generate a new MongoDB ObjectId for the student
        const studentId = new Types.ObjectId().toString();

        const studentProps: StudentProps = {
            id: studentId,
            tenantId,
            firstName: command.firstName,
            lastName: command.lastName,
            middleName: command.middleName,
            dateOfBirth: command.dateOfBirth,
            gender: command.gender as any,
            nationality: command.nationality,
            religion: command.religion,
            caste: command.caste,
            motherTongue: command.motherTongue,
            email: command.email,
            phone: command.phone,
            address: command.address,
            guardians: guardians as any,
            medicalInfo: command.medicalInfo as any,
            enrollment: command.enrollment as any,
            status: StudentStatus.ACTIVE,
            documents: [],
            photo: command.photo,
            notes: command.notes,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const student = new Student(studentProps);
        return await this.studentRepository.create(student);
    }
}
