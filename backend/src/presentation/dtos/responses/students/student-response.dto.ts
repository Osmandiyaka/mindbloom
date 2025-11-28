import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../../../../domain/student/entities/student.entity';

class AddressResponseDto {
    @ApiProperty()
    street: string;

    @ApiProperty()
    city: string;

    @ApiProperty()
    state: string;

    @ApiProperty()
    postalCode: string;

    @ApiProperty()
    country: string;
}

class GuardianResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    relationship: string;

    @ApiProperty()
    phone: string;

    @ApiProperty({ required: false })
    email?: string;

    @ApiProperty({ required: false })
    occupation?: string;

    @ApiProperty({ type: AddressResponseDto, required: false })
    address?: AddressResponseDto;

    @ApiProperty()
    isPrimary: boolean;

    @ApiProperty()
    isEmergencyContact: boolean;
}

class MedicalInfoResponseDto {
    @ApiProperty({ required: false })
    bloodGroup?: string;

    @ApiProperty({ type: [String], required: false })
    allergies?: string[];

    @ApiProperty({ type: [String], required: false })
    medicalConditions?: string[];

    @ApiProperty({ type: [String], required: false })
    medications?: string[];

    @ApiProperty({ required: false })
    doctorName?: string;

    @ApiProperty({ required: false })
    doctorPhone?: string;

    @ApiProperty({ required: false })
    insuranceProvider?: string;

    @ApiProperty({ required: false })
    insuranceNumber?: string;
}

class DocumentResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    type: string;

    @ApiProperty()
    url: string;

    @ApiProperty()
    uploadedAt: Date;
}

class EnrollmentInfoResponseDto {
    @ApiProperty()
    admissionNumber: string;

    @ApiProperty()
    admissionDate: Date;

    @ApiProperty()
    academicYear: string;

    @ApiProperty()
    class: string;

    @ApiProperty({ required: false })
    section?: string;

    @ApiProperty({ required: false })
    rollNumber?: string;

    @ApiProperty({ required: false })
    previousSchool?: string;

    @ApiProperty({ required: false })
    previousClass?: string;
}

export class StudentResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    fullName: string;

    @ApiProperty({ required: false })
    middleName?: string;

    @ApiProperty()
    dateOfBirth: Date;

    @ApiProperty()
    age: number;

    @ApiProperty()
    gender: string;

    @ApiProperty({ required: false })
    nationality?: string;

    @ApiProperty({ required: false })
    religion?: string;

    @ApiProperty({ required: false })
    caste?: string;

    @ApiProperty({ required: false })
    motherTongue?: string;

    @ApiProperty({ required: false })
    email?: string;

    @ApiProperty({ required: false })
    phone?: string;

    @ApiProperty({ type: AddressResponseDto, required: false })
    address?: AddressResponseDto;

    @ApiProperty({ type: [GuardianResponseDto] })
    guardians: GuardianResponseDto[];

    @ApiProperty({ type: GuardianResponseDto, required: false })
    primaryGuardian?: GuardianResponseDto;

    @ApiProperty({ type: MedicalInfoResponseDto, required: false })
    medicalInfo?: MedicalInfoResponseDto;

    @ApiProperty({ type: EnrollmentInfoResponseDto })
    enrollment: EnrollmentInfoResponseDto;

    @ApiProperty()
    status: string;

    @ApiProperty({ type: [DocumentResponseDto], required: false })
    documents?: DocumentResponseDto[];

    @ApiProperty({ required: false })
    photo?: string;

    @ApiProperty({ required: false })
    notes?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    static fromDomain(student: Student): StudentResponseDto {
        const dto = new StudentResponseDto();
        dto.id = student.id;
        dto.firstName = student.firstName;
        dto.lastName = student.lastName;
        dto.fullName = student.fullName;
        dto.middleName = student['props'].middleName;
        dto.dateOfBirth = student.dateOfBirth;
        dto.age = student.age;
        dto.gender = student.gender;
        dto.nationality = student['props'].nationality;
        dto.religion = student['props'].religion;
        dto.caste = student['props'].caste;
        dto.motherTongue = student['props'].motherTongue;
        dto.email = student.email;
        dto.phone = student.phone;
        dto.address = student.address;
        dto.guardians = student.guardians;
        dto.primaryGuardian = student.primaryGuardian;
        dto.medicalInfo = student.medicalInfo;
        dto.enrollment = student.enrollment;
        dto.status = student.status;
        dto.documents = student.documents;
        dto.photo = student.photo;
        dto.notes = student.notes;
        dto.createdAt = student.createdAt;
        dto.updatedAt = student.updatedAt;
        return dto;
    }
}
