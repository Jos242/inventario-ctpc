import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { GenericService } from '../../share/generic.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-activo-update',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, ReactiveFormsModule, CommonModule],
  templateUrl: './activo-update.component.html',
  styleUrl: './activo-update.component.scss'
})
export class ActivoUpdateComponent {

  myForm: FormGroup;
  destroy$: Subject<boolean> = new Subject<boolean>();

  isLoadingResults: any;

  ubicaciones: any;
  modosAdquisicion: any;
  estados: { id: string, descripcion: string }[] = [
    { id: 'BUENO', descripcion: 'Bueno' },
    { id: 'MALO', descripcion: 'Malo' },
    { id: 'REGULAR', descripcion: 'Regular' }
  ];
  datos: any;
  activoId: any;

  selectedUbicacion: any; 
  selectedModoAdquisicion: any; 

  constructor(
    private gService: GenericService,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder
  ) {

    
   }

  ngOnInit(): void {
    this.activoId = this.route.snapshot.paramMap.get('id');
    
    this.loadModosAdquisicion();
    this.loadUbicaciones();
    

    this.myForm = this.formBuilder.group({
      descripcion: ['', Validators.required],
      ubicacion_actual: [Validators.required],
      modo_adquisicion: [ Validators.required],
      marca: [''],
      modelo: [''],
      serie: [''],
      estado: ['', Validators.required],
      precio: [''],
      conectividad: [false],
      seguridad: [false]
    });
  }

  loadUbicaciones(): void {
    this.isLoadingResults = true;

    const loadingTimeout = setTimeout(() => {
      if (this.isLoadingResults) {
        Swal.fire({
          icon: 'error',
          title: 'Hay problemas...',
          text: 'La carga de datos esta durando mas de lo esperado... Por favor intente nuevamente',
        });
      }
    }, 15000);

    this.gService.list('all-ubicaciones/')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any[]) => {
          this.ubicaciones = data;
          console.log(this.ubicaciones)
          this.isLoadingResults = false;
          clearTimeout(loadingTimeout);
        },
        error: (error) => {
          this.isLoadingResults = false;
          clearTimeout(loadingTimeout);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador.',
          });
        }
      });
  }

  loadModosAdquisicion(): void {
    this.isLoadingResults = true;

    const loadingTimeout = setTimeout(() => {
      if (this.isLoadingResults) {
        Swal.fire({
          icon: 'error',
          title: 'Hay problemas...',
          text: 'La carga de datos esta durando mas de lo esperado... Por favor intente nuevamente',
        });
      }
    }, 15000);

    this.gService.list('all/modo-adquisicion/')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any[]) => {
          this.modosAdquisicion = data;
          console.log(this.modosAdquisicion)
          this.isLoadingResults = false;
          clearTimeout(loadingTimeout);
          this.loadActivosDetails(this.activoId);
        },
        error: (error) => {
          this.isLoadingResults = false;
          clearTimeout(loadingTimeout);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador.',
          });
        }
      });
  }

  loadActivosDetails(activoId: string): void {
    this.gService.list(`activo/${activoId}/`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.datos = data;
        this.setDefaultValues();
        console.log(this.datos)
        this.activoId=this.datos.id;
        // this.selectedUbicacion = this.datos.ubicacion_original; // Set the default value for ubicacion
        // this.selectedModoAdquisicion = this.datos.modo_adquisicion; 
        this.myForm.patchValue(this.datos);
      });
  }

  setDefaultValues() {
    if (this.datos && this.modosAdquisicion.length && this.ubicaciones.length) {
      
      const modoAdquisicion = this.modosAdquisicion.find(modo => modo.descripcion === this.datos.modo_adquisicion);
      this.selectedModoAdquisicion = modoAdquisicion.id;
      // console.log(this.selectedModoAdquisicion)
      // console.log(modoAdquisicion)
      // console.log(modoAdquisicion.id)
      // this.myForm.get('modo_adquisicion').setValue(modoAdquisicion ? modoAdquisicion.id : null);

      
      const ubicacion = this.ubicaciones.find(ubic => ubic.nombre_oficial === this.datos.ubicacion_original);
      this.selectedUbicacion = ubicacion.id;
      // console.log(ubicacion)
      // this.myForm.get('ubicacion_original').setValue(ubicacion ? ubicacion.id : null);
    }
  }

  onSubmit() {
    if (this.myForm.valid) {
      const datas = this.myForm.value;
      console.log(datas)
      this.gService.patch(`update-activo/${this.activoId}/`, datas)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: 'Activo actualizado correctamente',
            });
            // this.router.navigate(['/activos']);
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un error al actualizar el activo, por favor intente de nuevo.',
            });
          }
        });
    }
  }

}
