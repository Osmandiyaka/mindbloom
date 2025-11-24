import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibraryService, ScanResult } from '../../services/library.service';

type OperationMode = 'issue' | 'return';

@Component({
    selector: 'app-circulation',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="circulation-container">
            <!-- Header -->
            <div class="circulation-header">
                <h1>🔄 Circulation Desk</h1>
                <p class="subtitle">Issue and return library books</p>
            </div>

            <!-- Mode Selector -->
            <div class="mode-selector">
                <button 
                    [class.active]="mode() === 'issue'"
                    (click)="mode.set('issue')"
                    class="mode-btn issue-btn"
                >
                    <span class="mode-icon">📤</span>
                    <div>
                        <div class="mode-title">Issue Book</div>
                        <div class="mode-desc">Lend book to member</div>
                    </div>
                </button>
                <button 
                    [class.active]="mode() === 'return'"
                    (click)="mode.set('return')"
                    class="mode-btn return-btn"
                >
                    <span class="mode-icon">📥</span>
                    <div>
                        <div class="mode-title">Return Book</div>
                        <div class="mode-desc">Accept book from member</div>
                    </div>
                </button>
            </div>

            <!-- Scanner Section -->
            <div class="scanner-section">
                <div class="scanner-header">
                    <h2>
                        @if (mode() === 'issue') {
                            📚 Scan Book Barcode
                        } @else {
                            📖 Scan Book to Return
                        }
                    </h2>
                </div>

                <div class="scanner-input-group">
                    <div class="barcode-input-wrapper">
                        <span class="input-icon">🔍</span>
                        <input
                            type="text"
                            [(ngModel)]="barcodeInput"
                            (keyup.enter)="scanBarcode()"
                            placeholder="Enter or scan barcode..."
                            class="barcode-input"
                            [disabled]="scanning()"
                            autofocus
                        />
                        <button 
                            class="scan-btn"
                            (click)="scanBarcode()"
                            [disabled]="!barcodeInput || scanning()"
                        >
                            @if (scanning()) {
                                <span class="spinner-small"></span>
                            } @else {
                                Scan
                            }
                        </button>
                    </div>
                    <div class="scanner-help">
                        <span class="help-icon">💡</span>
                        <span>Tip: Use a barcode scanner or type the barcode manually</span>
                    </div>
                </div>

                <!-- Scan Result -->
                @if (scanResult()) {
                    <div class="scan-result" [class.success]="!scanResult()?.error" [class.error]="scanResult()?.error">
                        @if (scanResult()?.error) {
                            <div class="result-error">
                                <span class="error-icon">❌</span>
                                <div>
                                    <div class="error-title">Scan Failed</div>
                                    <div class="error-message">{{ scanResult()?.error }}</div>
                                </div>
                            </div>
                        } @else {
                            <div class="result-success">
                                <div class="result-header">
                                    <span class="success-icon">✅</span>
                                    <span class="success-title">Book Found</span>
                                </div>
                                
                                <div class="book-details">
                                    <div class="book-detail-row">
                                        <span class="detail-label">Title:</span>
                                        <span class="detail-value">{{ scanResult()?.book?.title }}</span>
                                    </div>
                                    <div class="book-detail-row">
                                        <span class="detail-label">Author:</span>
                                        <span class="detail-value">{{ scanResult()?.book?.author }}</span>
                                    </div>
                                    <div class="book-detail-row">
                                        <span class="detail-label">Barcode:</span>
                                        <span class="detail-value barcode-text">{{ scanResult()?.copy?.barcode }}</span>
                                    </div>
                                    <div class="book-detail-row">
                                        <span class="detail-label">Status:</span>
                                        <span class="detail-value" [class]="'status-' + (scanResult()?.copy?.status || '').toLowerCase()">
                                            {{ scanResult()?.copy?.status }}
                                        </span>
                                    </div>
                                    @if (scanResult()?.copy?.condition !== 'GOOD') {
                                        <div class="book-detail-row">
                                            <span class="detail-label">Condition:</span>
                                            <span class="detail-value condition-warning">
                                                {{ scanResult()?.copy?.condition }}
                                            </span>
                                        </div>
                                    }
                                </div>

                                @if (scanResult()?.action === 'RETURN' && scanResult()?.transaction) {
                                    <div class="transaction-info">
                                        <div class="info-header">📋 Loan Details</div>
                                        <div class="info-content">
                                            <div class="info-row">
                                                <span>Issue Date:</span>
                                                <span>{{ formatDate(scanResult()?.transaction?.issueDate) }}</span>
                                            </div>
                                            <div class="info-row">
                                                <span>Due Date:</span>
                                                <span>{{ formatDate(scanResult()?.transaction?.dueDate) }}</span>
                                            </div>
                                            @if (scanResult()?.transaction && scanResult()!.transaction!.fineAmount > 0) {
                                                <div class="info-row fine-row">
                                                    <span>Fine Amount:</span>
                                                    <span class="fine-amount">{{ '$' + scanResult()?.transaction?.fineAmount }}</span>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                }
                            </div>
                        }
                    </div>
                }
            </div>

            <!-- Member Selection (for Issue) -->
            @if (mode() === 'issue' && scanResult() && !scanResult()?.error) {
                <div class="member-section">
                    <h2>👤 Select Member</h2>
                    <div class="member-search">
                        <input
                            type="text"
                            [(ngModel)]="memberSearch"
                            placeholder="Search by name or membership number..."
                            class="member-search-input"
                        />
                    </div>
                    
                    <!-- Mock member selection -->
                    <div class="member-list">
                        <div class="member-card" (click)="selectMember('1')">
                            <div class="member-avatar">👨‍🎓</div>
                            <div class="member-info">
                                <div class="member-name">John Doe</div>
                                <div class="member-details">Student • ID: 2024001</div>
                                <div class="member-stats">
                                    <span class="stat">2 active loans</span>
                                    <span class="stat success">No fines</span>
                                </div>
                            </div>
                            <button class="select-btn">Select</button>
                        </div>
                    </div>
                </div>
            }

            <!-- Action Buttons -->
            @if (scanResult() && !scanResult()?.error) {
                <div class="action-section">
                    @if (mode() === 'issue') {
                        <button 
                            class="action-btn issue-action"
                            [disabled]="processing()"
                            (click)="processIssue()"
                        >
                            @if (processing()) {
                                <span class="spinner-small"></span>
                            } @else {
                                <span>📤 Issue Book</span>
                            }
                        </button>
                    } @else {
                        <button 
                            class="action-btn return-action"
                            [disabled]="processing()"
                            (click)="processReturn()"
                        >
                            @if (processing()) {
                                <span class="spinner-small"></span>
                            } @else {
                                <span>📥 Accept Return</span>
                            }
                        </button>
                    }
                    <button class="action-btn cancel-btn" (click)="reset()">
                        Cancel
                    </button>
                </div>
            }

            <!-- Recent Transactions -->
            <div class="recent-transactions">
                <h2>📊 Recent Transactions</h2>
                <div class="transactions-list">
                    @for (transaction of recentTransactions(); track transaction.id) {
                        <div class="transaction-item">
                            <div class="transaction-icon" [class]="transaction.type.toLowerCase()">
                                {{ transaction.type === 'ISSUE' ? '📤' : '📥' }}
                            </div>
                            <div class="transaction-details">
                                <div class="transaction-title">{{ transaction.bookTitle }}</div>
                                <div class="transaction-meta">
                                    <span>{{ transaction.memberName }}</span>
                                    <span class="separator">•</span>
                                    <span>{{ transaction.time }}</span>
                                </div>
                            </div>
                            <div class="transaction-status" [class]="transaction.type.toLowerCase()">
                                {{ transaction.type }}
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
    `,
    styles: [`
        .circulation-container {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .circulation-header {
            margin-bottom: 2rem;
        }

        h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 0.5rem 0;
        }

        h2 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0 0 1rem 0;
        }

        .subtitle {
            color: #666;
            margin: 0;
        }

        /* Mode Selector */
        .mode-selector {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .mode-btn {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem;
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: left;
        }

        .mode-btn:hover {
            border-color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .mode-btn.active {
            border-color: #667eea;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .mode-icon {
            font-size: 2rem;
        }

        .mode-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 0.25rem;
        }

        .mode-desc {
            font-size: 0.875rem;
            color: #666;
        }

        /* Scanner Section */
        .scanner-section {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            margin-bottom: 2rem;
        }

        .scanner-header {
            margin-bottom: 1.5rem;
        }

        .scanner-input-group {
            margin-bottom: 1.5rem;
        }

        .barcode-input-wrapper {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .input-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            font-size: 1.25rem;
        }

        .barcode-input-wrapper {
            position: relative;
        }

        .barcode-input {
            flex: 1;
            padding: 1rem 1rem 1rem 3rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            font-family: 'Courier New', monospace;
            font-weight: 600;
            transition: all 0.2s;
        }

        .barcode-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .barcode-input:disabled {
            background: #f9fafb;
            cursor: not-allowed;
        }

        .scan-btn {
            padding: 1rem 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            min-width: 100px;
        }

        .scan-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .scan-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .scanner-help {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: #666;
        }

        .help-icon {
            font-size: 1rem;
        }

        /* Scan Result */
        .scan-result {
            margin-top: 1.5rem;
            padding: 1.5rem;
            border-radius: 8px;
        }

        .scan-result.success {
            background: #d1fae5;
            border: 2px solid #10b981;
        }

        .scan-result.error {
            background: #fee2e2;
            border: 2px solid #ef4444;
        }

        .result-error {
            display: flex;
            gap: 1rem;
            align-items: flex-start;
        }

        .error-icon {
            font-size: 1.5rem;
        }

        .error-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #991b1b;
            margin-bottom: 0.25rem;
        }

        .error-message {
            color: #7f1d1d;
        }

        .result-success {
            color: #065f46;
        }

        .result-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }

        .success-icon {
            font-size: 1.5rem;
        }

        .success-title {
            font-size: 1.125rem;
            font-weight: 600;
        }

        .book-details {
            background: white;
            padding: 1.25rem;
            border-radius: 8px;
            margin-bottom: 1rem;
        }

        .book-detail-row {
            display: flex;
            justify-content: space-between;
            padding: 0.75rem 0;
            border-bottom: 1px solid #f3f4f6;
        }

        .book-detail-row:last-child {
            border-bottom: none;
        }

        .detail-label {
            font-weight: 600;
            color: #666;
        }

        .detail-value {
            color: #1a1a1a;
        }

        .barcode-text {
            font-family: 'Courier New', monospace;
            font-weight: 600;
        }

        .status-available {
            color: #10b981;
            font-weight: 600;
        }

        .status-issued {
            color: #f59e0b;
            font-weight: 600;
        }

        .condition-warning {
            color: #ef4444;
            font-weight: 600;
        }

        .transaction-info {
            background: white;
            padding: 1.25rem;
            border-radius: 8px;
        }

        .info-header {
            font-weight: 600;
            margin-bottom: 1rem;
            color: #1a1a1a;
        }

        .info-content {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.875rem;
        }

        .fine-row {
            padding-top: 0.75rem;
            border-top: 1px solid #f3f4f6;
            font-weight: 600;
        }

        .fine-amount {
            color: #ef4444;
            font-size: 1.125rem;
        }

        /* Member Section */
        .member-section {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            margin-bottom: 2rem;
        }

        .member-search-input {
            width: 100%;
            padding: 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            margin-bottom: 1rem;
        }

        .member-search-input:focus {
            outline: none;
            border-color: #667eea;
        }

        .member-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .member-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .member-card:hover {
            border-color: #667eea;
            background: #f9fafb;
        }

        .member-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            flex-shrink: 0;
        }

        .member-info {
            flex: 1;
        }

        .member-name {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 0.25rem;
        }

        .member-details {
            font-size: 0.875rem;
            color: #666;
            margin-bottom: 0.5rem;
        }

        .member-stats {
            display: flex;
            gap: 1rem;
            font-size: 0.8125rem;
        }

        .stat {
            color: #666;
        }

        .stat.success {
            color: #10b981;
            font-weight: 600;
        }

        .select-btn {
            padding: 0.5rem 1.5rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
        }

        /* Action Section */
        .action-section {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .action-btn {
            flex: 1;
            padding: 1rem 2rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .issue-action {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
        }

        .return-action {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
        }

        .cancel-btn {
            background: #f3f4f6;
            color: #666;
            flex: 0.3;
        }

        .action-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .action-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Recent Transactions */
        .recent-transactions {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .transactions-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .transaction-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: #f9fafb;
            border-radius: 8px;
        }

        .transaction-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            flex-shrink: 0;
        }

        .transaction-icon.issue {
            background: rgba(16, 185, 129, 0.2);
        }

        .transaction-icon.return {
            background: rgba(59, 130, 246, 0.2);
        }

        .transaction-details {
            flex: 1;
        }

        .transaction-title {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 0.25rem;
        }

        .transaction-meta {
            font-size: 0.875rem;
            color: #666;
        }

        .separator {
            margin: 0 0.5rem;
        }

        .transaction-status {
            padding: 0.375rem 0.75rem;
            border-radius: 12px;
            font-size: 0.8125rem;
            font-weight: 600;
        }

        .transaction-status.issue {
            background: #d1fae5;
            color: #065f46;
        }

        .transaction-status.return {
            background: #dbeafe;
            color: #1e40af;
        }

        /* Spinner */
        .spinner-small {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
            display: inline-block;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `]
})
export class CirculationComponent {
    private libraryService = inject(LibraryService);

    mode = signal<OperationMode>('issue');
    barcodeInput = '';
    memberSearch = '';
    scanning = signal(false);
    processing = signal(false);
    scanResult = signal<(ScanResult & { error?: string }) | null>(null);

    recentTransactions = signal([
        { id: 1, type: 'ISSUE', bookTitle: 'Clean Code', memberName: 'John Doe', time: '2 mins ago' },
        { id: 2, type: 'RETURN', bookTitle: 'The Pragmatic Programmer', memberName: 'Jane Smith', time: '15 mins ago' },
        { id: 3, type: 'ISSUE', bookTitle: 'Design Patterns', memberName: 'Mike Johnson', time: '1 hour ago' },
        { id: 4, type: 'RETURN', bookTitle: 'Refactoring', memberName: 'Sarah Williams', time: '2 hours ago' }
    ]);

    scanBarcode() {
        if (!this.barcodeInput) return;

        this.scanning.set(true);
        this.libraryService.scanBarcode(this.barcodeInput).subscribe({
            next: (result) => {
                this.scanResult.set(result);
                this.scanning.set(false);
            },
            error: (error) => {
                this.scanResult.set({
                    error: 'Barcode not found or invalid',
                    copy: null,
                    book: null,
                    action: 'ISSUE'
                });
                this.scanning.set(false);
            }
        });
    }

    selectMember(memberId: string) {
        console.log('Selected member:', memberId);
    }

    processIssue() {
        this.processing.set(true);
        setTimeout(() => {
            this.processing.set(false);
            this.reset();
            // Add to recent transactions
            alert('Book issued successfully!');
        }, 1500);
    }

    processReturn() {
        this.processing.set(true);
        setTimeout(() => {
            this.processing.set(false);
            this.reset();
            alert('Book returned successfully!');
        }, 1500);
    }

    reset() {
        this.barcodeInput = '';
        this.scanResult.set(null);
        this.memberSearch = '';
    }

    formatDate(date: any): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    }
}
