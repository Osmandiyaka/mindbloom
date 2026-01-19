import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ClassPayload,
  ClassResponse,
  ClassSectionService,
  SectionResponse,
} from '../../../../../core/services/class-section.service';

@Injectable({ providedIn: 'root' })
export class ClassesSectionsApiService {
  constructor(private readonly classSectionService: ClassSectionService) {}

  createClass(payload: ClassPayload): Observable<ClassResponse> {
    return this.classSectionService.createClass(payload);
  }

  updateClass(id: string, payload: Partial<ClassPayload>): Observable<ClassResponse> {
    return this.classSectionService.updateClass(id, payload);
  }

  deleteClass(id: string): Observable<void> {
    return this.classSectionService.deleteClass(id);
  }

  createSection(payload: {
    classId: string;
    name: string;
    code?: string;
    capacity?: number | null;
    homeroomTeacherId?: string | null;
    active?: boolean;
    sortOrder?: number;
  }): Observable<SectionResponse> {
    return this.classSectionService.createSection(payload);
  }

  updateSection(id: string, payload: Partial<{
    classId: string;
    name: string;
    code?: string;
    capacity?: number | null;
    homeroomTeacherId?: string | null;
    active?: boolean;
    sortOrder?: number;
  }>): Observable<SectionResponse> {
    return this.classSectionService.updateSection(id, payload);
  }

  deleteSection(id: string): Observable<void> {
    return this.classSectionService.deleteSection(id);
  }
}
