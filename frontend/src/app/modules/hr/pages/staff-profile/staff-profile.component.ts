import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HrService, Staff } from '../../../../core/services/hr.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';

interface StaffDoc { id: string; name: string; type: string; size: string; status: 'complete' | 'uploading'; progress?: number; }
type TabKey = 'overview' | 'docs';
type ToastType = 'success' | 'error' | 'info';
interface Toast { type: ToastType; message: string; }

@Component({
  selector: 'app-staff-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ButtonComponent, CardComponent],
  templateUrl: './staff-profile.component.html',
  styleUrls: ['./staff-profile.component.scss']
})
export class StaffProfileComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  staff = signal<Staff | null>(null);
  activeTab = signal<TabKey>('overview');
  saving = signal(false);
  docs = signal<StaffDoc[]>([
    { id: '1', name: 'Employment Contract.pdf', type: 'application/pdf', size: '240 KB', status: 'complete' },
    { id: '2', name: 'ID Scan.jpg', type: 'image/jpeg', size: '520 KB', status: 'complete' }
  ]);
  toast = signal<Toast | null>(null);

  personalForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private hr: HrService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForms();
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No staff ID provided');
      this.loading.set(false);
      return;
    }
    this.loadStaff(id);
  }

  initForms() {
    this.personalForm = this.fb.group({
      staffCode: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      preferredName: [''],
      dob: [''],
      gender: [''],
      nationality: [''],
      status: ['active']
    });
  }

  loadStaff(id: string) {
    this.loading.set(true);
    this.hr.loadStaff();
    setTimeout(() => {
      const found = this.hr.staff().find(s => s.id === id || s._id === id);
      if (found) {
        this.staff.set(found);
        this.patchForms(found);
      } else {
        this.error.set('Staff not found');
      }
      this.loading.set(false);
    }, 800);
  }

  patchForms(staff: Staff) {
    this.personalForm.patchValue({
      staffCode: staff.staffCode || '',
      firstName: staff.firstName || '',
      lastName: staff.lastName || '',
      preferredName: staff.preferredName || '',
      dob: staff.dob || '',
      gender: staff.gender || '',
      nationality: staff.nationality || '',
      status: staff.status || 'active'
    });
  }

  setTab(tab: TabKey) {
    this.activeTab.set(tab);
  }

  saveForms() {
    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.toast.set({ type: 'info', message: 'Saving changes…' });
    setTimeout(() => {
      this.saving.set(false);
      this.toast.set({ type: 'success', message: 'Profile updated.' });
      setTimeout(() => this.toast.set(null), 2000);
    }, 600);
  }

  uploadDoc(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    Array.from(input.files).forEach(file => {
      const temp: StaffDoc = {
        id: Math.random().toString(36).slice(2),
        name: file.name,
        type: file.type,
        size: `${Math.round(file.size / 1024)} KB`,
        status: 'uploading',
        progress: 5
      };
      this.docs.update(list => [...list, temp]);
      const tick = setInterval(() => {
        this.docs.update(list => list.map(d => {
          if (d.id !== temp.id) return d;
          const next = Math.min(100, (d.progress || 0) + 25);
          return { ...d, progress: next, status: next >= 100 ? 'complete' : 'uploading' };
        }));
      }, 250);
      setTimeout(() => clearInterval(tick), 1200);
    });
    input.value = '';
  }

  deleteDoc(id: string) {
    this.docs.update(list => list.filter(d => d.id !== id));
    this.toast.set({ type: 'success', message: 'Document removed.' });
    setTimeout(() => this.toast.set(null), 1500);
  }

  viewDoc(doc: StaffDoc) {
    alert(`Preview: ${doc.name}`);
  }

  backToDirectory() {
    this.router.navigate(['/hr/directory']);
  }

  controlInvalid(form: FormGroup, control: string) {
    const ctrl = form.get(control);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  displayName(staff?: Staff | null) {
    if (!staff) return '';
    const first = staff.preferredName || staff.firstName || '';
    const last = staff.lastName || '';
    return `${first} ${last}`.trim();
  }
}
