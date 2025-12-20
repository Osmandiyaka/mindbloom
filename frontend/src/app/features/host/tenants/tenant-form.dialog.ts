import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { EditionLookup, TenantCreateInput, TenantListItem, TenantUpdateInput } from '../../../core/api/models';

@Component({
  selector: 'tenant-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (open()) {
      <div class="backdrop" (click)="close()"></div>

      <div class="dialog" role="dialog" aria-modal="true">
        <div class="header">
          <div>
            <h2>{{ title() }}</h2>
            <p class="muted">{{ subtitle() }}</p>
          </div>
          <button type="button" class="icon" (click)="close()">✕</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="grid">
            <label class="field">
              <span>Name</span>
              <input formControlName="name" placeholder="e.g. Bright Future School" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <small class="error">Name is required</small>
              }
            </label>

            <label class="field">
              <span>Subdomain</span>
              <input formControlName="subdomain" placeholder="e.g. brightfuture" />
              <small class="muted">Used as: https://&lt;subdomain&gt;.yourapp.com</small>
              @if (form.controls.subdomain.touched && form.controls.subdomain.invalid) {
                <small class="error">Subdomain is required (letters/numbers/hyphen)</small>
              }
            </label>

            <label class="field">
              <span>Edition</span>
              <select formControlName="editionId">
                <option [ngValue]="null">None</option>
                @for (e of editions; track e.id) {
                  <option [ngValue]="e.id">{{ e.name }}</option>
                }
              </select>
            </label>

            @if (mode() === 'create') {
              <label class="field">
                <span>Trial days</span>
                <input type="number" formControlName="trialDays" placeholder="e.g. 14" />
                <small class="muted">Optional. Leave empty for no trial.</small>
              </label>
            }
          </div>

          <div class="footer">
            <button type="button" class="btn" (click)="close()">Cancel</button>
            <button type="submit" class="btn primary" [disabled]="form.invalid || submitting()">
              {{ submitting() ? 'Saving…' : (mode() === 'create' ? 'Create Tenant' : 'Save Changes') }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.35);
    }
    .dialog {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: min(720px, calc(100vw - 24px));
      background: #fff;
      color: #111827; /* ensure readable text on light dialog */
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 20px 50px rgba(0,0,0,.2);
      padding: 16px;
      z-index: 10;
    }
    .header { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
    h2 { margin: 0; font-size: 18px; color: #111827; }
    .muted { margin: 4px 0 0; color: #6b7280; font-size: 13px; }
    .icon { border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; padding: 6px 10px; cursor: pointer; color: #111827; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
    .field { display: grid; gap: 6px; }
    .field span { color: #111827; font-weight: 600; }
    input, select {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 10px;
      outline: none;
      color: #111827; /* ensure input text is dark */
      background: #fff;
    }
    input::placeholder { color: #9ca3af; }
    .error { color: #dc2626; }
    .footer { display: flex; justify-content: end; gap: 8px; margin-top: 16px; }
    .btn { border: 1px solid #e5e7eb; background: #fff; padding: 10px 12px; border-radius: 10px; cursor: pointer; color: #111827; }
    .btn.primary { background: #111827; color: #fff; border-color: #111827; }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
  `],
})
export class TenantFormDialogComponent {
  @Input({ required: true }) editions: EditionLookup[] = [];

  // open state controlled by parent
  open = signal(false);

  // create | edit
  private _mode = signal<'create' | 'edit'>('create');
  mode = computed(() => this._mode());

  // for edit mode
  private _tenant = signal<TenantListItem | null>(null);
  tenant = computed(() => this._tenant());

  @Output() closed = new EventEmitter<void>();
  @Output() create = new EventEmitter<TenantCreateInput>();
  @Output() update = new EventEmitter<{ id: string; input: TenantUpdateInput }>();

  submitting = signal(false);

  title = computed(() => this.mode() === 'create' ? 'Create Tenant' : 'Edit Tenant');
  subtitle = computed(() => this.mode() === 'create'
    ? 'Add a new school (tenant) to the platform.'
    : 'Update tenant details.'
  );

  form = this.fb.group({
    name: ['', Validators.required],
    subdomain: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/), // simple subdomain rule
      ],
    ],
    editionId: [null as string | null],
    trialDays: [null as number | null],
  });

  constructor(private fb: FormBuilder) { }

  showCreate() {
    this._mode.set('create');
    this._tenant.set(null);
    this.form.reset({ name: '', subdomain: '', editionId: null, trialDays: null });
    this.open.set(true);
  }

  showEdit(tenant: TenantListItem) {
    this._mode.set('edit');
    this._tenant.set(tenant);
    this.form.reset({
      name: tenant.name,
      subdomain: tenant.subdomain,
      editionId: tenant.editionId ?? null,
      trialDays: null,
    });
    this.open.set(true);
  }

  close() {
    this.open.set(false);
    this.closed.emit();
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.submitting.set(true);

    try {
      if (this.mode() === 'create') {
        this.create.emit({
          name: v.name!,
          subdomain: v.subdomain!,
          editionId: v.editionId ?? null,
          trialDays: v.trialDays ?? null,
        });
      } else {
        const t = this.tenant();
        if (!t) return;

        this.update.emit({
          id: t.id,
          input: {
            name: v.name!,
            subdomain: v.subdomain!,
            editionId: v.editionId ?? null,
          },
        });
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
