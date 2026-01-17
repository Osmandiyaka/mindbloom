import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TenantContextService } from '../tenant/tenant-context.service';

export interface Department { id?: string; _id?: string; name: string; code: string; description?: string; active?: boolean; }
export interface Designation { id?: string; _id?: string; name: string; code: string; description?: string; active?: boolean; }
export interface Staff {
  id?: string; _id?: string;
  tenantId?: string;
  staffCode: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  photoUrl?: string;
  status?: 'draft' | 'pending' | 'active' | 'onLeave' | 'suspended' | 'archived' | 'terminated';
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  primarySchoolId?: string;
  primaryContactId?: string;
  primaryEmergencyContactId?: string;
  userId?: string;
}
export interface LeaveType { id?: string; _id?: string; name: string; code: string; daysPerYear: number; carryForward?: boolean; active?: boolean; }
export interface LeaveRequest {
  id?: string; _id?: string;
  staffId: string;
  leaveTypeCode: string;
  startDate: string;
  endDate: string;
  status?: string;
  days?: number;
  approverName?: string;
  approverComment?: string;
}

@Injectable({ providedIn: 'root' })
export class HrService {
  departments = signal<Department[]>([]);
  designations = signal<Designation[]>([]);
  staff = signal<Staff[]>([]);
  leaveTypes = signal<LeaveType[]>([]);
  leaveRequests = signal<LeaveRequest[]>([]);

  constructor(private http: HttpClient, private tenantContext: TenantContextService) {
    this.loadDepartments();
    this.loadDesignations();
    this.loadStaff();
    this.loadLeaveTypes();
  }

  private tenantId() {
    return this.tenantContext.activeTenantId() || environment.tenantId || null;
  }

  /* Departments */
  loadDepartments() {
    this.http.get<any[]>(`${environment.apiUrl}/hr/departments`).subscribe(list => this.departments.set(list.map(d => ({ ...d, id: d.id || d._id }))));
  }
  createDepartment(dto: Partial<Department>) { return this.http.post(`${environment.apiUrl}/hr/departments`, dto).subscribe(() => this.loadDepartments()); }

  /* Designations */
  loadDesignations() {
    this.http.get<any[]>(`${environment.apiUrl}/hr/designations`).subscribe(list => this.designations.set(list.map(d => ({ ...d, id: d.id || d._id }))));
  }
  createDesignation(dto: Partial<Designation>) { return this.http.post(`${environment.apiUrl}/hr/designations`, dto).subscribe(() => this.loadDesignations()); }

  /* Staff */
  loadStaff(filters?: any) {
    const tenantId = this.tenantId();
    const params = { ...(filters || {}), ...(tenantId ? { tenantId } : {}) };
    this.http.get<any[]>(`${environment.apiUrl}/hr/staff`, { params }).subscribe(list => this.staff.set(list.map(s => ({ ...s, id: s.id || s._id }))));
  }
  createStaff(dto: Partial<Staff>) {
    const tenantId = this.tenantId();
    const payload = { ...dto, ...(tenantId ? { tenantId } : {}) };
    return this.http.post(`${environment.apiUrl}/hr/staff`, payload).subscribe(() => this.loadStaff());
  }

  /* Leave types */
  loadLeaveTypes() {
    this.http.get<any[]>(`${environment.apiUrl}/hr/leave-types`).subscribe(list => this.leaveTypes.set(list.map(l => ({ ...l, id: l.id || l._id }))));
  }
  createLeaveType(dto: Partial<LeaveType>) { return this.http.post(`${environment.apiUrl}/hr/leave-types`, dto).subscribe(() => this.loadLeaveTypes()); }

  /* Leave requests */
  loadLeaveRequests(filters?: any) {
    this.http.get<any[]>(`${environment.apiUrl}/hr/leave-requests`, { params: filters || {} }).subscribe(list => this.leaveRequests.set(list.map(l => ({ ...l, id: l.id || l._id }))));
  }
  requestLeave(dto: Partial<LeaveRequest>) { return this.http.post(`${environment.apiUrl}/hr/leave-requests`, dto).subscribe(() => this.loadLeaveRequests()); }
  approveLeave(id: string, approver: string, comments?: string) {
    return this.http.post(`${environment.apiUrl}/hr/leave-requests/${id}/approve`, { approver, comments }).subscribe(() => this.loadLeaveRequests());
  }
  rejectLeave(id: string, approver: string, comments?: string) {
    return this.http.post(`${environment.apiUrl}/hr/leave-requests/${id}/reject`, { approver, comments }).subscribe(() => this.loadLeaveRequests());
  }
}
