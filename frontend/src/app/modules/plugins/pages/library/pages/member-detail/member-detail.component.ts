import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
    selector: 'app-member-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
        <div class="member-detail-container">
            <div class="member-header">
                <button class="back-btn" routerLink="/plugins/library/members">← Back to Members</button>
            </div>

            <div class="member-profile">
                <div class="profile-card">
                    <div class="profile-avatar">👨‍🎓</div>
                    <div class="profile-info">
                        <h1>{{ memberName() }}</h1>
                        <p class="member-id">ID: {{ memberId() }}</p>
                        <span class="status-badge active">Active Member</span>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">3</div>
                        <div class="stat-label">Active Loans</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">$0</div>
                        <div class="stat-label">Outstanding Fines</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">45</div>
                        <div class="stat-label">Total Borrowed</div>
                    </div>
                </div>
            </div>

            <div class="loans-section">
                <h2>📚 Current Loans</h2>
                <div class="loans-list">
                    <div class="loan-item">
                        <div class="loan-book">Clean Code</div>
                        <div class="loan-due">Due: Dec 25, 2024</div>
                        <span class="loan-status ok">On Time</span>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .member-detail-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .member-header { margin-bottom: 2rem; }
        .back-btn { background: #f3f4f6; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
        .member-profile { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 2rem; }
        .profile-card { display: flex; gap: 1.5rem; align-items: center; margin-bottom: 2rem; }
        .profile-avatar { width: 96px; height: 96px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 4rem; }
        h1 { font-size: 2rem; margin: 0 0 0.5rem 0; }
        .member-id { color: #666; margin: 0 0 1rem 0; }
        .status-badge { padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.875rem; font-weight: 600; display: inline-block; }
        .status-badge.active { background: #d1fae5; color: #065f46; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .stat-card { background: #f9fafb; padding: 1.5rem; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
        .stat-label { font-size: 0.875rem; color: #666; text-transform: uppercase; }
        .loans-section { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
        h2 { font-size: 1.5rem; margin: 0 0 1.5rem 0; }
        .loan-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f9fafb; border-radius: 8px; }
        .loan-book { font-weight: 600; }
        .loan-due { color: #666; font-size: 0.875rem; }
        .loan-status { padding: 0.375rem 0.75rem; border-radius: 12px; font-size: 0.8125rem; font-weight: 600; }
        .loan-status.ok { background: #d1fae5; color: #065f46; }
    `]
})
export class MemberDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);

    memberId = signal('');
    memberName = signal('John Doe');

    ngOnInit() {
        this.memberId.set(this.route.snapshot.params['id']);
    }
}
