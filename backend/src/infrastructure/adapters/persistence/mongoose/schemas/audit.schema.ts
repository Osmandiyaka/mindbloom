import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'audit_logs', timestamps: false })
export class AuditLogDocument extends Document {
    @Prop({ required: true, index: true })
    id: string; // uuid

    @Prop({ required: true, index: true })
    timestamp: Date;

    @Prop({ index: true })
    correlationId?: string;

    @Prop()
    requestId?: string;

    @Prop()
    traceId?: string;

    @Prop({ required: true })
    scope: 'HOST' | 'TENANT';

    @Prop({ index: true })
    tenantId?: string;

    @Prop()
    tenantNameSnapshot?: string;

    @Prop({ required: true })
    actorType!: 'HOST_USER' | 'TENANT_USER' | 'SYSTEM';

    @Prop({ index: true })
    actorUserId?: string;

    @Prop()
    actorEmailSnapshot?: string;

    @Prop({ type: [String], default: [] })
    actorRolesSnapshot?: string[];

    @Prop()
    actorTenantId?: string;

    @Prop({ default: false })
    isImpersonated?: boolean;

    @Prop()
    impersonatorUserId?: string;

    @Prop()
    impersonatorEmailSnapshot?: string;

    @Prop()
    impersonatorTenantId?: string;

    @Prop()
    impersonationReason?: string;

    @Prop({ required: true })
    category!: string;

    @Prop({ required: true, index: true })
    action!: string;

    @Prop({ default: 'INFO' })
    severity!: 'INFO' | 'WARN' | 'CRITICAL';

    @Prop({ default: 'SUCCESS' })
    result!: 'SUCCESS' | 'FAIL' | 'DENIED';

    @Prop()
    message?: string;

    @Prop({ type: [String], default: [] })
    tags?: string[];

    @Prop()
    targetType?: string;

    @Prop()
    targetId?: string;

    @Prop()
    targetNameSnapshot?: string;

    @Prop({ type: Object })
    before?: any;

    @Prop({ type: Object })
    after?: any;

    @Prop({ type: Object })
    diff?: any;

    @Prop({ type: [String], default: [] })
    changedFields?: string[];

    @Prop()
    ipAddress?: string;

    @Prop()
    userAgent?: string;

    @Prop()
    route?: string;

    @Prop()
    method?: string;

    @Prop()
    statusCode?: number;

    @Prop()
    durationMs?: number;

    @Prop({ default: false })
    isSensitive?: boolean;

    @Prop({ default: 'NONE' })
    redactionLevel?: 'NONE' | 'PARTIAL' | 'FULL';

    @Prop({ default: 'INTERNAL' })
    dataClassification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLogDocument);

// Indexes
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ actorUserId: 1, timestamp: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1, timestamp: -1 });
AuditLogSchema.index({ correlationId: 1 });

// Optionally setup TTL for retention via a separate job; don't auto-delete here.
