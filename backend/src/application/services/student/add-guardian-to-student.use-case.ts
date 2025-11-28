import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Student, Guardian } from '../../../domain/student/entities/student.entity';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/ports/out/student-repository.port';
import { AddGuardianCommand } from '../../ports/in/commands/add-guardian.command';

@Injectable()
export class AddGuardianToStudentUseCase {
    constructor(
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(command: AddGuardianCommand): Promise<Student> {
        const student = await this.studentRepository.findById(command.studentId, command.tenantId);

        if (!student) {
            throw new NotFoundException(`Student with ID ${command.studentId} not found`);
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
