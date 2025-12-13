import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-student-workspace',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, ButtonComponent],
  styleUrls: ['./student-workspace.component.scss'],
  template: `
    <div class="workspace">
      <header class="page-head">
        <div>
          <p class="eyebrow">Front Desk</p>
          <h1>Front Desk Command Center</h1>
          <p class="subtitle">Real-time student status management and workflow hub</p>
        </div>
        <div class="chips">
          <span class="chip">Today: {{ today | date:'MMMM d, y' }}</span>
          <span class="chip">Time: {{ today | date:'h:mm a' }}</span>
        </div>
      </header>

      <section class="top-pane">
        <div class="card quick-log">
          <div class="card-head">
            <div>
              <p class="eyebrow">Quick Log Entry</p>
              <h3>Capture late arrivals, early outs, or notes fast.</h3>
            </div>
          </div>
          <div class="quick-row">
            <input
              type="text"
              [(ngModel)]="quickLogName"
              placeholder="Student ID or Name..."
              aria-label="Student ID or Name"
            />
            <select [(ngModel)]="quickLogStatus" aria-label="Status to log">
              <option *ngFor="let option of statusOptions" [value]="option">{{ option }}</option>
            </select>
            <button class="btn gold" (click)="logQuickEntry()">
              <span class="icon">＋</span>
              Log Status
            </button>
          </div>
        </div>

        <div class="info-grid">
          <div class="card glass">
            <div class="card-head">
              <div>
                <p class="eyebrow">Triage Command Center</p>
                <h3>Prioritize unresolved items</h3>
              </div>
              <span class="pill warning">!</span>
            </div>
            <ul class="metric-list">
              <li>
                <span>Unverified Lates</span>
                <span class="badge gold">{{ triage.unverifiedLates }}</span>
              </li>
              <li>
                <span>Unverified Absences</span>
                <span class="badge danger">{{ triage.unverifiedAbsences }}</span>
              </li>
              <li>
                <span>Early Departures</span>
                <span class="badge info">{{ triage.earlyDepartures }}</span>
              </li>
            </ul>
            <button class="btn ghost">Start Triage Workflow</button>
          </div>

          <div class="card glass">
            <div class="card-head">
              <div>
                <p class="eyebrow">Visitor Management</p>
                <h3>Monitor on-campus visitors</h3>
              </div>
              <span class="pill success">🧍</span>
            </div>
            <ul class="metric-list">
              <li>
                <span>On Campus Now</span>
                <span class="badge success">{{ visitors.onCampus }}</span>
              </li>
              <li>
                <span>Authorized Pickups</span>
                <span class="badge info">{{ visitors.authorizedPickups }}</span>
              </li>
              <li>
                <span>Pending Check-out</span>
                <span class="badge warning">{{ visitors.pendingCheckout }}</span>
              </li>
            </ul>
            <button class="btn teal">Log Visitor Check-in</button>
          </div>

          <div class="card glass">
            <div class="card-head">
              <div>
                <p class="eyebrow">Compliance Health</p>
                <h3>Docs and balances</h3>
              </div>
              <span class="pill muted">✓</span>
            </div>
            <ul class="metric-list">
              <li>
                <span>Missing Documents</span>
                <span class="badge danger">{{ compliance.missingDocs }}</span>
              </li>
              <li>
                <span>Expiring Health Forms</span>
                <span class="badge warning">{{ compliance.expiringHealth }}</span>
              </li>
              <li class="balance-row">
                <span>Outstanding Balances</span>
                <span class="balance">{{ compliance.outstandingBalance | currency:'USD':'symbol' }}</span>
              </li>
            </ul>
            <button class="btn primary">Review Compliance</button>
          </div>
        </div>
      </section>

      <section class="main-pane">
        <div class="board">
          <div class="board-head">
            <div>
              <p class="eyebrow">Student Status Board</p>
              <h3>Live roster, triage, and quick actions</h3>
            </div>
          </div>
          <div class="board-body">
            <div class="board-filters">
              <input type="text" [(ngModel)]="search" placeholder="Search by student or guardian name..." aria-label="Search students" />
              <select [(ngModel)]="gradeFilter" aria-label="Filter by grade">
                <option value="">All Grades</option>
                <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
              </select>
              <select [(ngModel)]="triageFilter" aria-label="Today triage">
                <option value="">Today's Triage</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
              <button class="icon-btn" aria-label="Search">
                <span class="icon">🔍</span>
              </button>
            </div>

            <div class="table-card">
              <div class="table-head">
                <h4>Student Status Board</h4>
                <div class="filters-inline">
                  <select [(ngModel)]="gradeFilter" aria-label="Grade quick filter">
                    <option value="">All Grades</option>
                    <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
                  </select>
                  <select [(ngModel)]="triageFilter" aria-label="Triage quick filter">
                    <option value="">Today's Triage</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
              </div>
              <table class="status-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Grade</th>
                    <th>Status (Today)</th>
                    <th>Guardian</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let student of filteredStudents()">
                    <td class="student-cell">
                      <div class="avatar">{{ student.initials }}</div>
                      <div class="student-meta">
                        <div class="name">{{ student.name }}</div>
                        <div class="id">ID · {{ student.id }}</div>
                      </div>
                    </td>
                    <td>{{ student.grade }}</td>
                    <td>
                      <span class="status-chip" [ngClass]="student.statusClass">{{ student.status }}</span>
                    </td>
                    <td>{{ student.guardian }}</td>
                    <td>
                      <button class="btn action-btn">{{ student.action }}</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="events">
          <div class="events-head">
            <div>
              <p class="eyebrow">Live Events Feed</p>
              <h3>Real-time student activity</h3>
            </div>
          </div>
          <div class="events-list">
            <div class="event" *ngFor="let event of liveEvents; trackBy: trackEvent">
              <div class="event-meta">
                <span class="dot" [ngClass]="event.type"></span>
                <span class="event-text">{{ event.text }}</span>
              </div>
              <span class="event-time">{{ event.time }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class StudentWorkspaceComponent {
  today = new Date();
  quickLogName = '';
  quickLogStatus = 'Late Arrival';
  statusOptions = ['Late Arrival', 'Early Departure', 'Absent', 'Note Only'];

  search = '';
  gradeFilter = '';
  triageFilter = '';
  grades = ['7A', '7B', '8A'];
  boardData = [
    { name: 'Emma Johnson', id: 'ID-12015', grade: '7A', status: 'Late - Unverified', statusClass: 'late', guardian: 'Sarah Johnson', action: 'Verify Late', initials: 'EJ' },
    { name: 'Liam Brown', id: 'ID-12028', grade: '7A', status: 'Late - Unverified', statusClass: 'late', guardian: 'Mark Brown', action: 'Verify Late', initials: 'LB' },
    { name: 'Sophia Lee', id: 'ID-11988', grade: '7A', status: 'Late - Unverified', statusClass: 'late', guardian: 'Anna Lee', action: 'Verify Late', initials: 'SL' },
    { name: 'Noah Patel', id: 'ID-11955', grade: '8A', status: 'Principal', statusClass: 'present', guardian: 'Priya Patel', action: 'Present', initials: 'NP' }
  ];

  triage = {
    unverifiedLates: 12,
    unverifiedAbsences: 8,
    earlyDepartures: 3
  };

  visitors = {
    onCampus: 5,
    authorizedPickups: 2,
    pendingCheckout: 1
  };

  compliance = {
    missingDocs: 7,
    expiringHealth: 15,
    outstandingBalance: 2450
  };

  liveEvents = [
    { text: 'Alex Thompson checked in — Late arrival logged', time: '9:42 AM', type: 'success' },
    { text: 'Visitor: John Davis registered — Parent meeting', time: '9:38 AM', type: 'info' },
    { text: 'Fee follow-up: Sarah Kim — outstanding balance noted', time: '9:21 AM', type: 'warning' },
    { text: 'Guardian called for Jake Lee — early pickup approved', time: '9:10 AM', type: 'info' }
  ];

  logQuickEntry() {
    if (!this.quickLogName.trim()) return;
    const text = `${this.quickLogName.trim()} logged as ${this.quickLogStatus}`;
    this.liveEvents = [
      { text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'info' },
      ...this.liveEvents
    ].slice(0, 20);
    this.quickLogName = '';
  }

  trackEvent(index: number, item: { text: string }) {
    return item.text + index;
  }

  filteredStudents() {
    return this.boardData.filter(s => {
      const matchesGrade = !this.gradeFilter || s.grade === this.gradeFilter;
      const matchesSearch = !this.search || s.name.toLowerCase().includes(this.search.toLowerCase()) || s.guardian.toLowerCase().includes(this.search.toLowerCase());
      const matchesTriage = !this.triageFilter || s.status.toLowerCase().includes(this.triageFilter);
      return matchesGrade && matchesSearch && matchesTriage;
    });
  }
}
