import { Component, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-cierre-nota-dialog',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  templateUrl: './cierre-nota-dialog.component.html',
  styleUrl: './cierre-nota-dialog.component.scss'
})
export class CierreNotaDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CierreNotaDialogComponent>);
  readonly nota = model();

  onNoClick(): void {
    this.dialogRef.close();
  }
}
