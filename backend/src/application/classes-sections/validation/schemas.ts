import { z } from 'zod';

const idSchema = z.string().min(1);
const statusSchema = z.enum(['active', 'archived']);

export const createGradeSchema = z.object({
    tenantId: idSchema,
    schoolIds: z.array(idSchema).min(1),
    name: z.string().min(1),
    code: z.string().optional(),
    sortOrder: z.number().int().optional(),
    actorUserId: z.string().optional().nullable(),
});

export const updateGradeSchema = z.object({
    tenantId: idSchema,
    gradeId: idSchema,
    schoolIds: z.array(idSchema).min(1).optional(),
    name: z.string().optional(),
    code: z.string().optional().nullable(),
    sortOrder: z.number().int().optional(),
    status: statusSchema.optional(),
    actorUserId: z.string().optional().nullable(),
});

export const listGradesSchema = z.object({
    tenantId: idSchema,
    schoolId: idSchema.optional(),
    status: statusSchema.optional(),
    search: z.string().optional(),
    page: z.number().int().optional(),
    pageSize: z.number().int().optional(),
});

export const createClassSchema = z.object({
    tenantId: idSchema,
    schoolIds: z.array(idSchema).min(1),
    academicYearId: idSchema.optional().nullable(),
    gradeId: idSchema.optional().nullable(),
    name: z.string().min(1),
    code: z.string().optional(),
    sortOrder: z.number().int().optional(),
    actorUserId: z.string().optional().nullable(),
});

export const updateClassSchema = z.object({
    tenantId: idSchema,
    classId: idSchema,
    schoolIds: z.array(idSchema).min(1).optional(),
    academicYearId: idSchema.optional().nullable(),
    gradeId: idSchema.optional().nullable(),
    name: z.string().optional(),
    code: z.string().optional().nullable(),
    sortOrder: z.number().int().optional(),
    status: statusSchema.optional(),
    actorUserId: z.string().optional().nullable(),
});

export const listClassesSchema = z.object({
    tenantId: idSchema,
    schoolId: idSchema.optional(),
    academicYearId: idSchema.optional(),
    gradeId: idSchema.optional(),
    status: statusSchema.optional(),
    search: z.string().optional(),
    page: z.number().int().optional(),
    pageSize: z.number().int().optional(),
    includeCounts: z.boolean().optional(),
});

export const reorderClassesSchema = z.object({
    tenantId: idSchema,
    updates: z.array(z.object({
        id: idSchema,
        sortOrder: z.number().int(),
    })).min(1),
    actorUserId: z.string().optional().nullable(),
});

export const createSectionSchema = z.object({
    tenantId: idSchema,
    classId: idSchema,
    schoolId: idSchema,
    name: z.string().min(1),
    code: z.string().optional(),
    capacity: z.number().int().nonnegative().optional().nullable(),
    sortOrder: z.number().int().optional(),
    actorUserId: z.string().optional().nullable(),
});

export const updateSectionSchema = z.object({
    tenantId: idSchema,
    sectionId: idSchema,
    schoolId: idSchema.optional(),
    name: z.string().optional(),
    code: z.string().optional().nullable(),
    capacity: z.number().int().nonnegative().optional().nullable(),
    sortOrder: z.number().int().optional(),
    status: statusSchema.optional(),
    actorUserId: z.string().optional().nullable(),
});

export const listSectionsByClassSchema = z.object({
    tenantId: idSchema,
    classId: idSchema,
    schoolId: idSchema.optional(),
    status: statusSchema.optional(),
    search: z.string().optional(),
    page: z.number().int().optional(),
    pageSize: z.number().int().optional(),
});

export const archiveSchema = z.object({
    tenantId: idSchema,
    id: idSchema,
    confirmationText: z.string().optional(),
    actorUserId: z.string().optional().nullable(),
});

export const restoreSchema = z.object({
    tenantId: idSchema,
    id: idSchema,
    actorUserId: z.string().optional().nullable(),
});

export const updateClassConfigSchema = z.object({
    tenantId: idSchema,
    classesScope: z.enum(['perAcademicYear', 'global']).optional(),
    requireGradeLink: z.boolean().optional(),
    sectionUniquenessScope: z.enum(['perClass', 'perClassPerSchool']).optional(),
    actorUserId: z.string().optional().nullable(),
});

export const getClassConfigSchema = z.object({
    tenantId: idSchema,
});
