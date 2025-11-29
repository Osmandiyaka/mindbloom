import { Injectable, signal } from '@angular/core';
import { nanoid } from 'nanoid';

export interface WalkInRecord {
  id: string;
  basic: {
    name: string;
    grade: string;
    parentName: string;
    parentContact: string;
    reason?: string;
  };
  assignment: { className: string; section: string };
  payment: { plan: string; mode: string; amount: number; reference?: string };
  submittedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class WalkInService {
  records = signal<WalkInRecord[]>([
    {
      id: 'walk-001',
      basic: { name: 'Ngozi Ade', grade: 'Grade 6', parentName: 'Mr. Ade', parentContact: '+2348012345678' },
      assignment: { className: 'Class A', section: 'Blue' },
      payment: { plan: 'STD', mode: 'cash', amount: 25000, reference: 'POS-123' },
      submittedAt: new Date(),
    },
    {
      id: 'walk-002',
      basic: { name: 'Tunde Bello', grade: 'Grade 7', parentName: 'Mrs. Bello', parentContact: '+2348098765432' },
      assignment: { className: 'Class B', section: 'Green' },
      payment: { plan: 'PREM', mode: 'card', amount: 40000, reference: 'CARD-789' },
      submittedAt: new Date(),
    },
  ]);

  upsert(record: Omit<WalkInRecord, 'id' | 'submittedAt'> & { id?: string; submittedAt?: Date }): WalkInRecord {
    const newRecord: WalkInRecord = {
      id: record.id || nanoid(8),
      submittedAt: record.submittedAt || new Date(),
      basic: record.basic,
      assignment: record.assignment,
      payment: record.payment,
    };
    const existing = this.records().filter(r => r.id !== newRecord.id);
    this.records.set([newRecord, ...existing]);
    return newRecord;
  }

  getById(id: string): WalkInRecord | undefined {
    return this.records().find(r => r.id === id);
  }
}
