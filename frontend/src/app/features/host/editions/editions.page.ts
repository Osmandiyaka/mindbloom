import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { HostApi } from '../../../core/api/host-api';
import { Edition, EditionFeatureAssignment, EditionWithFeatures, FeatureDefinitionDto } from '../../../core/api/models';

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
          <div class="muted">Add from the validated catalog or enter custom keys if needed.</div>

          <div class="feature-toolbar">
            <label class="feature-adder">
              <div class="label">Add from catalog</div>
              <select [value]="selectedFeatureKey()" (change)="onSelectCatalogKey($any($event.target).value)">
                <option value="">Select feature</option>
                @for (opt of availableCatalogFeatures(); track opt.key) {
                  <option [value]="opt.key">{{ opt.category }} — {{ opt.displayName }}</option>
                }
              </select>
            </label>
            <ui-button size="sm" variant="primary" (click)="addFromCatalog()" [disabled]="!selectedFeatureKey()">Add</ui-button>
            <div class="divider"></div>
            <label class="feature-adder">
              <div class="label">Custom key</div>
              <ui-input [value]="newFeature.featureKey" (valueChange)="newFeature.featureKey = $event" placeholder="feature.key" />
            </label>
            <label class="feature-adder">
              <div class="label">Value</div>
              <ui-input [value]="newFeature.value" (valueChange)="newFeature.value = $event" placeholder="value" />
            </label>
            <ui-button size="sm" variant="ghost" (click)="addCustomFeature()" [disabled]="!newFeature.featureKey.trim()">Add custom</ui-button>
          </div>

          <div class="feature-list">
            <div class="feature-row header">
              <div>Feature</div>
              <div>Value</div>
              <div></div>
            </div>
            @for (f of featureRows(); track f) {
              <div class="feature-row">
                <div class="feature-meta">
                  <div class="cell-primary">{{ featureDisplayName(f.featureKey) }}</div>
                  <div class="muted" *ngIf="featureDescription(f.featureKey)">{{ featureDescription(f.featureKey) }}</div>
                </div>
                <div class="feature-value">
                  <ng-container [ngSwitch]="featureValueType(f.featureKey)">
                    <label class="switch" *ngSwitchCase="'BOOLEAN'">
                      <input type="checkbox" [checked]="f.value === 'true'" (change)="updateFeatureValue(f, ($any($event.target).checked ? 'true' : 'false'))" />
                      <span>{{ f.value === 'true' ? 'Enabled' : 'Disabled' }}</span>
                    </label>
                    <ui-input *ngSwitchCase="'INT'" type="number" [value]="f.value" (valueChange)="updateFeatureValue(f, $event)" />
                    <ui-input *ngSwitchCase="'DECIMAL'" type="number" step="0.01" [value]="f.value" (valueChange)="updateFeatureValue(f, $event)" />
                    <ui-input *ngSwitchDefault [value]="f.value" (valueChange)="updateFeatureValue(f, $event)" />
                  </ng-container>
                </div>
                <ui-button size="sm" variant="primary" (click)="removeFeature(f)">Remove</ui-button>
              </div>
            }
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
      color: var(--host-text-color, #111827);
    }
    .list { padding: 0; color: var(--host-text-color, #111827); }
    .list table { color: var(--host-text-color, #111827); }
    .list th { color: var(--host-text-color, #111827); }
    .list td { color: var(--host-text-color, #111827); }
    .list .cell-secondary { color: var(--host-text-color, #111827); }
    .editor { display: flex; flex-direction: column; gap: 12px; }

    .editor-header { display:flex; align-items:center; gap:10px; }
    .section-title { font-weight: 700; color: var(--host-text-color, #111827); }
    .muted { color: var(--host-text-color, #111827); font-size: 13px; }
    .spacer { flex: 1; }

    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; align-items: start; }
    label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--host-text-color, #111827); }
    .label { font-weight: 600; }
    .hint { color: var(--host-text-color, #111827); font-size: 12px; }
    .switch-row { flex-direction: row; align-items: center; gap: 8px; padding-top: 18px; }

    .feature-toolbar { display: grid; grid-template-columns: 1.3fr auto 12px 1fr 1fr auto; gap: 10px; align-items: end; padding: 10px; background: var(--host-surface); border: 1px dashed var(--host-border-subtle); border-radius: 10px; }
    .feature-adder { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--host-text-color, #111827); }
    .feature-adder select { width: 100%; padding: 8px; border-radius: 8px; border: 1px solid var(--host-border-subtle); background: white; }
    .divider { border-left: 1px solid var(--host-border-subtle); height: 100%; }

    .feature-list { display: flex; flex-direction: column; gap: 8px; }
    .feature-row { display: grid; grid-template-columns: 1.2fr 0.9fr auto; gap: 12px; align-items: center; padding: 8px 10px; border: 1px solid var(--host-border-subtle); border-radius: 10px; background: #fff; }
    .feature-row.header { border: none; background: transparent; padding: 0; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--host-text-color, #111827); }
    .feature-meta { display: flex; flex-direction: column; gap: 4px; }
    .feature-value { display: flex; align-items: center; gap: 10px; }
    .switch { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
    .cell-primary { font-weight: 700; color: var(--host-text-color, #111827); }
    .cell-secondary { color: var(--host-text-color, #111827); font-size: 13px; }

    :host ::ng-deep host-page-header .description {
      color: var(--host-text-color, var(--text-primary, #0f172a));
      font-weight: 600;
      opacity: 1;
    }

    /* Button contrast overrides within this page */
    :host ::ng-deep ui-button button,
    :host ::ng-deep button {
      color: #111827;
      font-weight: 700;
    }

    :host ::ng-deep ui-button[variant="primary"] button {
      background: #111827;
      color: #fff;
      border-color: #111827;
    }

    :host ::ng-deep ui-button[variant="ghost"] button {
      border-color: #111827;
      color: #111827;
      background: #fff;
    }

    /* High-contrast form controls and placeholders */
    :host ::ng-deep ui-input input,
    :host ::ng-deep ui-input textarea,
    :host ::ng-deep select,
    :host ::ng-deep input,
    :host ::ng-deep textarea {
      color: var(--host-text-color, #111827);
      -webkit-text-fill-color: var(--host-text-color, #111827);
      opacity: 1;
    }

    :host ::ng-deep ui-input input::placeholder,
    :host ::ng-deep ui-input textarea::placeholder,
    :host ::ng-deep input::placeholder,
    :host ::ng-deep textarea::placeholder {
      color: var(--host-muted-color, var(--color-text-secondary, #334155));
      opacity: 1;
    }

    :host ::ng-deep ui-input input:disabled,
    :host ::ng-deep ui-input textarea:disabled,
    :host ::ng-deep select:disabled,
    :host ::ng-deep input:disabled,
    :host ::ng-deep textarea:disabled {
      color: var(--host-muted-color, var(--color-text-secondary, #334155));
      -webkit-text-fill-color: var(--host-muted-color, var(--color-text-secondary, #334155));
      background: #f8fafc;
      border-color: var(--host-border-subtle);
      opacity: 1;
    }
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
  featureCatalog = signal<FeatureDefinitionDto[]>([]);
  featureCatalogMap = computed(() => {
    const map = new Map<string, FeatureDefinitionDto>();
    for (const def of this.featureCatalog()) {
      map.set(def.key.toLowerCase(), def);
    }
    return map;
  });
  selectedFeatureKey = signal<string>('');

  availableCatalogFeatures = computed(() => {
    const existing = new Set(this.featureRows().map(r => r.featureKey.toLowerCase()));
    return this.featureCatalog()
      .filter(def => !existing.has(def.key.toLowerCase()))
      .sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '') || (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.displayName.localeCompare(b.displayName));
  });

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
    await Promise.all([this.loadFeatureCatalog(), this.reload()]);
  }

  private async loadFeatureCatalog() {
    try {
      const defs = await firstValueFrom(this.api.listHostFeatureCatalog());
      this.featureCatalog.set(defs || []);
      this.featureRows.set(this.sortFeatureRows([...this.featureRows()]));
    } catch (e) {
      console.warn('Failed to load feature catalog', e);
      this.featureCatalog.set([]);
    }
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

  onSelectCatalogKey(key: string) {
    this.selectedFeatureKey.set(key);
  }

  addFromCatalog() {
    const key = this.selectedFeatureKey().trim();
    if (!key) return;
    const def = this.featureCatalogMap().get(key.toLowerCase());
    const value = def?.defaultValue ?? '';
    this.upsertFeatureRow(key, value);
    this.selectedFeatureKey.set('');
  }

  addCustomFeature() {
    const key = this.newFeature.featureKey.trim();
    if (!key) return;
    const value = this.newFeature.value ?? '';
    this.upsertFeatureRow(key, value);
    this.newFeature = { featureKey: '', value: '' };
  }

  removeFeature(row: FeatureRow) {
    this.featureRows.update(list => list.filter(f => f !== row));
  }

  updateFeatureValue(row: FeatureRow, value: string) {
    row.value = value;
    this.featureRows.set(this.sortFeatureRows([...this.featureRows()]));
  }

  private upsertFeatureRow(key: string, value: string) {
    const trimmedKey = key.trim();
    if (!trimmedKey) return;
    const normalized = trimmedKey.toLowerCase();
    const current = this.featureRows();
    const idx = current.findIndex(f => f.featureKey.toLowerCase() === normalized);
    if (idx >= 0) {
      const next = [...current];
      next[idx] = { featureKey: trimmedKey, value };
      this.featureRows.set(this.sortFeatureRows(next));
      return;
    }
    this.featureRows.set(this.sortFeatureRows([...current, { featureKey: trimmedKey, value }]));
  }

  featureDisplayName(key: string): string {
    return this.featureCatalogMap().get(key.toLowerCase())?.displayName ?? key;
  }

  featureDescription(key: string): string | undefined {
    return this.featureCatalogMap().get(key.toLowerCase())?.description;
  }

  featureValueType(key: string): FeatureDefinitionDto['valueType'] {
    return this.featureCatalogMap().get(key.toLowerCase())?.valueType ?? 'STRING';
  }

  private sortFeatureRows(rows: FeatureRow[]): FeatureRow[] {
    const map = this.featureCatalogMap();
    return [...rows].sort((a, b) => {
      const defA = map.get(a.featureKey.toLowerCase());
      const defB = map.get(b.featureKey.toLowerCase());
      const catA = defA?.category ?? '';
      const catB = defB?.category ?? '';
      if (catA !== catB) return catA.localeCompare(catB);
      const orderA = defA?.sortOrder ?? 0;
      const orderB = defB?.sortOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return (defA?.displayName ?? a.featureKey).localeCompare(defB?.displayName ?? b.featureKey);
    });
  }

  formValid(): boolean {
    if (!this.form.displayName || !this.form.displayName.trim()) return false;
    if (this.isCreating() && (!this.form.name || !this.form.name.trim())) return false;
    if (this.form.sortOrder !== undefined && this.form.sortOrder !== null && this.form.sortOrder < 0) return false;
    return true;
  }

  private buildFeatureAssignments(): EditionFeatureAssignment[] {
    const seen = new Set<string>();
    return this.featureRows()
      .map(f => ({ featureKey: f.featureKey.trim(), value: (f.value ?? '').toString() }))
      .filter(f => f.featureKey && !seen.has(f.featureKey) && (seen.add(f.featureKey), true));
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
    const rows = Object.entries(features || {}).map(([k, v]) => ({ featureKey: k, value: String(v) }));
    this.featureRows.set(this.sortFeatureRows(rows));
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
