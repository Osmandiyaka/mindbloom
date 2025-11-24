import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-members',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="members-container">
            <div class="members-header">
                <div>
                    <h1>👥 Library Members</h1>
                    <p class="subtitle">Manage student and staff memberships</p>
                </div>
            </div>

            <div class="search-bar">
                <input type="text" [(ngModel)]="searchQuery" placeholder="Search members..." class="search-input" />
            </div>

            <div class="members-grid">
                @for (member of members(); track member.id) {
                    <div class="member-card" [routerLink]="['/plugins/library/members', member.id]">
                        <div class="member-avatar">{{ member.avatar }}</div>
                        <div class="member-info">
                            <div class="member-name">{{ member.name }}</div>
                            <div class="member-type">{{ member.type }} • {{ member.membershipNumber }}</div>
                            <div class="member-stats">
                                <span class="stat">{{ member.activeLoans }} loans</span>
                                <span class="stat" [class.warning]="member.outstandingFines > 0">
                                    {{ '$' + member.outstandingFines }} fines
                                </span>
                            </div>
                        </div>
                        <span class="status-badge" [class]="member.status.toLowerCase()">{{ member.status }}</span>
                    </div>
                }
            </div>
        </div>
    `,
    styles: [`
        .members-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
        .members-header { margin-bottom: 2rem; }
        h1 { font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem 0; }
        .subtitle { color: #666; margin: 0; }
        .search-bar { margin-bottom: 2rem; }
        .search-input { width: 100%; padding: 1rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; }
        .members-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
        .member-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); cursor: pointer; display: flex; gap: 1rem; align-items: flex-start; transition: all 0.2s; }
        .member-card:hover { transform: translateY(-4px); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12); }
        .member-avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0; }
        .member-info { flex: 1; }
        .member-name { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.25rem; }
        .member-type { font-size: 0.875rem; color: #666; margin-bottom: 0.75rem; }
        .member-stats { display: flex; gap: 1rem; font-size: 0.8125rem; }
        .stat { color: #666; }
        .stat.warning { color: #ef4444; font-weight: 600; }
        .status-badge { padding: 0.375rem 0.75rem; border-radius: 12px; font-size: 0.8125rem; font-weight: 600; }
        .status-badge.active { background: #d1fae5; color: #065f46; }
        .status-badge.blocked { background: #fee2e2; color: #991b1b; }
    `]
})
export class MembersComponent {
    searchQuery = '';
    members = signal([
        { id: '1', name: 'John Doe', type: 'Student', membershipNumber: 'LM2024001', activeLoans: 2, outstandingFines: 0, status: 'Active', avatar: '👨‍🎓' },
        { id: '2', name: 'Jane Smith', type: 'Teacher', membershipNumber: 'LM2024002', activeLoans: 1, outstandingFines: 5, status: 'Active', avatar: '👩‍🏫' },
        { id: '3', name: 'Mike Johnson', type: 'Student', membershipNumber: 'LM2024003', activeLoans: 3, outstandingFines: 0, status: 'Active', avatar: '👨‍💼' }
    ]);
}
