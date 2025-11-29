import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Grade } from '../../../core/models/grade.model';
import { GradeService } from '../../../core/services/grade.service';

@Component({
  selector: 'app-grade-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grade-selector.component.html',
  styleUrls: ['./grade-selector.component.scss'],
})
export class GradeSelectorComponent implements OnInit {
  @Input() selectedGradeIds: string[] = [];
  @Output() selectionChange = new EventEmitter<Grade[]>();

  isOpen = signal(false);
  search = signal('');
  selected = signal<Set<string>>(new Set());

  grades = this.gradeService.grades;
  loading = this.gradeService.loading;

  filteredGrades = computed(() => {
    const term = this.search().toLowerCase().trim();
    return this.grades().filter((grade) => {
      if (!term) return true;
      return (
        grade.name.toLowerCase().includes(term) ||
        (grade.code ?? '').toLowerCase().includes(term) ||
        (grade.level ?? '').toLowerCase().includes(term) ||
        (grade.description ?? '').toLowerCase().includes(term)
      );
    });
  });

  selectedCount = computed(() => this.selected().size);

  constructor(private readonly gradeService: GradeService) {}

  ngOnInit(): void {
    if (this.selectedGradeIds?.length) {
      this.selected.set(new Set(this.selectedGradeIds));
    }
    if (!this.grades().length) {
      this.gradeService.getGrades().subscribe();
    }
  }

  open(): void {
    this.isOpen.set(true);
    if (!this.grades().length) {
      this.gradeService.getGrades().subscribe();
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(grade: Grade): void {
    const current = new Set(this.selected());
    if (current.has(grade.id)) {
      current.delete(grade.id);
    } else {
      current.add(grade.id);
    }
    this.selected.set(current);
  }

  isSelected(gradeId: string): boolean {
    return this.selected().has(gradeId);
  }

  confirm(): void {
    const selectedGrades = this.grades().filter((g) => this.selected().has(g.id));
    this.selectionChange.emit(selectedGrades);
    this.close();
  }
}
