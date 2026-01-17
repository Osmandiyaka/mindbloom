import { ClassEntity } from '../../academics/entities/class.entity';
import { SectionEntity } from '../../academics/entities/section.entity';

export interface IClassRepository {
    listClasses(tenantId: string): Promise<ClassEntity[]>;
    findClassById(id: string, tenantId: string): Promise<ClassEntity | null>;
    createClass(entity: ClassEntity): Promise<ClassEntity>;
    updateClass(entity: ClassEntity): Promise<ClassEntity>;
    deleteClass(id: string, tenantId: string): Promise<void>;
    countClasses(tenantId: string): Promise<number>;

    listSections(tenantId: string, classId?: string): Promise<SectionEntity[]>;
    findSectionById(id: string, tenantId: string): Promise<SectionEntity | null>;
    createSection(entity: SectionEntity): Promise<SectionEntity>;
    updateSection(entity: SectionEntity): Promise<SectionEntity>;
    deleteSection(id: string, tenantId: string): Promise<void>;
    deleteSectionsByClassId(classId: string, tenantId: string): Promise<number>;
    countSections(tenantId: string, classId: string): Promise<number>;
}

export { CLASS_REPOSITORY } from './repository.tokens';
