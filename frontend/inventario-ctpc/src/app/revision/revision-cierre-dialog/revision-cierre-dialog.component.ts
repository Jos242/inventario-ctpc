import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-revision-cierre-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent],
  templateUrl: './revision-cierre-dialog.component.html',
  styleUrl: './revision-cierre-dialog.component.scss'
})
export class RevisionCierreDialogComponent {
  readonly dialogRef = inject(MatDialogRef<RevisionCierreDialogComponent>);
}
