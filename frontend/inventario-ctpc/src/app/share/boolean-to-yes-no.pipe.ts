import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'booleanToYesNo',
  standalone: true
})
export class BooleanToYesNoPipe implements PipeTransform {

  transform(value: boolean): string {
    return value ? 'Sí' : 'No';
  }

}
