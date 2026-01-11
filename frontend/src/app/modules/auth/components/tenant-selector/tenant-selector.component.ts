import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MbFormFieldComponent, MbInputComponent } from '@mindbloom/ui';
import { Tenant, TenantLookup, TenantService } from '../../../../core/services/tenant.service';

@Component({
    selector: 'app-tenant-selector',
    standalone: true,
    imports: [CommonModule, MbFormFieldComponent, MbInputComponent],
    templateUrl: './tenant-selector.component.html',
    styleUrls: ['./tenant-selector.component.scss']
})
export class TenantSelectorComponent {
    @Output() tenantSelected = new EventEmitter<Tenant>();

    query = signal('');
    results = signal<TenantLookup[]>([]);
    isLoading = signal(false);
    isResolving = signal(false);
    hasSearched = signal(false);
    errorMessage = signal('');
    activeIndex = signal(-1);

    private readonly search$ = new Subject<string>();

    constructor(private tenantService: TenantService) {
        this.search$
            .pipe(
                map((value) => value.trim()),
                debounceTime(250),
                distinctUntilChanged(),
                tap((value) => {
                    if (value.length < 2) {
                        this.results.set([]);
                        this.hasSearched.set(false);
                        this.errorMessage.set('');
                        this.activeIndex.set(-1);
                    }
                }),
                switchMap((value) => {
                    if (value.length < 2) {
                        return of([]);
                    }

                    this.isLoading.set(true);
                    this.errorMessage.set('');

                    return this.tenantService.searchTenants(value).pipe(
                        catchError(() => {
                            this.errorMessage.set('We couldn’t load organizations. Try again.');
                            return of([]);
                        }),
                        tap(() => this.isLoading.set(false))
                    );
                }),
                takeUntilDestroyed()
            )
            .subscribe((results) => {
                if (this.query().trim().length < 2) {
                    return;
                }
                this.results.set(results);
                this.hasSearched.set(true);
                this.activeIndex.set(results.length ? 0 : -1);
            });
    }

    onQueryChange(value: string): void {
        this.query.set(value);
        this.search$.next(value);
    }

    onKeyDown(event: KeyboardEvent): void {
        const results = this.results();
        if (!results.length) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            const nextIndex = Math.min(this.activeIndex() + 1, results.length - 1);
            this.activeIndex.set(nextIndex);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            const nextIndex = Math.max(this.activeIndex() - 1, 0);
            this.activeIndex.set(nextIndex);
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            const active = results[this.activeIndex()] || results[0];
            if (active) {
                this.selectTenant(active);
            }
        }
    }

    selectTenant(tenant: TenantLookup): void {
        if (this.isResolving()) {
            return;
        }

        this.isResolving.set(true);
        this.errorMessage.set('');

        this.tenantService.getTenantByCode(tenant.subdomain).subscribe({
            next: (resolved) => {
                this.isResolving.set(false);
                if (resolved) {
                    this.tenantSelected.emit(resolved);
                } else {
                    this.errorMessage.set('We couldn’t find that organization.');
                }
            },
            error: () => {
                this.isResolving.set(false);
                this.errorMessage.set('We couldn’t find that organization.');
            }
        });
    }

}
