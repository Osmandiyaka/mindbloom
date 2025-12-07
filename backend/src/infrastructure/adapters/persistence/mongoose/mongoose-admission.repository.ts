import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    Admission,
    ApplicationStatus,
    ApplicationSource,
    Gender,
    RelationshipType,
    Address,
    GuardianContact,
    PreviousSchoolInfo,
    ApplicationDocument,
    StatusHistoryEntry,
    ApplicationScore,
} from '../../../../domain/admission/entities/admission.entity';
import { IAdmissionRepository, AdmissionFilters } from '../../../../domain/ports/out/admission-repository.port';
import { AdmissionDocument as AdmissionDoc } from './schemas/admission.schema';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { TenantContext } from '../../../../common/tenant/tenant.context';

@Injectable()
export class MongooseAdmissionRepository
    extends TenantScopedRepository<AdmissionDoc, Admission>
    implements IAdmissionRepository
{
    constructor(
        @InjectModel('Admission')
        private readonly admissionModel: Model<AdmissionDoc>,
        tenantContext: TenantContext,
    ) {
        super(tenantContext);
    }

    async create(admission: Admission): Promise<Admission> {
        const tenantId = this.requireTenant(admission.tenantId);
        const admissionDoc = new this.admissionModel({
            _id: new Types.ObjectId(),
            tenantId: new Types.ObjectId(tenantId),
            applicationNumber: admission.applicationNumber,
            source: admission.source,
            status: admission.status,
            firstName: admission.firstName,
            lastName: admission.lastName,
            middleName: admission.middleName,
            dateOfBirth: admission.dateOfBirth,
            gender: admission.gender,
            nationality: admission.nationality,
            religion: admission.religion,
            bloodGroup: admission.bloodGroup,
            email: admission.email,
            phone: admission.phone,
            address: admission.address,
            guardians: admission.guardians,
            gradeApplying: admission.gradeApplying,
            academicYear: admission.academicYear,
            previousSchool: admission.previousSchool,
            documents: admission.documents || [],
            personalStatement: admission.personalStatement,
            score: admission.score,
            statusHistory: admission.statusHistory,
            statusUpdatedAt: admission.statusUpdatedAt,
            offerSentAt: admission.offerSentAt,
            offerExpiresAt: admission.offerExpiresAt,
            offerAcceptedAt: admission.offerAcceptedAt,
            waitlistPosition: admission.waitlistPosition,
            waitlistExpiresAt: admission.waitlistExpiresAt,
            notes: admission.notes,
            internalNotes: admission.internalNotes,
            applicationFeeAmount: admission.applicationFeeAmount,
            applicationFeePaid: admission.applicationFeePaid,
            submittedAt: admission.submittedAt,
        });

        const saved = await admissionDoc.save();
        return this.toDomain(saved);
    }

    async findById(id: string, tenantId: string): Promise<Admission | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.admissionModel.findOne({
            _id: id,
            tenantId: new Types.ObjectId(resolved),
        });

        return doc ? this.toDomain(doc) : null;
    }

    async findByEmail(email: string, tenantId: string): Promise<Admission | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.admissionModel.findOne({
            email: email.toLowerCase(),
            tenantId: new Types.ObjectId(resolved),
        });

        return doc ? this.toDomain(doc) : null;
    }

    async findByApplicationNumber(
        applicationNumber: string,
        tenantId: string,
    ): Promise<Admission | null> {
        const resolved = this.requireTenant(tenantId);
        const doc = await this.admissionModel.findOne({
            applicationNumber,
            tenantId: new Types.ObjectId(resolved),
        });

        return doc ? this.toDomain(doc) : null;
    }

    async findAll(tenantId: string, filters?: AdmissionFilters): Promise<Admission[]> {
        const resolved = this.requireTenant(tenantId);
        const query: any = { tenantId: new Types.ObjectId(resolved) };

        if (filters) {
            if (filters.search) {
                query.$or = [
                    { firstName: { $regex: filters.search, $options: 'i' } },
                    { lastName: { $regex: filters.search, $options: 'i' } },
                    { email: { $regex: filters.search, $options: 'i' } },
                    { applicationNumber: { $regex: filters.search, $options: 'i' } },
                ];
            }
            if (filters.status) {
                query.status = filters.status;
            }
            if (filters.statuses && filters.statuses.length > 0) {
                query.status = { $in: filters.statuses };
            }
            if (filters.gradeApplying) {
                query.gradeApplying = filters.gradeApplying;
            }
            if (filters.academicYear) {
                query.academicYear = filters.academicYear;
            }
            if (filters.source) {
                query.source = filters.source;
            }
            if (filters.dateFrom || filters.dateTo) {
                query.createdAt = {};
                if (filters.dateFrom) {
                    query.createdAt.$gte = filters.dateFrom;
                }
                if (filters.dateTo) {
                    query.createdAt.$lte = filters.dateTo;
                }
            }
        }

        const docs = await this.admissionModel
            .find(query)
            .sort({ createdAt: -1, firstName: 1 });
        return docs.map((doc) => this.toDomain(doc));
    }

    async update(admission: Admission): Promise<Admission> {
        const resolved = this.requireTenant(admission.tenantId);
        const doc = await this.admissionModel.findOneAndUpdate(
            { _id: admission.id, tenantId: new Types.ObjectId(resolved) },
            {
                $set: {
                    applicationNumber: admission.applicationNumber,
                    source: admission.source,
                    status: admission.status,
                    firstName: admission.firstName,
                    lastName: admission.lastName,
                    middleName: admission.middleName,
                    dateOfBirth: admission.dateOfBirth,
                    gender: admission.gender,
                    nationality: admission.nationality,
                    religion: admission.religion,
                    bloodGroup: admission.bloodGroup,
                    email: admission.email,
                    phone: admission.phone,
                    address: admission.address,
                    guardians: admission.guardians,
                    gradeApplying: admission.gradeApplying,
                    academicYear: admission.academicYear,
                    previousSchool: admission.previousSchool,
                    documents: admission.documents,
                    personalStatement: admission.personalStatement,
                    score: admission.score,
                    statusHistory: admission.statusHistory,
                    statusUpdatedAt: admission.statusUpdatedAt,
                    offerSentAt: admission.offerSentAt,
                    offerExpiresAt: admission.offerExpiresAt,
                    offerAcceptedAt: admission.offerAcceptedAt,
                    waitlistPosition: admission.waitlistPosition,
                    waitlistExpiresAt: admission.waitlistExpiresAt,
                    notes: admission.notes,
                    internalNotes: admission.internalNotes,
                    applicationFeeAmount: admission.applicationFeeAmount,
                    applicationFeePaid: admission.applicationFeePaid,
                    submittedAt: admission.submittedAt,
                    updatedAt: new Date(),
                },
            },
            { new: true },
        );

        if (!doc) {
            throw new Error('Admission not found');
        }

        return this.toDomain(doc);
    }

    async updateStatus(
        id: string,
        tenantId: string,
        status: ApplicationStatus,
        changedBy: string,
        note?: string,
    ): Promise<Admission> {
        const admission = await this.findById(id, tenantId);
        if (!admission) {
            throw new Error('Admission not found');
        }

        const updatedAdmission = admission.updateStatus(status, changedBy, note);
        return await this.update(updatedAdmission);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        const resolved = this.requireTenant(tenantId);
        await this.admissionModel.deleteOne({
            _id: id,
            tenantId: new Types.ObjectId(resolved),
        });
    }

    async count(tenantId: string, filters?: AdmissionFilters): Promise<number> {
        const resolved = this.requireTenant(tenantId);
        const query: any = { tenantId: new Types.ObjectId(resolved) };

        if (filters) {
            if (filters.status) {
                query.status = filters.status;
            }
            if (filters.statuses && filters.statuses.length > 0) {
                query.status = { $in: filters.statuses };
            }
            if (filters.gradeApplying) {
                query.gradeApplying = filters.gradeApplying;
            }
            if (filters.academicYear) {
                query.academicYear = filters.academicYear;
            }
        }

        return await this.admissionModel.countDocuments(query);
    }

    async countByStatus(tenantId: string): Promise<Record<ApplicationStatus, number>> {
        const resolved = this.requireTenant(tenantId);
        const results = await this.admissionModel.aggregate([
            { $match: { tenantId: new Types.ObjectId(resolved) } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const counts: any = {};
        Object.values(ApplicationStatus).forEach((status) => {
            counts[status] = 0;
        });

        results.forEach((result) => {
            counts[result._id] = result.count;
        });

        return counts;
    }

    // Convert MongoDB document to domain entity
    private toDomain(doc: AdmissionDoc): Admission {
        return new Admission({
            id: doc._id.toString(),
            tenantId: doc.tenantId.toString(),
            applicationNumber: doc.applicationNumber,
            source: doc.source as ApplicationSource,
            status: doc.status as ApplicationStatus,
            firstName: doc.firstName,
            lastName: doc.lastName,
            middleName: doc.middleName,
            dateOfBirth: doc.dateOfBirth,
            gender: doc.gender as Gender,
            nationality: doc.nationality,
            religion: doc.religion,
            bloodGroup: doc.bloodGroup,
            email: doc.email,
            phone: doc.phone,
            address: doc.address as Address,
            guardians: doc.guardians as GuardianContact[],
            gradeApplying: doc.gradeApplying,
            academicYear: doc.academicYear,
            previousSchool: doc.previousSchool as PreviousSchoolInfo,
            documents: doc.documents as ApplicationDocument[],
            personalStatement: doc.personalStatement,
            score: doc.score as ApplicationScore,
            statusHistory: doc.statusHistory as StatusHistoryEntry[],
            statusUpdatedAt: doc.statusUpdatedAt,
            offerSentAt: doc.offerSentAt,
            offerExpiresAt: doc.offerExpiresAt,
            offerAcceptedAt: doc.offerAcceptedAt,
            waitlistPosition: doc.waitlistPosition,
            waitlistExpiresAt: doc.waitlistExpiresAt,
            notes: doc.notes,
            internalNotes: doc.internalNotes,
            applicationFeeAmount: doc.applicationFeeAmount,
            applicationFeePaid: doc.applicationFeePaid,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            submittedAt: doc.submittedAt,
        });
    }
}
