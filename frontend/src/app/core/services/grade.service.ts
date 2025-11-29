import { Injectable, signal } from '@angular/core';
import { of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Grade } from '../models/grade.model';

@Injectable({ providedIn: 'root' })
export class GradeService {
  grades = signal<Grade[]>([]);
  loading = signal(false);

  private mockGrades: Grade[] = [
    { id: 'g1', name: 'Grade 1', code: 'G1', level: 'Primary', description: 'Lower primary' },
    { id: 'g2', name: 'Grade 2', code: 'G2', level: 'Primary', description: 'Lower primary' },
    { id: 'g3', name: 'Grade 3', code: 'G3', level: 'Primary', description: 'Lower primary' },
    { id: 'g6', name: 'Grade 6', code: 'G6', level: 'Upper Primary', description: 'Upper primary' },
    { id: 'g7', name: 'Grade 7', code: 'G7', level: 'Middle School', description: 'Middle school' },
    { id: 'g8', name: 'Grade 8', code: 'G8', level: 'Middle School', description: 'Middle school' },
    { id: 'g9', name: 'Grade 9', code: 'G9', level: 'High School', description: 'High school' },
  ];

  getGrades() {
    this.loading.set(true);
    return of(this.mockGrades).pipe(
      delay(150),
      tap(list => {
        this.grades.set(list);
        this.loading.set(false);
      })
    );
  }
}
