import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HrService, Staff } from '../../../../core/services/hr.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';

interface StaffDoc { id: string; name: string; type: string; size: string; status: 'complete' | 'uploading'; }

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
  activeTab = signal<'overview' | 'employment' | 'comp' | 'docs' | 'leave' | 'attendance'>('overview');
  canViewComp = true; // TODO: gate by permissions/role
  saving = signal(false);
  docs = signal<StaffDoc[]>([
    { id: '1', name: 'Employment Contract.pdf', type: 'application/pdf', size: '240 KB', status: 'complete' },
    { id: '2', name: 'ID Scan.jpg', type: 'image/jpeg', size: '520 KB', status: 'complete' }
  ]);

  personalForm!: FormGroup;
  employmentForm!: FormGroup;
  compensationForm!: FormGroup;

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
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.email]],
      phone: [''],
      dateOfBirth: ['']
    });
    this.employmentForm = this.fb.group({
      departmentCode: [''],
      designationCode: [''],
      employeeId: [''],
      joinDate: [''],
      contractType: ['full-time']
    });
    this.compensationForm = this.fb.group({
      amount: [null, [Validators.min(0)]],
      currency: ['USD'],
      frequency: ['monthly']
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
      firstName: (staff as any).firstName || '',
      lastName: (staff as any).lastName || '',
      email: staff.email || '',
      phone: staff.phone || '',
      dateOfBirth: (staff as any).dateOfBirth || ''
    });
    this.employmentForm.patchValue({
      departmentCode: staff.departmentCode || '',
      designationCode: staff.designationCode || '',
      employeeId: staff.employeeId || '',
      joinDate: (staff as any).joinDate || '',
      contractType: (staff as any).contractType || 'full-time'
    });
    this.compensationForm.patchValue({
      amount: (staff as any).salary?.amount || null,
      currency: (staff as any).salary?.currency || 'USD',
      frequency: (staff as any).salary?.frequency || 'monthly'
    });
  }

  setTab(tab: 'overview' | 'employment' | 'comp' | 'docs' | 'leave' | 'attendance') {
    this.activeTab.set(tab);
  }

  saveForms() {
    if (this.personalForm.invalid || this.employmentForm.invalid || (this.canViewComp && this.compensationForm.invalid)) {
      this.personalForm.markAllAsTouched();
      this.employmentForm.markAllAsTouched();
      this.compensationForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      alert('Profile saved (demo).');
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
        status: 'uploading'
      };
      this.docs.update(list => [...list, temp]);
      setTimeout(() => {
        this.docs.update(list => list.map(d => d.id === temp.id ? { ...d, status: 'complete' } : d));
      }, 1200);
    });
    input.value = '';
  }

  deleteDoc(id: string) {
    this.docs.update(list => list.filter(d => d.id !== id));
  }

  viewDoc(doc: StaffDoc) {
    alert(`Preview: ${doc.name}`);
  }

  backToDirectory() {
    this.router.navigate(['/hr/directory']);
  }
}
