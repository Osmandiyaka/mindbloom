import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudentNote, StudentNoteProps } from '../../../../domain/student/entities/student-note.entity';
import { IStudentNoteRepository, StudentNoteFilters } from '../../../../domain/ports/out/student-note-repository.port';
import { StudentNoteDocument } from './schemas/student-note.schema';

export class MongooseStudentNoteRepository implements IStudentNoteRepository {
  constructor(
    @InjectModel(StudentNoteDocument.name)
    private readonly noteModel: Model<StudentNoteDocument>,
  ) {}

  async create(note: StudentNote): Promise<StudentNote> {
    const created = await this.noteModel.create({
      ...note.toJSON(),
      tenantId: new Types.ObjectId(note.tenantId),
      studentId: new Types.ObjectId(note.studentId),
      staffId: new Types.ObjectId(note.staffId),
    });
    return this.toDomain(created);
  }

  async findById(id: string, tenantId: string): Promise<StudentNote | null> {
    const doc = await this.noteModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(tenantId: string, filters: StudentNoteFilters): Promise<StudentNote[]> {
    const query: any = { tenantId };
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.category) query.category = filters.category;
    const docs = await this.noteModel.find(query).sort({ createdAt: -1 }).exec();
    return docs.map(this.toDomain);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.noteModel.deleteOne({ _id: id, tenantId }).exec();
  }

  private toDomain = (doc: StudentNoteDocument): StudentNote => {
    const props: StudentNoteProps = {
      id: doc._id.toString(),
      tenantId: doc.tenantId.toString(),
      studentId: doc.studentId.toString(),
      staffId: doc.staffId.toString(),
      category: doc.category as any,
      content: doc.content,
      createdAt: doc.createdAt,
    };
    return new StudentNote(props);
  };
}
