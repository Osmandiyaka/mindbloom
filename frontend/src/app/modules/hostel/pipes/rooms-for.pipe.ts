import { Pipe, PipeTransform } from '@angular/core';
import { Room } from '../../../core/services/hostel.service';

@Pipe({ name: 'roomsFor', standalone: true })
export class RoomsForPipe implements PipeTransform {
  transform(rooms: Room[], hostelId: string) {
    return rooms.filter(r => r.hostelId === hostelId);
  }
}
