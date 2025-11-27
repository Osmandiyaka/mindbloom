import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdmissionApplication, AdmissionStatus } from '../../services/admissions.service';

@Component({
    selector: 'app-application-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './application-card.component.html',
    styleUrls: ['./application-card.component.scss']
})
export class ApplicationCardComponent {
    @Input() application!: AdmissionApplication;
    @Input() compact = false;
    @Output() cardClick = new EventEmitter<string>();
    @Output() enrollClick = new EventEmitter<string>();
    @Output() statusChange = new EventEmitter<{ id: string; status: AdmissionStatus }>();

    getStatusLabel(status: AdmissionStatus): string {
        const labels: Record<AdmissionStatus, string> = {
            inquiry: 'Inquiry',
            application_submitted: 'Applied',
            under_review: 'Reviewing',
            interview_scheduled: 'Interview Set',
            interview_completed: 'Interview Done',
            accepted: 'Accepted',
            waitlisted: 'Waitlisted',
            rejected: 'Rejected',
            enrolled: 'Enrolled',
            withdrawn: 'Withdrawn'
        };
        return labels[status];
    }

    getStatusColor(status: AdmissionStatus): string {
        const colors: Record<AdmissionStatus, string> = {
            inquiry: 'gray',
            application_submitted: 'blue',
            under_review: 'yellow',
            interview_scheduled: 'purple',
            interview_completed: 'indigo',
            accepted: 'green',
            waitlisted: 'orange',
            rejected: 'red',
            enrolled: 'teal',
            withdrawn: 'gray'
        };
        return colors[status];
    }

    getPriorityIcon(priority: string): string {
        const icons: Record<string, string> = {
            low: '↓',
            medium: '→',
            high: '↑'
        };
        return icons[priority] || '→';
    }

    getScoreClass(score: number): string {
        if (score >= 85) return 'score-excellent';
        if (score >= 70) return 'score-good';
        if (score >= 50) return 'score-average';
        return 'score-low';
    }

    onCardClick(): void {
        this.cardClick.emit(this.application.id);
    }

    onEnrollClick(event: Event): void {
        event.stopPropagation();
        this.enrollClick.emit(this.application.id);
    }

    canEnroll(): boolean {
        return this.application.status === 'accepted';
    }

    getAge(): number {
        const today = new Date();
        const birthDate = new Date(this.application.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    getDaysInStatus(): number {
        const lastStatus = this.application.statusHistory[this.application.statusHistory.length - 1];
        const statusDate = new Date(lastStatus.changedAt);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - statusDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
}
