import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Hostel { id?: string; _id?: string; name: string; code: string; managerName?: string; managerContact?: string; gender?: string; capacity?: number; }
export interface Room { id?: string; _id?: string; hostelId: string; name: string; type?: string; capacity?: number; floor?: string; status?: string; gender?: string; }
export interface Bed { id?: string; _id?: string; hostelId: string; roomId: string; label: string; status?: string; }
export interface Allocation { id?: string; _id?: string; studentId: string; hostelId: string; roomId: string; bedId: string; startDate: string; endDate?: string; status?: string; }

@Injectable({ providedIn: 'root' })
export class HostelService {
  hostels = signal<Hostel[]>([]);
  rooms = signal<Room[]>([]);
  beds = signal<Bed[]>([]);
  allocations = signal<Allocation[]>([]);

  constructor(private http: HttpClient) {
    this.loadHostels();
  }

  loadHostels() {
    this.http.get<any[]>(`${environment.apiUrl}/hostel`).subscribe(list => this.hostels.set(list.map(h => ({ ...h, id: h.id || h._id }))));
  }
  createHostel(dto: Partial<Hostel>) { return this.http.post(`${environment.apiUrl}/hostel`, dto).subscribe(() => this.loadHostels()); }

  loadRooms(hostelId?: string) {
    const params: any = hostelId ? { hostelId } : {};
    this.http.get<any[]>(`${environment.apiUrl}/hostel/rooms`, { params }).subscribe(list => this.rooms.set(list.map(r => ({ ...r, id: r.id || r._id }))));
  }
  createRoom(dto: Partial<Room>) { return this.http.post(`${environment.apiUrl}/hostel/rooms`, dto).subscribe(() => this.loadRooms(dto.hostelId)); }

  loadBeds(roomId?: string, hostelId?: string) {
    const params: any = {};
    if (roomId) params.roomId = roomId;
    if (hostelId) params.hostelId = hostelId;
    this.http.get<any[]>(`${environment.apiUrl}/hostel/beds`, { params }).subscribe(list => this.beds.set(list.map(b => ({ ...b, id: b.id || b._id }))));
  }
  createBed(dto: Partial<Bed>) { return this.http.post(`${environment.apiUrl}/hostel/beds`, dto).subscribe(() => this.loadBeds(dto.roomId)); }

  loadAllocations(filters?: any) {
    this.http.get<any[]>(`${environment.apiUrl}/hostel/allocations`, { params: filters || {} }).subscribe(list => this.allocations.set(list.map(a => ({ ...a, id: a.id || a._id }))));
  }
  createAllocation(dto: Partial<Allocation>) { return this.http.post(`${environment.apiUrl}/hostel/allocations`, dto).subscribe(() => this.loadAllocations()); }
  endAllocation(id: string) { return this.http.post(`${environment.apiUrl}/hostel/allocations/${id}/end`, {}).subscribe(() => this.loadAllocations()); }
}
