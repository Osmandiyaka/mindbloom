import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { AuditLogDocument, AuditLogSchema } from './schemas/audit.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { IAuditRepository, AuditEventInput, AuditQuery, PagedResult, AuditEvent } from '../../../../domain/ports/out/audit-repository.port';

@Injectable()
export class MongooseAuditRepository implements IAuditRepository {
    constructor(@InjectModel('AuditLog') private model: Model<AuditLogDocument>) { }

    async insert(event: AuditEventInput): Promise<void> {
        const doc = {
            ...event,
            id: event['id'] ?? uuidv4(),
            timestamp: event['timestamp'] ?? new Date(),
        } as any;

        await this.model.create(doc);
    }

    async insertMany(events: AuditEventInput[]): Promise<void> {
        if (!events.length) return;
        const docs = events.map(e => ({ ...e, id: e['id'] ?? uuidv4(), timestamp: e['timestamp'] ?? new Date() }));
        await this.model.insertMany(docs);
    }

    async query(filters: AuditQuery): Promise<PagedResult<AuditEvent>> {
        const page = Math.max(1, filters.page ?? 1);
        const pageSize = Math.max(1, filters.pageSize ?? 20);

        const query: any = {};

        if (filters.tenantId) query.tenantId = filters.tenantId;
        if (filters.actorEmail) query.actorEmailSnapshot = { $regex: filters.actorEmail, $options: 'i' };
        if (filters.action) query.action = filters.action;
        if (filters.category) query.category = filters.category;
        if (filters.severity) query.severity = filters.severity;
        if (filters.result) query.result = filters.result;
        if (filters.targetType) query.targetType = filters.targetType;

        if (filters.dateFrom || filters.dateTo) {
            query.timestamp = {};
            if (filters.dateFrom) query.timestamp.$gte = filters.dateFrom;
            if (filters.dateTo) query.timestamp.$lte = filters.dateTo;
        }

        if (filters.q) {
            const q = filters.q.replace(/[.*+?^${}()|[\]\\]/g, '');
            query.$or = [
                { message: { $regex: q, $options: 'i' } },
                { action: { $regex: q, $options: 'i' } },
                { actorEmailSnapshot: { $regex: q, $options: 'i' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.model.find(query).sort({ timestamp: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean().exec(),
            this.model.countDocuments(query),
        ]);

        return {
            items: items as any,
            total,
            page,
            pageSize,
        };
    }

    async findById(id: string) {
        const doc = await this.model.findOne({ id }).lean().exec();
        return doc as any;
    }

    async deleteOlderThan(date: Date) {
        const res = await this.model.deleteMany({ timestamp: { $lt: date } });
        return res.deletedCount ?? 0;
    }

    async redact(id: string, strategy: 'PARTIAL' | 'FULL') {
        if (strategy === 'FULL') {
            await this.model.updateOne({ id }, { $set: { before: null, after: null, diff: null, actorEmailSnapshot: null, impersonatorEmailSnapshot: null, message: null, isSensitive: true, redactionLevel: 'FULL' } }).exec();
        } else {
            await this.model.updateOne({ id }, { $set: { actorEmailSnapshot: null, impersonatorEmailSnapshot: null, redactionLevel: 'PARTIAL' } }).exec();
        }
    }
}
