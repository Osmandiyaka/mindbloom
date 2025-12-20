import { Injectable, computed, signal } from '@angular/core';
import { TenantListItem } from '../../../core/api/models';

@Injectable({ providedIn: 'root' })
export class TenantsStore {
    // query state
    q = signal('');
    status = signal<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'TRIAL'>('ALL');
    editionId = signal<'ALL' | string>('ALL');
    page = signal(1);
    pageSize = signal(10);

    // data state
    loading = signal(false);
    error = signal<string | null>(null);
    total = signal(0);
    items = signal<TenantListItem[]>([]);

    editions = signal<any[]>([]);

    hasData = computed(() => (this.items() || []).length > 0);

    buildQuery(): any {
        return {
            q: this.q().trim() || undefined,
            status: this.status(),
            editionId: this.editionId(),
            page: this.page(),
            pageSize: this.pageSize(),
        };
    }

    setItems(items: TenantListItem[], total: number) {
        this.items.set(items);
        this.total.set(total);
    }

    resetToFirstPage() {
        this.page.set(1);
    }
}
