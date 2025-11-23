import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Student, Guardian, RelationshipType } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/student/ports/student.repository.interface';

export interface AddGuardianCommand {
    name: string;
    relationship: RelationshipType;
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
}

@Injectable()
export class AddGuardianToStudentUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(studentId: string, tenantId: string, command: AddGuardianCommand): Promise<Student> {
        const student = await this.studentRepository.findById(studentId, tenantId);

        if (!student) {
            throw new NotFoundException(`Student with ID ${studentId} not found`);
        }

        const guardian: Guardian = {
            id: randomUUID(),
            name: command.name,
            relationship: command.relationship,
            phone: command.phone,
            email: command.email,
            occupation: command.occupation,
            address: command.address,
            isPrimary: command.isPrimary,
            isEmergencyContact: command.isEmergencyContact,
        };

        student.addGuardian(guardian);
        return await this.studentRepository.update(student);
    }
}
