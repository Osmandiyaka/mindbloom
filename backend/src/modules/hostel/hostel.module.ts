import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HostelSchema } from '../../infrastructure/persistence/mongoose/schemas/hostel.schema';
import { RoomSchema } from '../../infrastructure/persistence/mongoose/schemas/hostel-room.schema';
import { BedSchema } from '../../infrastructure/persistence/mongoose/schemas/hostel-bed.schema';
import { AllocationSchema } from '../../infrastructure/persistence/mongoose/schemas/hostel-allocation.schema';
import { HostelService } from './hostel.service';
import { HostelController } from './hostel.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Hostel', schema: HostelSchema },
      { name: 'HostelRoom', schema: RoomSchema },
      { name: 'HostelBed', schema: BedSchema },
      { name: 'HostelAllocation', schema: AllocationSchema },
    ]),
  ],
  controllers: [HostelController],
  providers: [HostelService],
  exports: [HostelService],
})
export class HostelModule { }
