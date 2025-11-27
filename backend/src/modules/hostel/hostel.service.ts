import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class HostelService {
  constructor(
    @InjectModel('Hostel') private hostelModel: Model<any>,
    @InjectModel('HostelRoom') private roomModel: Model<any>,
    @InjectModel('HostelBed') private bedModel: Model<any>,
    @InjectModel('HostelAllocation') private allocModel: Model<any>,
  ) {}

  /* Hostels */
  listHostels() {
    return this.hostelModel.find().sort({ name: 1 }).lean();
  }
  createHostel(dto: any) {
    return new this.hostelModel(dto).save();
  }
  updateHostel(id: string, dto: any) {
    return this.hostelModel.findByIdAndUpdate(id, dto, { new: true });
  }

  /* Rooms */
  listRooms(hostelId?: string) {
    const query: any = {};
    if (hostelId) query.hostelId = new Types.ObjectId(hostelId);
    return this.roomModel.find(query).sort({ name: 1 }).lean();
  }
  createRoom(dto: any) {
    return new this.roomModel(dto).save();
  }
  updateRoom(id: string, dto: any) {
    return this.roomModel.findByIdAndUpdate(id, dto, { new: true });
  }

  /* Beds */
  listBeds(roomId?: string) {
    const query: any = {};
    if (roomId) query.roomId = new Types.ObjectId(roomId);
    return this.bedModel.find(query).sort({ label: 1 }).lean();
  }
  createBed(dto: any) {
    return new this.bedModel(dto).save();
  }
  updateBed(id: string, dto: any) {
    return this.bedModel.findByIdAndUpdate(id, dto, { new: true });
  }

  /* Allocations */
  listAllocations(filters: any = {}) {
    const query: any = {};
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.hostelId) query.hostelId = filters.hostelId;
    if (filters.status) query.status = filters.status;
    return this.allocModel.find(query).sort({ createdAt: -1 }).lean();
  }
  createAllocation(dto: any) {
    return new this.allocModel(dto).save().then(async (alloc) => {
      await this.bedModel.findByIdAndUpdate(dto.bedId, { status: 'occupied' });
      return alloc;
    });
  }
  endAllocation(id: string) {
    return this.allocModel.findByIdAndUpdate(id, { status: 'completed', endDate: new Date() }, { new: true });
  }
}
