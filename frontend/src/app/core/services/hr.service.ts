import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Department { id?: string; _id?: string; name: string; code: string; description?: string; active?: boolean; }
export interface Designation { id?: string; _id?: string; name: string; code: string; description?: string; active?: boolean; }
export interface Staff {
  id?: string; _id?: string;
  firstName: string; lastName: string; fullName?: string;
  email?: string; phone?: string; departmentCode?: string; designationCode?: string;
  status?: 'active' | 'inactive' | 'terminated';
  employeeId?: string;
  joinDate?: string;
  contractType?: string;
  salary?: { amount?: number; currency?: string; frequency?: string };
  address?: { street?: string; city?: string; state?: string; postalCode?: string; country?: string };
  emergencyContacts?: { name?: string; phone?: string; relationship?: string }[];
}
export interface LeaveType { id?: string; _id?: string; name: string; code: string; daysPerYear: number; carryForward?: boolean; active?: boolean; }
export interface LeaveRequest { id?: string; _id?: string; staffId: string; leaveTypeCode: string; startDate: string; endDate: string; status?: string; days?: number; }

@Injectable({ providedIn: 'root' })
export class HrService {
  departments = signal<Department[]>([]);
  designations = signal<Designation[]>([]);
  staff = signal<Staff[]>([]);
  leaveTypes = signal<LeaveType[]>([]);
  leaveRequests = signal<LeaveRequest[]>([]);

  constructor(private http: HttpClient) {
    this.loadDepartments();
    this.loadDesignations();
    this.loadStaff();
    this.loadLeaveTypes();
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
    this.http.get<any[]>(`${environment.apiUrl}/hr/staff`, { params: filters || {} }).subscribe(list => this.staff.set(list.map(s => ({ ...s, id: s.id || s._id }))));
  }
  createStaff(dto: Partial<Staff>) { return this.http.post(`${environment.apiUrl}/hr/staff`, dto).subscribe(() => this.loadStaff()); }

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
