import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LibraryService } from '../../services/library.service';

@Component({
    selector: 'app-add-book',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="add-book-container">
            <div class="add-book-header">
                <h1>➕ Add New Book</h1>
                <p class="subtitle">Add a new title to your library catalog</p>
            </div>

            <div class="form-container">
                <!-- ISBN Lookup -->
                <div class="isbn-lookup-section">
                    <label class="form-label">📖 Quick Add with ISBN</label>
                    <div class="isbn-input-group">
                        <input
                            type="text"
                            [(ngModel)]="isbnLookup"
                            placeholder="Enter ISBN to auto-fill details..."
                            class="isbn-input"
                        />
                        <button class="lookup-btn" (click)="lookupISBN()">
                            Lookup
                        </button>
                    </div>
                </div>

                <div class="divider">
                    <span>OR ENTER MANUALLY</span>
                </div>

                <!-- Book Form -->
                <form class="book-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Title *</label>
                            <input type="text" [(ngModel)]="bookData.title" name="title" class="form-input" required />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Author *</label>
                            <input type="text" [(ngModel)]="bookData.author" name="author" class="form-input" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label">ISBN</label>
                            <input type="text" [(ngModel)]="bookData.isbn" name="isbn" class="form-input" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Publisher</label>
                            <input type="text" [(ngModel)]="bookData.publisher" name="publisher" class="form-input" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Publication Year</label>
                            <input type="number" [(ngModel)]="bookData.publicationYear" name="year" class="form-input" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <select [(ngModel)]="bookData.categoryId" name="category" class="form-select">
                                <option value="">Select category</option>
                                <option value="fiction">Fiction</option>
                                <option value="non-fiction">Non-Fiction</option>
                                <option value="science">Science</option>
                                <option value="technology">Technology</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Number of Copies *</label>
                            <input type="number" [(ngModel)]="numberOfCopies" name="copies" class="form-input" min="1" required />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea [(ngModel)]="bookData.description" name="description" class="form-textarea" rows="4"></textarea>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn-secondary" (click)="cancel()">Cancel</button>
                        <button type="button" class="btn-primary" (click)="saveBook()" [disabled]="saving()">
                            @if (saving()) {
                                <span class="spinner"></span>
                            } @else {
                                <span>💾 Save Book</span>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `,
    styles: [`
        .add-book-container {
            padding: 2rem;
            max-width: 900px;
            margin: 0 auto;
        }

        .add-book-header {
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

        .form-container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .isbn-lookup-section {
            margin-bottom: 2rem;
        }

        .isbn-input-group {
            display: flex;
            gap: 1rem;
        }

        .isbn-input {
            flex: 1;
            padding: 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
        }

        .lookup-btn {
            padding: 1rem 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
        }

        .divider {
            text-align: center;
            margin: 2rem 0;
            position: relative;
        }

        .divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: #e5e7eb;
        }

        .divider span {
            position: relative;
            background: white;
            padding: 0 1rem;
            color: #666;
            font-size: 0.875rem;
            font-weight: 600;
        }

        .book-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-label {
            font-weight: 600;
            color: #1a1a1a;
            font-size: 0.875rem;
        }

        .form-input, .form-select, .form-textarea {
            padding: 0.75rem 1rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
            outline: none;
            border-color: #667eea;
        }

        .form-textarea {
            resize: vertical;
        }

        .form-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            margin-top: 1rem;
        }

        .btn-primary, .btn-secondary {
            padding: 0.875rem 2rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-secondary {
            background: #f3f4f6;
            color: #666;
        }

        .spinner {
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
export class AddBookComponent {
    private libraryService = inject(LibraryService);
    private router = inject(Router);

    isbnLookup = '';
    saving = signal(false);
    numberOfCopies = 1;

    bookData: any = {
        title: '',
        author: '',
        isbn: '',
        publisher: '',
        publicationYear: new Date().getFullYear(),
        categoryId: '',
        description: ''
    };

    lookupISBN() {
        // Mock ISBN lookup
        if (this.isbnLookup) {
            this.bookData.isbn = this.isbnLookup;
            alert('ISBN lookup feature coming soon!');
        }
    }

    saveBook() {
        this.saving.set(true);
        this.libraryService.createBook(this.bookData).subscribe({
            next: (book) => {
                if (this.numberOfCopies > 0) {
                    this.libraryService.addCopies(book._id, this.numberOfCopies).subscribe({
                        next: () => {
                            this.saving.set(false);
                            this.router.navigate(['/plugins/library/catalog']);
                        }
                    });
                } else {
                    this.saving.set(false);
                    this.router.navigate(['/plugins/library/catalog']);
                }
            },
            error: () => {
                this.saving.set(false);
                alert('Error saving book');
            }
        });
    }

    cancel() {
        this.router.navigate(['/plugins/library/catalog']);
    }
}
