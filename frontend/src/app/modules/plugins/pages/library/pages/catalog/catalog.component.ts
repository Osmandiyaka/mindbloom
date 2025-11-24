import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LibraryApiService } from '../../services/library-api.service';
import { BookTitle } from '../../models/library.models';

@Component({
    selector: 'app-catalog',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="catalog-container">
            <!-- Header -->
            <div class="catalog-header">
                <div>
                    <h1>📖 Book Catalog</h1>
                    <p class="subtitle">Browse and manage your library collection</p>
                </div>
                <button class="btn-primary" routerLink="/plugins/library/books/add">
                    <span class="icon">➕</span>
                    Add New Book
                </button>
            </div>

            <!-- Search and Filters -->
            <div class="search-section">
                <div class="search-bar">
                    <span class="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by title, author, ISBN..."
                        [(ngModel)]="searchQuery"
                        (input)="onSearch()"
                        class="search-input"
                    />
                    @if (searchQuery) {
                        <button class="clear-btn" (click)="clearSearch()">✕</button>
                    }
                </div>

                <div class="filter-controls">
                    <select class="filter-select" [(ngModel)]="selectedCategory" (change)="onFilterChange()">
                        <option value="">All Categories</option>
                        @for (category of categories(); track category) {
                            <option [value]="category">{{ category }}</option>
                        }
                    </select>

                    <select class="filter-select" [(ngModel)]="availability" (change)="onFilterChange()">
                        <option value="">All Books</option>
                        <option value="available">Available</option>
                        <option value="issued">Issued</option>
                    </select>

                    <div class="view-toggle">
                        <button
                            [class.active]="viewMode() === 'grid'"
                            (click)="viewMode.set('grid')"
                            title="Grid View"
                        >
                            ⊞
                        </button>
                        <button
                            [class.active]="viewMode() === 'list'"
                            (click)="viewMode.set('list')"
                            title="List View"
                        >
                            ☰
                        </button>
                    </div>
                </div>
            </div>

            <!-- Results Summary -->
            <div class="results-summary" *ngIf="!loading()">
                <span class="result-count">
                    {{ totalBooks() }} books found
                </span>
                <span class="result-info">
                    {{ availableCount() }} available
                </span>
            </div>

            <!-- Loading State -->
            @if (loading()) {
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading catalog...</p>
                </div>
            }

            <!-- Empty State -->
            @if (!loading() && books().length === 0) {
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <h3>No books found</h3>
                    <p>{{ searchQuery ? 'Try different search terms' : 'Add your first book to get started' }}</p>
                    <button class="btn-primary" routerLink="/plugins/library/books/add">
                        Add Book
                    </button>
                </div>
            }

            <!-- Grid View -->
            @if (!loading() && books().length > 0 && viewMode() === 'grid') {
                <div class="books-grid">
                    @for (book of books(); track book._id) {
                        <div class="book-card" [routerLink]="['/plugins/library/books', book._id]">
                            <div class="book-cover">
                                @if (book.coverImageUrl) {
                                    <img [src]="book.coverImageUrl" [alt]="book.title" />
                                } @else {
                                    <div class="book-cover-placeholder">
                                        <span class="book-icon">📖</span>
                                    </div>
                                }
                                @if (book.availableCopies > 0) {
                                    <span class="availability-badge available">Available</span>
                                } @else {
                                    <span class="availability-badge unavailable">All Issued</span>
                                }
                            </div>
                            <div class="book-content">
                                <h3 class="book-title">{{ book.title }}</h3>
                                <p class="book-author">by {{ book.authors.join(', ') }}</p>
                                <div class="book-meta">
                                    <span class="meta-item">
                                        <span class="meta-icon">📚</span>
                                        {{ book.availableCopies }}/{{ book.totalCopies }} available
                                    </span>
                                    @if (book.isbn) {
                                        <span class="meta-item">
                                            <span class="meta-icon">🔢</span>
                                            {{ book.isbn }}
                                        </span>
                                    }
                                </div>
                            </div>
                        </div>
                    }
                </div>
            }

            <!-- List View -->
            @if (!loading() && books().length > 0 && viewMode() === 'list') {
                <div class="books-list">
                    <div class="list-header">
                        <div class="col-title">Book Details</div>
                        <div class="col-copies">Copies</div>
                        <div class="col-status">Status</div>
                        <div class="col-actions">Actions</div>
                    </div>
                    @for (book of books(); track book._id) {
                        <div class="list-row" [routerLink]="['/plugins/library/books', book._id]">
                            <div class="col-title">
                                <div class="book-info">
                                    @if (book.coverImageUrl) {
                                        <img [src]="book.coverImageUrl" [alt]="book.title" class="list-thumbnail" />
                                    } @else {
                                        <div class="list-thumbnail-placeholder">📖</div>
                                    }
                                    <div>
                                        <div class="list-book-title">{{ book.title }}</div>
                                        <div class="list-book-author">{{ book.authors.join(', ') }}</div>
                                        @if (book.isbn) {
                                            <div class="list-book-isbn">ISBN: {{ book.isbn }}</div>
                                        }
                                    </div>
                                </div>
                            </div>
                            <div class="col-copies">
                                <div class="copies-indicator">
                                    <div class="copies-bar">
                                        <div class="copies-filled"
                                             [style.width.%]="(book.availableCopies / book.totalCopies) * 100">
                                        </div>
                                    </div>
                                    <span>{{ book.availableCopies }}/{{ book.totalCopies }}</span>
                                </div>
                            </div>
                            <div class="col-status">
                                @if (book.availableCopies > 0) {
                                    <span class="status-badge available">Available</span>
                                } @else if (book.availableCopies === 0 && book.totalCopies > 0) {
                                    <span class="status-badge issued">All Issued</span>
                                } @else {
                                    <span class="status-badge unavailable">No Copies</span>
                                }
                            </div>
                            <div class="col-actions">
                                <button class="action-btn" (click)="$event.stopPropagation()">
                                    View Details →
                                </button>
                            </div>
                        </div>
                    }
                </div>
            }

            <!-- Pagination -->
            @if (!loading() && books().length > 0) {
                <div class="pagination">
                    <button 
                        class="pagination-btn" 
                        [disabled]="currentPage() === 1"
                        (click)="previousPage()">
                        ← Previous
                    </button>
                    
                    <div class="pagination-info">
                        Page {{ currentPage() }} of {{ totalPages() }}
                    </div>

                    <button 
                        class="pagination-btn" 
                        [disabled]="currentPage() === totalPages()"
                        (click)="nextPage()">
                        Next →
                    </button>
                </div>
            }
        </div>
    `,
    styles: [`
        .catalog-container {
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        .catalog-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2rem;
        }

        h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 0.5rem 0;
        }

        .subtitle {
            color: #666;
            margin: 0;
        }

        .btn-primary {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }

        /* Search Section */
        .search-section {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            margin-bottom: 2rem;
        }

        .search-bar {
            position: relative;
            margin-bottom: 1rem;
        }

        .search-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            font-size: 1.25rem;
        }

        .search-input {
            width: 100%;
            padding: 1rem 3rem 1rem 3.5rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.2s;
        }

        .search-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .clear-btn {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            background: #f3f4f6;
            border: none;
            border-radius: 4px;
            width: 24px;
            height: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .clear-btn:hover {
            background: #e5e7eb;
        }

        .filter-controls {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .filter-select {
            padding: 0.625rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.875rem;
            cursor: pointer;
            background: white;
        }

        .filter-select:focus {
            outline: none;
            border-color: #667eea;
        }

        .view-toggle {
            display: flex;
            gap: 0.5rem;
            margin-left: auto;
        }

        .view-toggle button {
            width: 36px;
            height: 36px;
            border: 2px solid #e5e7eb;
            background: white;
            border-radius: 6px;
            font-size: 1.25rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .view-toggle button:hover {
            border-color: #667eea;
        }

        .view-toggle button.active {
            background: #667eea;
            border-color: #667eea;
            color: white;
        }

        /* Results Summary */
        .results-summary {
            display: flex;
            gap: 1rem;
            align-items: center;
            margin-bottom: 1.5rem;
            font-size: 0.9375rem;
        }

        .result-count {
            font-weight: 600;
            color: #1a1a1a;
        }

        .result-info {
            color: #666;
        }

        /* Loading State */
        .loading-state {
            text-align: center;
            padding: 4rem 2rem;
        }

        .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #f3f4f6;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
        }

        .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }

        .empty-state h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0 0 0.5rem 0;
        }

        .empty-state p {
            color: #666;
            margin: 0 0 2rem 0;
        }

        /* Grid View */
        .books-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
        }

        .book-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            cursor: pointer;
            transition: all 0.3s;
        }

        .book-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }

        .book-cover {
            position: relative;
            height: 280px;
            background: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .book-cover img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .book-cover-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .book-icon {
            font-size: 4rem;
        }

        .availability-badge {
            position: absolute;
            top: 1rem;
            right: 1rem;
            padding: 0.375rem 0.75rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            backdrop-filter: blur(8px);
        }

        .availability-badge.available {
            background: rgba(16, 185, 129, 0.9);
            color: white;
        }

        .availability-badge.unavailable {
            background: rgba(239, 68, 68, 0.9);
            color: white;
        }

        .book-content {
            padding: 1.25rem;
        }

        .book-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0 0 0.5rem 0;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .book-author {
            font-size: 0.875rem;
            color: #666;
            margin: 0 0 1rem 0;
        }

        .book-meta {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8125rem;
            color: #666;
        }

        .meta-icon {
            font-size: 1rem;
        }

        .book-rating {
            margin-top: 0.75rem;
            padding-top: 0.75rem;
            border-top: 1px solid #f3f4f6;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .stars {
            color: #fbbf24;
            font-size: 1rem;
        }

        .rating-text {
            font-size: 0.8125rem;
            color: #666;
        }

        /* List View */
        .books-list {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .list-header {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 1rem;
            padding: 1rem 1.5rem;
            background: #f9fafb;
            border-bottom: 2px solid #e5e7eb;
            font-weight: 600;
            font-size: 0.875rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .list-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 1rem;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid #f3f4f6;
            cursor: pointer;
            transition: background 0.2s;
            align-items: center;
        }

        .list-row:last-child {
            border-bottom: none;
        }

        .list-row:hover {
            background: #f9fafb;
        }

        .book-info {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .list-thumbnail, .list-thumbnail-placeholder {
            width: 48px;
            height: 64px;
            border-radius: 4px;
            flex-shrink: 0;
        }

        .list-thumbnail {
            object-fit: cover;
        }

        .list-thumbnail-placeholder {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }

        .list-book-title {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 0.25rem;
        }

        .list-book-author {
            font-size: 0.875rem;
            color: #666;
        }

        .list-book-isbn {
            font-size: 0.75rem;
            color: #9ca3af;
            margin-top: 0.25rem;
        }

        .copies-indicator {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .copies-bar {
            height: 6px;
            background: #f3f4f6;
            border-radius: 3px;
            overflow: hidden;
        }

        .copies-filled {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #34d399);
            border-radius: 3px;
            transition: width 0.3s;
        }

        .copies-indicator span {
            font-size: 0.875rem;
            font-weight: 600;
            color: #666;
        }

        .status-badge {
            padding: 0.375rem 0.75rem;
            border-radius: 12px;
            font-size: 0.8125rem;
            font-weight: 600;
            display: inline-block;
        }

        .status-badge.available {
            background: #d1fae5;
            color: #065f46;
        }

        .status-badge.issued {
            background: #fed7aa;
            color: #92400e;
        }

        .status-badge.unavailable {
            background: #fee2e2;
            color: #991b1b;
        }

        .action-btn {
            background: none;
            border: none;
            color: #667eea;
            font-weight: 600;
            cursor: pointer;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .action-btn:hover {
            background: #f7f8fc;
        }

        /* Pagination */
        .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2rem;
            margin-top: 3rem;
            padding: 2rem 0;
        }

        .pagination-btn {
            padding: 0.75rem 1.5rem;
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
            border-color: #667eea;
            color: #667eea;
            transform: translateY(-2px);
        }

        .pagination-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .pagination-info {
            font-weight: 600;
            color: #666;
        }
    `]
})
export class CatalogComponent implements OnInit {
    private apiService = inject(LibraryApiService);

    loading = signal(true);
    error = signal<string | null>(null);
    books = signal<BookTitle[]>([]);
    categories = signal<string[]>([]);
    viewMode = signal<'grid' | 'list'>('grid');

    // Pagination
    currentPage = signal(1);
    pageSize = 10;
    totalBooks = signal(0);

    searchQuery = '';
    selectedCategory = '';
    availability = '';

    availableCount = computed(() =>
        this.books().filter(b => b.availableCopies > 0).length
    );

    totalPages = computed(() =>
        Math.ceil(this.totalBooks() / this.pageSize)
    );

    ngOnInit() {
        this.loadCategories();
        this.loadBooks();
    }

    private loadCategories() {
        this.apiService.getAllCategories().subscribe({
            next: (categories) => {
                this.categories.set(categories);
            },
            error: (err) => {
                console.error('Failed to load categories:', err);
            }
        });
    }

    private loadBooks() {
        this.loading.set(true);
        this.error.set(null);

        const params: any = {
            page: this.currentPage(),
            limit: this.pageSize
        };

        if (this.searchQuery) {
            params.search = this.searchQuery;
        }

        if (this.selectedCategory) {
            params.categories = [this.selectedCategory];
        }

        this.apiService.getTitles(params).subscribe({
            next: (response) => {
                this.books.set(response.data);
                this.totalBooks.set(response.total);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load books:', err);
                this.error.set('Failed to load books. Please try again.');
                this.loading.set(false);
            }
        });
    }

    onSearch() {
        this.currentPage.set(1);
        this.loadBooks();
    }

    onFilterChange() {
        this.currentPage.set(1);
        this.loadBooks();
    }

    clearSearch() {
        this.searchQuery = '';
        this.currentPage.set(1);
        this.loadBooks();
    }

    nextPage() {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(p => p + 1);
            this.loadBooks();
        }
    }

    previousPage() {
        if (this.currentPage() > 1) {
            this.currentPage.update(p => p - 1);
            this.loadBooks();
        }
    }

    goToPage(page: number) {
        this.currentPage.set(page);
        this.loadBooks();
    }

    getStars(rating: number): string {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5 ? 1 : 0;
        return '★'.repeat(fullStars) + (halfStar ? '½' : '');
    }
}
