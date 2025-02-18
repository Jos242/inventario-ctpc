import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-revision-cierre-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent],
  templateUrl: './revision-cierre-dialog.component.html',
  styleUrl: './revision-cierre-dialog.component.scss'
})
export class RevisionCierreDialogComponent {
  readonly dialogRef = inject(MatDialogRef<RevisionCierreDialogComponent>);
  data = inject(MAT_DIALOG_DATA);
  mensajes = [
    {
      mensaje:  'Una vez iniciada la revisión de inventario, será rederigido al inventario de su aula. Debe finalizar de realizar la revision antes de cerrar la pagina. Está seguro que desea continuar con la revisión?',
      false: 'No',
      true: 'Si'
    },
    {
      mensaje:  'Ya tiene iniciada una revisión de inventario en esta ubicación. Desea continuar con la revisión o empezar una nueva?',
      false: 'Nueva',
      true: 'Continuar'
    }
  ];
}
