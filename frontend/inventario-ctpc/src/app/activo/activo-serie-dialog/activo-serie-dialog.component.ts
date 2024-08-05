import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-activo-serie-dialog',
  standalone: true,
  imports: [MatFormFieldModule, ReactiveFormsModule, MatInputModule],
  templateUrl: './activo-serie-dialog.component.html',
  styleUrl: './activo-serie-dialog.component.scss'
})
export class ActivoSerieDialogComponent {
  serie: string;
  serieForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ActivoSerieDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { index: number, total: number },
    private fb: FormBuilder,
  ) {
    this.serieForm = this.fb.group({
      serie: ['', Validators.required]
    });

  }

  

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.serieForm.valid) {
      this.dialogRef.close(this.serieForm.value);
      this.serie="";
    }
  }
}
