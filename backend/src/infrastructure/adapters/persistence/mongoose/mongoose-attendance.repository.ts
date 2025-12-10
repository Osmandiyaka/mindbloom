import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceRecord, AttendanceRecordProps, AttendanceStatus } from '../../../../domain/attendance/entities/attendance-record.entity';
import { ATTENDANCE_REPOSITORY, AttendanceFilters, IAttendanceRepository } from '../../../../domain/ports/out/attendance-repository.port';
import { AttendanceDocument } from './schemas/attendance.schema';
import { TenantScopedRepository } from '../../../../common/tenant/tenant-scoped.repository';
import { TenantContext } from '../../../../common/tenant/tenant.context';

@Injectable()
export class MongooseAttendanceRepository extends TenantScopedRepository<AttendanceDocument, AttendanceRecord> implements IAttendanceRepository {
  constructor(
    @InjectModel(AttendanceDocument.name)
    private readonly attendanceModel: Model<AttendanceDocument>,
    tenantContext: TenantContext,
  ) {
    super(tenantContext);
  }

  async create(record: AttendanceRecord): Promise<AttendanceRecord> {
    const tenantId = this.requireTenant(record.tenantId);
    const created = await this.attendanceModel.create({
      _id: new Types.ObjectId(record.id),
      tenantId: new Types.ObjectId(tenantId),
      studentId: new Types.ObjectId(record.studentId),
      class: record.class,
      section: record.section,
      date: record.date,
      status: record.status,
      reason: record.reason,
      recordedBy: new Types.ObjectId(record.recordedBy),
      recordedAt: record.recordedAt,
    });
    return this.toDomain(created);
  }

  async findById(id: string, tenantId: string): Promise<AttendanceRecord | null> {
    const resolved = this.requireTenant(tenantId);
    const doc = await this.attendanceModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(resolved),
    });
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(tenantId: string, filters: AttendanceFilters = {}): Promise<AttendanceRecord[]> {
    const resolved = this.requireTenant(tenantId);
    const query: any = { tenantId: new Types.ObjectId(resolved) };

    if (filters.studentId) {
      query.studentId = new Types.ObjectId(filters.studentId);
    }
    if (filters.class) query.class = filters.class;
    if (filters.section) query.section = filters.section;
    if (filters.status) query.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = filters.dateFrom;
      if (filters.dateTo) query.date.$lte = filters.dateTo;
    }

    const docs = await this.attendanceModel.find(query).sort({ date: -1, createdAt: -1 });
    return docs.map(this.toDomain);
  }

  async update(record: AttendanceRecord): Promise<AttendanceRecord> {
    const resolved = this.requireTenant(record.tenantId);
    const doc = await this.attendanceModel.findOneAndUpdate(
      { _id: record.id, tenantId: new Types.ObjectId(resolved) },
      {
        $set: {
          status: record.status,
          reason: record.reason,
          recordedBy: new Types.ObjectId(record.recordedBy),
          recordedAt: record.recordedAt,
        },
      },
      { new: true },
    );

    if (!doc) {
      throw new Error('Attendance record not found');
    }
    return this.toDomain(doc);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const resolved = this.requireTenant(tenantId);
    await this.attendanceModel.deleteOne({ _id: id, tenantId: new Types.ObjectId(resolved) });
  }

  private toDomain = (doc: AttendanceDocument): AttendanceRecord => {
    const props: AttendanceRecordProps = {
      id: doc._id.toString(),
      tenantId: doc.tenantId.toString(),
      studentId: doc.studentId.toString(),
      class: doc.class,
      section: doc.section,
      date: doc.date,
      status: doc.status as AttendanceStatus,
      reason: doc.reason,
      recordedBy: doc.recordedBy.toString(),
      recordedAt: doc.recordedAt,
    };
    return new AttendanceRecord(props);
  };
}
