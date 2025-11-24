import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibraryApiService } from '../../services/library-api.service';
import { BookTitle, BorrowTransaction } from '../../models/library.models';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="reports-container">
            <div class="reports-header">
                <h1>📊 Library Reports</h1>
                <p class="subtitle">Analytics and insights for your library</p>
            </div>

            <div class="reports-grid">
                <div class="report-card">
                    <div class="report-icon">📈</div>
                    <h3>Circulation Report</h3>
                    <p>Track book issues and returns over time</p>
                    <button class="generate-btn">Generate</button>
                </div>

                <div class="report-card">
                    <div class="report-icon">⭐</div>
                    <h3>Popular Books</h3>
                    <p>Most borrowed titles this month</p>
                    <button class="generate-btn">Generate</button>
                </div>

                <div class="report-card">
                    <div class="report-icon">⏰</div>
                    <h3>Overdue Books</h3>
                    <p>List of overdue items and fines</p>
                    <button class="generate-btn">Generate</button>
                </div>

                <div class="report-card">
                    <div class="report-icon">💰</div>
                    <h3>Fine Collection</h3>
                    <p>Fine payment history and summary</p>
                    <button class="generate-btn">Generate</button>
                </div>

                <div class="report-card">
                    <div class="report-icon">📚</div>
                    <h3>Inventory Report</h3>
                    <p>Complete catalog with copy status</p>
                    <button class="generate-btn">Generate</button>
                </div>

                <div class="report-card">
                    <div class="report-icon">👥</div>
                    <h3>Member Activity</h3>
                    <p>Borrowing patterns by member type</p>
                    <button class="generate-btn">Generate</button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .reports-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
        .reports-header { margin-bottom: 2rem; }
        h1 { font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem 0; }
        .subtitle { color: #666; margin: 0; }
        .reports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .report-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); text-align: center; transition: all 0.2s; }
        .report-card:hover { transform: translateY(-4px); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12); }
        .report-icon { font-size: 3rem; margin-bottom: 1rem; }
        h3 { font-size: 1.25rem; margin: 0 0 0.5rem 0; }
        p { color: #666; margin: 0 0 1.5rem 0; }
        .generate-btn { padding: 0.75rem 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; }
        .generate-btn:hover { opacity: 0.9; }
    `]
})
export class ReportsComponent { }
