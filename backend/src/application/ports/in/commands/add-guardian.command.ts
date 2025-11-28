import { RelationshipType } from '../../../../domain/student/entities/student.entity';

export interface AddGuardianCommand {
    studentId: string;
    tenantId: string;
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
