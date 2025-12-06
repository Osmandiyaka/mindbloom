import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'minValue',
  standalone: true
})
export class MinValuePipe implements PipeTransform {
  transform(value: number, limit: number): number {
    return Math.min(value, limit);
  }
}
