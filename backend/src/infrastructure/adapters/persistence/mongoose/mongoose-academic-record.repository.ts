import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AcademicRecord, AcademicRecordProps } from '../../../../domain/academics/entities/academic-record.entity';
import { ACADEMIC_RECORD_REPOSITORY, AcademicRecordFilters, IAcademicRecordRepository } from '../../../../domain/ports/out/academic-record-repository.port';
import { AcademicRecordDocument } from './schemas/academic-record.schema';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { TenantContext } from '../../../../common/tenant/tenant.context';

@Injectable()
export class MongooseAcademicRecordRepository extends TenantScopedRepository<AcademicRecordDocument, AcademicRecord> implements IAcademicRecordRepository {
  constructor(
    @InjectModel(AcademicRecordDocument.name)
    private readonly model: Model<AcademicRecordDocument>,
    tenantContext: TenantContext,
  ) {
    super(tenantContext);
  }

  async create(record: AcademicRecord): Promise<AcademicRecord> {
    const tenantId = this.requireTenant(record.tenantId);
    const doc = await this.model.create({
      _id: new Types.ObjectId(record.id),
      tenantId: new Types.ObjectId(tenantId),
      studentId: new Types.ObjectId(record.studentId),
      subject: record.subject,
      exam: record.exam,
      term: record.term,
      academicYear: record.academicYear,
      class: record.class,
      section: record.section,
      score: record.score,
      grade: record.grade,
      remarks: record.remarks,
      recordedAt: record.recordedAt,
      recordedBy: new Types.ObjectId(record.recordedBy),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    return this.toDomain(doc);
  }

  async findById(id: string, tenantId: string): Promise<AcademicRecord | null> {
    const resolved = this.requireTenant(tenantId);
    const doc = await this.model.findOne({ _id: id, tenantId: new Types.ObjectId(resolved) });
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(tenantId: string, filters: AcademicRecordFilters = {}): Promise<AcademicRecord[]> {
    const resolved = this.requireTenant(tenantId);
    const query: any = { tenantId: new Types.ObjectId(resolved) };
    if (filters.studentId) query.studentId = new Types.ObjectId(filters.studentId);
    if (filters.subject) query.subject = filters.subject;
    if (filters.exam) query.exam = filters.exam;
    if (filters.term) query.term = filters.term;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    const docs = await this.model.find(query).sort({ recordedAt: -1, createdAt: -1 });
    return docs.map(this.toDomain);
  }

  async update(record: AcademicRecord): Promise<AcademicRecord> {
    const tenantId = this.requireTenant(record.tenantId);
    const doc = await this.model.findOneAndUpdate(
      { _id: record.id, tenantId: new Types.ObjectId(tenantId) },
      {
        $set: {
          score: record.score,
          grade: record.grade,
          remarks: record.remarks,
          updatedAt: new Date(),
        },
      },
      { new: true },
    );
    if (!doc) throw new Error('Academic record not found');
    return this.toDomain(doc);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const resolved = this.requireTenant(tenantId);
    await this.model.deleteOne({ _id: id, tenantId: new Types.ObjectId(resolved) });
  }

  private toDomain = (doc: AcademicRecordDocument): AcademicRecord => {
    const props: AcademicRecordProps = {
      id: doc._id.toString(),
      tenantId: doc.tenantId.toString(),
      studentId: doc.studentId.toString(),
      subject: doc.subject,
      exam: doc.exam,
      term: doc.term,
      academicYear: doc.academicYear,
      class: doc.class,
      section: doc.section,
      score: doc.score,
      grade: doc.grade,
      remarks: doc.remarks,
      recordedAt: doc.recordedAt,
      recordedBy: doc.recordedBy.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    return new AcademicRecord(props);
  };
}
