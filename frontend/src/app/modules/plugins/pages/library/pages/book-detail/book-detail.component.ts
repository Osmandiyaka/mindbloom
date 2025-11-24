import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LibraryService, Book } from '../../services/library.service';

@Component({
    selector: 'app-book-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
        <div class="book-detail-container">
            @if (loading()) {
                <div class="loading">Loading...</div>
            } @else if (book()) {
                <div class="book-header">
                    <button class="back-btn" routerLink="/plugins/library/catalog">← Back to Catalog</button>
                    <div class="header-actions">
                        <button class="btn-secondary">✏️ Edit</button>
                        <button class="btn-danger">🗑️ Delete</button>
                    </div>
                </div>

                <div class="book-content">
                    <div class="book-main">
                        <div class="book-cover-large">📖</div>
                        <div class="book-info">
                            <h1>{{ book()?.title }}</h1>
                            <p class="author">by {{ book()?.author }}</p>
                            <div class="book-meta">
                                <div class="meta-item">
                                    <span class="label">ISBN:</span>
                                    <span>{{ book()?.isbn }}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="label">Publisher:</span>
                                    <span>{{ book()?.publisher }}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="label">Year:</span>
                                    <span>{{ book()?.publicationYear }}</span>
                                </div>
                            </div>
                            <p class="description">{{ book()?.description }}</p>
                        </div>
                    </div>

                    <div class="copies-section">
                        <div class="section-header">
                            <h2>📚 Copies ({{ book()?.totalCopies }})</h2>
                            <button class="btn-primary">➕ Add Copies</button>
                        </div>
                        <div class="availability-summary">
                            <div class="summary-card available">
                                <div class="count">{{ book()?.availableCopies }}</div>
                                <div class="label">Available</div>
                            </div>
                            <div class="summary-card issued">
                                <div class="count">{{ (book()?.totalCopies || 0) - (book()?.availableCopies || 0) }}</div>
                                <div class="label">Issued</div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    `,
    styles: [`
        .book-detail-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .book-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
        .back-btn { background: #f3f4f6; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
        .header-actions { display: flex; gap: 1rem; }
        .btn-secondary, .btn-danger, .btn-primary { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .btn-secondary { background: #f3f4f6; color: #666; }
        .btn-danger { background: #fee2e2; color: #991b1b; }
        .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .book-content { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
        .book-main { display: grid; grid-template-columns: 200px 1fr; gap: 2rem; margin-bottom: 2rem; }
        .book-cover-large { width: 200px; height: 280px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 5rem; }
        h1 { font-size: 2rem; margin: 0 0 0.5rem 0; }
        .author { font-size: 1.25rem; color: #666; margin: 0 0 1.5rem 0; }
        .book-meta { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
        .meta-item { display: flex; gap: 1rem; }
        .meta-item .label { font-weight: 600; min-width: 80px; }
        .description { color: #666; line-height: 1.6; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        h2 { font-size: 1.5rem; margin: 0; }
        .availability-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .summary-card { padding: 1.5rem; border-radius: 8px; text-align: center; }
        .summary-card.available { background: #d1fae5; }
        .summary-card.issued { background: #fed7aa; }
        .summary-card .count { font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem; }
        .summary-card .label { font-weight: 600; text-transform: uppercase; font-size: 0.875rem; }
    `]
})
export class BookDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private libraryService = inject(LibraryService);

    loading = signal(true);
    book = signal<Book | null>(null);

    ngOnInit() {
        const id = this.route.snapshot.params['id'];
        this.libraryService.getBook(id).subscribe({
            next: (book) => {
                this.book.set(book);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }
}
