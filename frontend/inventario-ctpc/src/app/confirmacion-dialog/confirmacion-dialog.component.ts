import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GenericService } from '../share/generic.service';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-confirmacion-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent, MatFormFieldModule, MatAutocompleteModule, ReactiveFormsModule, MatInputModule],
  templateUrl: './confirmacion-dialog.component.html',
  styleUrl: './confirmacion-dialog.component.scss'
})
export class ConfirmacionDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmacionDialogComponent>);
  readonly formBuilder = inject(FormBuilder);
  readonly gService = inject(GenericService);
  data = inject(MAT_DIALOG_DATA);

  destroy$:Subject<boolean> = new Subject<boolean>();
  myForm: FormGroup;
  ubicaciones: any[] = [];
  filteredUbicaciones: any[] = [];
  
  ngOnInit(): void {
    if (this.data.ubicaciones) {
      this.myForm = this.formBuilder.group({
        ubicacion: ['', Validators.required]
      });
      this.loadUbicaciones();
    }
  }
  
  public errorHandling = (control: string, error: string) => {
    return this.myForm.controls[control].hasError(error);
  };

  loadUbicaciones() {
    this.gService.list('all-ubicaciones/')
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any[]) => {
        this.ubicaciones = data;
        this.filteredUbicaciones = data;
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador.',
        });
      }
    });
  }

  filterUbicacion(value: string) {
    this.filteredUbicaciones = this.ubicaciones.filter(u => u.nombre_oficial.toLowerCase().includes(value.toLowerCase()));
  }
  onEnterPressedUbicacion() {
    if (this.filteredUbicaciones.length > 0) {
      this.myForm.get('modo_adquisicion')?.setValue(this.filteredUbicaciones[0]);
    }
  }
  displayUbicacion(ubicacion: any): string {
    return ubicacion?.nombre_oficial || '';
  }
  validateUbicacionInput() {
    const value = this.myForm.get('ubicacion')?.value;
  
    if (!value || typeof value !== 'object' || !value.id) {
      this.myForm.get('modo_adquisicion')?.setValue(null);
      this.filterUbicacion("");
    } else {
      const isAlreadyUsed = this.data.activos.some(
        (a) => a.ubicacion_actual?.id === value.id
      );
      if (isAlreadyUsed) {
        this.myForm.get('ubicacion')?.setErrors({invalidUbicacion: true});
      } else {
        this.myForm.get('ubicacion')?.setErrors(null);
      }
    }
  }
  onUbicacionBlur() {
    setTimeout(() => {
      this.validateUbicacionInput();
    }, 100);
  }

  closeDialog() {
    this.dialogRef.close(this.myForm.get('ubicacion')?.value);
  }
}
