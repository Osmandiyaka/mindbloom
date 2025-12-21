import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { HostApi } from '../../../core/api/host-api';
import { Edition, EditionFeatureAssignment, EditionWithFeatures } from '../../../core/api/models';

import { PageHeaderComponent } from '../../../core/ui/page-header/page-header.component';
import { DataTableShellComponent } from '../../../core/ui/data-table-shell/data-table-shell.component';
import { SimpleTableComponent, SimpleColumn } from '../../../core/ui/simple-table/simple-table.component';
import { UiButtonComponent } from '../../../shared/ui/buttons/ui-button.component';
import { UiInputComponent } from '../../../shared/ui/forms/ui-input.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ToastService } from '../../../core/ui/toast/toast.service';

interface FeatureRow {
  featureKey: string;
  value: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    DataTableShellComponent,
    SimpleTableComponent,
    UiButtonComponent,
    UiInputComponent,
    BadgeComponent,
  ],
  template: `
    <host-page-header
      title="Editions"
      description="Manage editions and feature toggles for tenants."
    >
      <ui-button variant="primary" (click)="startCreate()">New Edition</ui-button>
      <ui-button variant="ghost" (click)="reload()" [disabled]="loading()">Refresh</ui-button>
    </host-page-header>

    <host-data-table-shell
      [loading]="loading()"
      [error]="error() ?? undefined"
      [hasData]="editions().length > 0"
      emptyText="No editions found."
    >
      <div class="layout">
        <div class="card list">
          <host-simple-table
            [columns]="columns"
            [data]="editions()"
            [idKey]="'id'"
            (rowClick)="selectEdition($event)"
          >
            <ng-template hostSimpleCell="displayName" let-row>
              <div class="cell-primary">{{ row.displayName }}</div>
              <div class="cell-secondary">{{ row.name }}</div>
            </ng-template>
            <ng-template hostSimpleCell="isActive" let-row>
              <app-badge size="sm" [dot]="true" [variant]="row.isActive ? 'success' : 'neutral'">{{ row.isActive ? 'Active' : 'Draft' }}</app-badge>
            </ng-template>
            <ng-template hostSimpleCell="monthlyPrice" let-row>
              <span class="cell-secondary">{{ row.monthlyPrice != null ? ('$' + row.monthlyPrice.toFixed(2)) : '—' }}</span>
            </ng-template>
          </host-simple-table>
        </div>

        <div class="card editor">
          <div class="editor-header">
            <div>
              <div class="section-title">{{ isCreating() ? 'Create edition' : 'Edit edition' }}</div>
              <div class="muted" *ngIf="selectedEdition()">Editing {{ selectedEdition()?.displayName }}</div>
            </div>
            <div class="spacer"></div>
            <ui-button size="sm" variant="ghost" (click)="resetForm()" [disabled]="loading()">Reset</ui-button>
            <ui-button size="sm" variant="primary" (click)="save()" [disabled]="loading() || !formValid()">Save</ui-button>
          </div>

          <div class="form-grid">
            <label>
              <div class="label">Name (code)</div>
              <ui-input [value]="form.name ?? ''" (valueChange)="onInput('name', $event)" [disabled]="!isCreating()" placeholder="basic" />
              <div class="hint">Lowercase code, cannot be changed later.</div>
            </label>
            <label>
              <div class="label">Display name</div>
              <ui-input [value]="form.displayName ?? ''" (valueChange)="onInput('displayName', $event)" placeholder="Basic" />
            </label>
            <label>
              <div class="label">Description</div>
              <ui-input [value]="form.description || ''" (valueChange)="onInput('description', $event)" placeholder="Short summary" />
            </label>
            <label>
              <div class="label">Monthly price</div>
              <ui-input type="number" [value]="stringify(form.monthlyPrice)" (valueChange)="onNumber('monthlyPrice', $event)" placeholder="49" />
            </label>
            <label>
              <div class="label">Annual price</div>
              <ui-input type="number" [value]="stringify(form.annualPrice)" (valueChange)="onNumber('annualPrice', $event)" placeholder="499" />
            </label>
            <label>
              <div class="label">Per-student monthly</div>
              <ui-input type="number" [value]="stringify(form.perStudentMonthly)" (valueChange)="onNumber('perStudentMonthly', $event)" placeholder="4.99" />
            </label>
            <label>
              <div class="label">Annual notes</div>
              <ui-input [value]="form.annualPriceNotes || ''" (valueChange)="onInput('annualPriceNotes', $event)" placeholder="Discount details" />
            </label>
            <label>
              <div class="label">Sort order</div>
              <ui-input type="number" [value]="stringify(form.sortOrder)" (valueChange)="onNumber('sortOrder', $event)" placeholder="0" />
            </label>
            <label class="switch-row">
              <input type="checkbox" [checked]="form.isActive ?? true" (change)="onToggle('isActive', $event)" />
              <span>Active</span>
            </label>
          </div>

          <div class="section-title">Features</div>
          <div class="muted">Key/value assignments applied to this edition.</div>

          <div class="feature-list">
            <div class="feature-row header">
              <div>Key</div>
              <div>Value</div>
              <div></div>
            </div>
            @for (f of featureRows(); track f) {
              <div class="feature-row">
                <ui-input [value]="f.featureKey" (valueChange)="updateFeatureKey(f, $event)" placeholder="feature.key" />
                <ui-input [value]="f.value" (valueChange)="updateFeatureValue(f, $event)" placeholder="enabled" />
                <ui-button size="sm" variant="ghost" (click)="removeFeature(f)">Remove</ui-button>
              </div>
            }
            <div class="feature-row">
              <ui-input [value]="newFeature.featureKey" (valueChange)="newFeature.featureKey = $event" placeholder="feature.key" />
              <ui-input [value]="newFeature.value" (valueChange)="newFeature.value = $event" placeholder="value" />
              <ui-button size="sm" variant="ghost" (click)="addFeature()">Add</ui-button>
            </div>
          </div>
        </div>
      </div>
    </host-data-table-shell>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 1fr 1.1fr; gap: 14px; }
    @media (max-width: 1100px) { .layout { grid-template-columns: 1fr; } }

    .card {
      border: 1px solid var(--host-border-subtle);
      background: var(--host-surface-elevated);
      border-radius: 14px;
      box-shadow: var(--host-shadow, 0 6px 18px rgba(0,0,0,0.06));
      padding: 12px;
    }
    .list { padding: 0; color: #0f172a; }
    .list table { color: #0f172a; }
    .list th { color: #0f172a; }
    .list td { color: #0f172a; }
    .list .cell-secondary { color: #4b5563; }
    .editor { display: flex; flex-direction: column; gap: 12px; }

    .editor-header { display:flex; align-items:center; gap:10px; }
    .section-title { font-weight: 700; color: #0f172a; }
    .muted { color: #6b7280; font-size: 13px; }
    .spacer { flex: 1; }

    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; align-items: start; }
    label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: #0f172a; }
    .label { font-weight: 600; }
    .hint { color: #6b7280; font-size: 12px; }
    .switch-row { flex-direction: row; align-items: center; gap: 8px; padding-top: 18px; }

    .feature-list { display: flex; flex-direction: column; gap: 8px; }
    .feature-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; align-items: center; }
    .feature-row.header { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; }
    .cell-primary { font-weight: 700; color: #0f172a; }
    .cell-secondary { color: #6b7280; font-size: 13px; }
  `]
})
export class EditionsPage {
  private api = inject(HostApi);
  private toast = inject(ToastService);

  loading = signal(false);
  error = signal<string | null>(null);

  editions = signal<Edition[]>([]);
  selectedId = signal<string | null>(null);
  isCreating = signal(false);

  featureRows = signal<FeatureRow[]>([]);
  newFeature: FeatureRow = { featureKey: '', value: '' };

  form: Partial<Edition> = {
    name: '',
    displayName: '',
    description: '',
    monthlyPrice: null,
    annualPrice: null,
    perStudentMonthly: null,
    annualPriceNotes: '',
    sortOrder: 0,
    isActive: true,
  };

  columns: SimpleColumn[] = [
    { key: 'displayName', label: 'Edition' },
    { key: 'isActive', label: 'Status' },
    { key: 'monthlyPrice', label: 'Monthly' },
  ];

  selectedEdition = computed(() => this.editions().find(e => e.id === this.selectedId()) || null);

  async ngOnInit() {
    await this.reload();
  }

  async reload() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const rows = await firstValueFrom(this.api.listHostEditions());
      const normalized = (rows || []).map(r => this.normalizeEdition(r));
      this.editions.set(normalized);
      if (normalized.length && !this.selectedId()) {
        await this.selectEdition(normalized[0]);
      }
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to load editions');
      this.toast.error('Failed to load editions');
    } finally {
      this.loading.set(false);
    }
  }

  async selectEdition(row: Edition) {
    this.isCreating.set(false);
    this.selectedId.set(row.id);
    this.loading.set(true);
    try {
      const detail = await firstValueFrom(this.api.getHostEdition(row.id)) as EditionWithFeatures;
      this.applyEdition(detail);
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Failed to load edition');
    } finally {
      this.loading.set(false);
    }
  }

  startCreate() {
    this.isCreating.set(true);
    this.selectedId.set(null);
    this.form = {
      name: '',
      displayName: '',
      description: '',
      monthlyPrice: null,
      annualPrice: null,
      perStudentMonthly: null,
      annualPriceNotes: '',
      sortOrder: 0,
      isActive: true,
    };
    this.featureRows.set([]);
    this.newFeature = { featureKey: '', value: '' };
  }

  resetForm() {
    const current = this.selectedEdition();
    if (current && !this.isCreating()) {
      this.selectEdition(current);
      return;
    }
    this.startCreate();
  }

  onInput(field: keyof Edition, value: string) {
    (this.form as any)[field] = value;
  }

  onNumber(field: keyof Edition, value: string) {
    const num = value === '' ? null : Number(value);
    (this.form as any)[field] = Number.isNaN(num) ? null : num;
  }

  onToggle(field: keyof Edition, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    (this.form as any)[field] = checked;
  }

  stringify(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value);
  }

  addFeature() {
    if (!this.newFeature.featureKey.trim()) return;
    this.featureRows.update(list => [...list, { ...this.newFeature }]);
    this.newFeature = { featureKey: '', value: '' };
  }

  removeFeature(row: FeatureRow) {
    this.featureRows.update(list => list.filter(f => f !== row));
  }

  updateFeatureKey(row: FeatureRow, value: string) {
    row.featureKey = value;
    this.featureRows.set([...this.featureRows()]);
  }

  updateFeatureValue(row: FeatureRow, value: string) {
    row.value = value;
    this.featureRows.set([...this.featureRows()]);
  }

  formValid(): boolean {
    if (!this.form.displayName || !this.form.displayName.trim()) return false;
    if (this.isCreating() && (!this.form.name || !this.form.name.trim())) return false;
    if (this.form.sortOrder !== undefined && this.form.sortOrder !== null && this.form.sortOrder < 0) return false;
    return true;
  }

  private buildFeatureAssignments(): EditionFeatureAssignment[] {
    return this.featureRows()
      .filter(f => f.featureKey.trim())
      .map(f => ({ featureKey: f.featureKey.trim(), value: f.value ?? '' }));
  }

  private applyEdition(detail: EditionWithFeatures) {
    const edition = this.normalizeEdition(detail.edition);
    const { features } = detail;
    this.form = {
      name: edition.name,
      displayName: edition.displayName,
      description: edition.description ?? '',
      monthlyPrice: edition.monthlyPrice ?? null,
      annualPrice: edition.annualPrice ?? null,
      perStudentMonthly: edition.perStudentMonthly ?? null,
      annualPriceNotes: edition.annualPriceNotes ?? '',
      sortOrder: edition.sortOrder ?? 0,
      isActive: edition.isActive ?? true,
    };
    this.featureRows.set(Object.entries(features || {}).map(([k, v]) => ({ featureKey: k, value: String(v) })));
  }

  private normalizeEdition(raw: any): Edition {
    return {
      id: raw.id,
      name: raw.name,
      displayName: raw.displayName ?? raw._displayName ?? raw.name,
      description: raw.description ?? raw._description ?? '',
      monthlyPrice: raw.monthlyPrice ?? raw._monthlyPrice ?? null,
      annualPrice: raw.annualPrice ?? raw._annualPrice ?? null,
      perStudentMonthly: raw.perStudentMonthly ?? raw._perStudentMonthly ?? null,
      annualPriceNotes: raw.annualPriceNotes ?? raw._annualPriceNotes ?? '',
      isActive: raw.isActive ?? raw._isActive ?? false,
      sortOrder: raw.sortOrder ?? raw._sortOrder ?? 0,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    } as Edition;
  }

  async save() {
    if (!this.formValid()) return;
    this.loading.set(true);
    try {
      let editionId = this.selectedId();
      if (this.isCreating()) {
        const created = await firstValueFrom(this.api.createHostEdition({
          name: this.form.name!.trim(),
          displayName: this.form.displayName!.trim(),
          description: this.form.description,
          monthlyPrice: this.form.monthlyPrice,
          annualPrice: this.form.annualPrice,
          perStudentMonthly: this.form.perStudentMonthly,
          annualPriceNotes: this.form.annualPriceNotes,
          isActive: this.form.isActive,
          sortOrder: this.form.sortOrder,
        }));
        editionId = created.id;
        this.editions.update(list => [...list, created]);
        this.selectedId.set(editionId);
        this.isCreating.set(false);
      } else if (editionId) {
        const updated = await firstValueFrom(this.api.updateHostEdition(editionId, {
          displayName: this.form.displayName?.trim(),
          description: this.form.description,
          monthlyPrice: this.form.monthlyPrice,
          annualPrice: this.form.annualPrice,
          perStudentMonthly: this.form.perStudentMonthly,
          annualPriceNotes: this.form.annualPriceNotes,
          isActive: this.form.isActive,
          sortOrder: this.form.sortOrder,
        }));
        this.editions.update(list => list.map(e => e.id === editionId ? updated : e));
      }

      if (editionId) {
        const features = this.buildFeatureAssignments();
        await firstValueFrom(this.api.setHostEditionFeatures(editionId, features));
      }

      if (editionId) {
        const detail = await firstValueFrom(this.api.getHostEdition(editionId));
        this.applyEdition(detail as EditionWithFeatures);
      }

      this.toast.success('Edition saved');
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Failed to save edition');
    } finally {
      this.loading.set(false);
    }
  }
}
