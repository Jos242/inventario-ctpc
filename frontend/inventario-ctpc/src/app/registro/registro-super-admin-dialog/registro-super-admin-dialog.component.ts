import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import {MatListModule} from '@angular/material/list';

@Component({
  selector: 'app-registro-super-admin-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatListModule, MatDividerModule],
  templateUrl: './registro-super-admin-dialog.component.html',
  styleUrl: './registro-super-admin-dialog.component.scss'
})
export class RegistroSuperAdminDialogComponent {
  data = inject(MAT_DIALOG_DATA);

  ngOnInit() {
    console.log(this.data)
  }

  showText(change: any) {
    let value = change.value;
    if (change.column == "modo_adquisicion") value = this.data.modos.find(m => m.id === change.value).descripcion;
    if (change.column == "ubicacion_original") value = this.data.ubicaciones.find(m => m.id === change.value).nombre_oficial;
    return value;
  }

  formatearCambios() {
    
  }
}
