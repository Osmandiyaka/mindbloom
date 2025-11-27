import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { HostelService } from './hostel.service';

@Controller('hostel')
export class HostelController {
  constructor(private readonly hostel: HostelService) {}

  /* Hostels */
  @Get()
  listHostels() { return this.hostel.listHostels(); }

  @Post()
  createHostel(@Body() dto: any) { return this.hostel.createHostel(dto); }

  @Patch(':id')
  updateHostel(@Param('id') id: string, @Body() dto: any) { return this.hostel.updateHostel(id, dto); }

  /* Rooms */
  @Get('rooms')
  listRooms(@Query('hostelId') hostelId?: string) { return this.hostel.listRooms(hostelId); }

  @Post('rooms')
  createRoom(@Body() dto: any) { return this.hostel.createRoom(dto); }

  @Patch('rooms/:id')
  updateRoom(@Param('id') id: string, @Body() dto: any) { return this.hostel.updateRoom(id, dto); }

  /* Beds */
  @Get('beds')
  listBeds(@Query('roomId') roomId?: string) { return this.hostel.listBeds(roomId); }

  @Post('beds')
  createBed(@Body() dto: any) { return this.hostel.createBed(dto); }

  @Patch('beds/:id')
  updateBed(@Param('id') id: string, @Body() dto: any) { return this.hostel.updateBed(id, dto); }

  /* Allocations */
  @Get('allocations')
  listAllocations(@Query() query: any) { return this.hostel.listAllocations(query); }

  @Post('allocations')
  createAllocation(@Body() dto: any) { return this.hostel.createAllocation(dto); }

  @Post('allocations/:id/end')
  endAllocation(@Param('id') id: string) { return this.hostel.endAllocation(id); }
}
