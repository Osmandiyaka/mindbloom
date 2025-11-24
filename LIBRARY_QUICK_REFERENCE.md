# Library Management System - Quick Reference Guide

## 🚀 Quick Start

### Setting Up the UI Components

1. **Add Toast and Dialog to Your App**

In your main app component or library layout component:

```typescript
import { Component } from '@angular/core';
import { ToastContainerComponent } from './library/components/toast-container.component';
import { ConfirmDialogComponent } from './library/components/confirm-dialog.component';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-library-layout',
    standalone: true,
    imports: [RouterOutlet, ToastContainerComponent, ConfirmDialogComponent],
    template: `
        <router-outlet />
        <app-toast-container />
        <app-confirm-dialog />
    `
})
export class LibraryLayoutComponent {}
```

---

## 📚 Component Usage

### Dashboard
**Route:** `/plugins/library`

Shows real-time statistics and quick actions.

**Features:**
- Total titles, available copies, checked out books
- Overdue count with alerts
- Quick action cards
- Recent activity feed

### Catalog
**Route:** `/plugins/library/catalog`

Browse and search all library books.

**Features:**
- Search by title, author, ISBN
- Filter by category
- Grid/List view toggle
- Pagination (10 per page)
- Click book to view details

**Usage:**
```typescript
// Search
<input [(ngModel)]="searchQuery" (input)="onSearch()" />

// Filter
<select [(ngModel)]="selectedCategory" (change)="onFilterChange()">

// Pagination
<button (click)="nextPage()">Next</button>
<button (click)="previousPage()">Previous</button>
```

### Circulation Desk
**Route:** `/plugins/library/circulation`

Checkout and checkin books.

**Features:**
- Checkout mode: Scan book + enter borrower ID
- Checkin mode: Scan book (auto-processes)
- Recent transactions
- Overdue alerts
- Renew functionality

**Workflow:**
1. Select mode (Checkout/Checkin)
2. Scan or enter barcode
3. For checkout: Enter borrower ID
4. Click process or auto-processes
5. Toast notification confirms action

### Add Book
**Route:** `/plugins/library/books/add`

Add new books to catalog.

**Features:**
- ISBN lookup (placeholder)
- Complete book form
- Multiple copies creation
- Dynamic category selection
- Form validation

**Required Fields:**
- Title
- Author
- Number of copies

### Book Detail
**Route:** `/plugins/library/books/:id`

View and manage individual books.

**Features:**
- Full book information
- Copy count display
- Edit button (placeholder)
- Delete with confirmation
- Add copies functionality

**Actions:**
```typescript
editBook()      // Future: Edit form
deleteBook()    // Shows confirmation dialog
addCopies()     // Prompts for quantity
```

### Library Settings
**Route:** `/plugins/library/settings`

Configure library policies.

**Features:**
- Loan duration
- Maximum books per patron
- Fine rates
- Notification settings

**Settings Object:**
```typescript
{
    loanDuration: number,
    maxBooksPerPatron: number,
    renewalLimit: number,
    finePerDay: number,
    maxFineBeforeBlock: number,
    enableOverdueNotifications: boolean
}
```

---

## 🔧 Service APIs

### LibraryApiService

#### Titles
```typescript
getTitles({ search?, categories?, page?, limit? })
getTitle(id)
createTitle(data)
updateTitle(id, data)
deleteTitle(id)
getPopularTitles(limit)
getRecentTitles(limit)
getAllCategories()
```

#### Copies
```typescript
getCopies({ bookTitleId?, status?, page?, limit? })
getCopyByBarcode(barcode)
createCopy(data)
bulkCreateCopies({ bookTitleId, quantity })
```

#### Circulation
```typescript
checkout({ copyId, borrowerId })
checkin({ copyId, returnCondition? })
renew(transactionId)
getTransactions({ borrowerId?, status?, isOverdue?, page? })
getPatronActiveTransactions(patronId)
getOverdueTransactions()
```

#### Reservations
```typescript
getReservations({ patronId?, status?, page? })
createReservation({ bookTitleId, patronId })
cancelReservation(id, reason)
getReservationQueue(titleId)
```

#### Fines
```typescript
getPatronBalance(patronId)
getPatronLedger(patronId)
recordPayment({ patronId, amount, paymentMethod })
```

#### Settings
```typescript
getSettings()
updateSettings(data)
```

#### Dashboard
```typescript
getDashboardStats()
```

---

## 💬 Toast Notifications

### Usage

```typescript
import { ToastService } from '../services/toast.service';

constructor(private toast: ToastService) {}

// Success (green)
this.toast.success('Book added successfully!');

// Error (red)
this.toast.error('Failed to checkout book');

// Warning (orange)
this.toast.warning('Please fill all required fields');

// Info (blue)
this.toast.info('ISBN lookup coming soon');

// Custom duration (default: 4000ms)
this.toast.success('Quick message', 2000);

// No auto-dismiss
this.toast.error('Critical error', 0);

// Manual dismiss
this.toast.remove(toastId);

// Clear all
this.toast.clear();
```

### Toast Types
- **success** ✅ - Green border, check icon
- **error** ❌ - Red border, X icon
- **warning** ⚠️ - Orange border, warning icon
- **info** ℹ️ - Blue border, info icon

---

## 🗨️ Confirmation Dialogs

### Usage

```typescript
import { DialogService } from '../services/dialog.service';

constructor(private dialog: DialogService) {}

// Basic confirmation
this.dialog.confirm({
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Yes',
    cancelText: 'No',
    type: 'info',
    onConfirm: () => {
        // Execute action
    },
    onCancel: () => {
        // Optional cancel handler
    }
});

// Delete confirmation (pre-configured)
this.dialog.confirmDelete(
    'Are you sure you want to delete "Clean Code"?',
    () => {
        this.apiService.deleteTitle(id).subscribe();
    }
);

// Danger confirmation
this.dialog.confirm({
    title: 'Delete Book',
    message: 'This will permanently delete all copies.',
    type: 'danger',
    confirmText: 'Delete',
    onConfirm: () => {
        // Delete logic
    }
});
```

### Dialog Types
- **info** - Blue theme (default)
- **warning** - Orange theme
- **danger** - Red theme

---

## 🎨 UI Patterns

### Loading States

```typescript
loading = signal(false);

loadData() {
    this.loading.set(true);
    
    this.apiService.getData().subscribe({
        next: (data) => {
            this.data.set(data);
            this.loading.set(false);
        },
        error: (err) => {
            this.toast.error('Failed to load data');
            this.loading.set(false);
        }
    });
}
```

Template:
```html
@if (loading()) {
    <div class="loading">
        <div class="spinner"></div>
        <p>Loading...</p>
    </div>
} @else {
    <!-- Content -->
}
```

### Empty States

```html
@if (!loading() && items().length === 0) {
    <div class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>No items found</h3>
        <p>Try adjusting your search or filters</p>
        <button (click)="reset()">Reset</button>
    </div>
}
```

### Error States

```typescript
error = signal<string | null>(null);

// Set error
this.error.set('Failed to load data');

// Template
@if (error()) {
    <div class="error-banner">
        <span class="error-icon">⚠️</span>
        <span>{{ error() }}</span>
        <button (click)="retry()">Retry</button>
    </div>
}
```

---

## 🔄 Common Workflows

### Adding a New Book

1. Navigate to `/plugins/library/books/add`
2. Fill in title, author(s), ISBN
3. Select category
4. Set number of copies
5. Click "Save Book"
6. Toast confirms success
7. Redirects to catalog

### Checking Out a Book

1. Navigate to `/plugins/library/circulation`
2. Ensure "Checkout" mode selected
3. Scan or enter book barcode
4. Enter borrower ID
5. Click "Process Checkout"
6. Toast shows due date
7. Recent transactions updates

### Returning a Book

1. Navigate to `/plugins/library/circulation`
2. Select "Checkin" mode
3. Scan or enter book barcode
4. Auto-processes return
5. Toast confirms success
6. Updates overdue list if applicable

### Deleting a Book

1. Navigate to book detail page
2. Click "Delete" button
3. Confirmation dialog appears
4. Click "Delete" in dialog
5. Toast confirms deletion
6. Redirects to catalog

---

## 🐛 Error Handling

### Pattern

```typescript
this.apiService.operation().subscribe({
    next: (data) => {
        // Success handling
        this.toast.success('Operation successful');
        this.data.set(data);
    },
    error: (err) => {
        // Error handling
        const message = err.error?.message || 'Operation failed';
        this.toast.error(message);
        console.error('Error:', err);
    }
});
```

### Common Errors

- **404 Not Found** - "Item not found"
- **400 Bad Request** - "Invalid input data"
- **401 Unauthorized** - "Please login"
- **403 Forbidden** - "Insufficient permissions"
- **500 Server Error** - "Server error, please try again"

---

## 📱 Responsive Design

All components are mobile-responsive:

- **Desktop:** Full grid layouts
- **Tablet:** 2-column grids
- **Mobile:** Single column, stacked

### Breakpoints

```scss
// Mobile first
.grid {
    grid-template-columns: 1fr;
}

// Tablet (768px+)
@media (min-width: 768px) {
    .grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

// Desktop (1024px+)
@media (min-width: 1024px) {
    .grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
```

---

## ⌨️ Keyboard Shortcuts

### Barcode Input
- **Enter** - Trigger scan
- **Esc** - Clear input

### Search
- **Enter** - Execute search
- **Esc** - Clear search

### Dialogs
- **Enter** - Confirm
- **Esc** - Cancel

---

## 🔐 Permissions

Components check permissions via guards:

```typescript
@RequiresPermissions(['library.manage'])
export class AddBookComponent {}
```

Common permissions:
- `library.view` - View catalog
- `library.manage` - Add/edit/delete books
- `library.circulate` - Checkout/checkin
- `library.configure` - Manage settings

---

## 🧪 Testing

### Component Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CatalogComponent } from './catalog.component';
import { LibraryApiService } from '../services/library-api.service';
import { of } from 'rxjs';

describe('CatalogComponent', () => {
    let component: CatalogComponent;
    let fixture: ComponentFixture<CatalogComponent>;
    let apiService: jasmine.SpyObj<LibraryApiService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('LibraryApiService', ['getTitles']);
        
        TestBed.configureTestingModule({
            imports: [CatalogComponent],
            providers: [
                { provide: LibraryApiService, useValue: spy }
            ]
        });

        fixture = TestBed.createComponent(CatalogComponent);
        component = fixture.componentInstance;
        apiService = TestBed.inject(LibraryApiService) as jasmine.SpyObj<LibraryApiService>;
    });

    it('should load books on init', () => {
        const mockResponse = {
            items: [],
            total: 0,
            page: 1,
            limit: 10
        };
        
        apiService.getTitles.and.returnValue(of(mockResponse));
        
        component.ngOnInit();
        
        expect(apiService.getTitles).toHaveBeenCalled();
    });
});
```

---

## 📊 Performance Tips

1. **Pagination** - Already implemented for large lists
2. **Lazy Loading** - Use for images: `loading="lazy"`
3. **Debounce** - Add to search inputs
4. **Virtual Scroll** - For very large lists (future)
5. **Caching** - Implement HTTP interceptor cache

### Example Debounce

```typescript
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

searchSubject = new Subject<string>();

ngOnInit() {
    this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
    ).subscribe(query => {
        this.performSearch(query);
    });
}

onSearchInput(query: string) {
    this.searchSubject.next(query);
}
```

---

## 🎯 Best Practices

1. **Always use signals** for reactive state
2. **Use computed** for derived values
3. **Inject services** with `inject()` function
4. **Handle errors** with toast notifications
5. **Confirm deletes** with dialog service
6. **Show loading** states for async operations
7. **Validate forms** before submission
8. **Use type-safe** API calls
9. **Clean up** subscriptions (though observables auto-complete)
10. **Test components** with proper mocks

---

## 📞 Support

For issues or questions:
- Check console for errors
- Verify API endpoint configuration
- Ensure backend is running
- Check browser network tab
- Review error messages in toasts

**Common Issues:**
- **401 Errors:** Check authentication token
- **CORS Errors:** Verify backend CORS configuration
- **404 Errors:** Check route configuration
- **Timeout Errors:** Increase HTTP timeout or check backend performance

---

**Last Updated:** 2025-11-24  
**Version:** 1.0.0  
**Status:** Production Ready
