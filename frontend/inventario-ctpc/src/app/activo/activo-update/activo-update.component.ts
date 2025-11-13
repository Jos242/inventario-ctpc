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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GenericService } from '../../share/generic.service';
import Swal from 'sweetalert2';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../share/auth.service';

@Component({
  selector: 'app-activo-update',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, ReactiveFormsModule, CommonModule, MatAutocompleteModule, MatIconModule, RouterLink],
  templateUrl: './activo-update.component.html',
  styleUrl: './activo-update.component.scss'
})
export class ActivoUpdateComponent {

  myForm: FormGroup;
  destroy$: Subject<boolean> = new Subject<boolean>();

  ubicaciones: any[] = [];
  filteredUbicaciones: any[] = [];
  modosAdquisiciones: any[] = [];
  filteredModos: any[] = [];
  isLoadingResults: any;

  ubicacion_anterior_id: any;

  estados: { id: string, descripcion: string }[] = [
    { id: 'BUENO', descripcion: 'BUENO' },
    { id: 'MALO', descripcion: 'MALO' },
    { id: 'REGULAR', descripcion: 'REGULAR' }
  ];
  bajas: { id: string, descripcion: string }[] = [
    { id: 'NO DADO DE BAJA', descripcion: 'NO DADO DE BAJA' },
    { id: 'DADO DE BAJA CON PLACA', descripcion: 'DADO DE BAJA CON PLACA' },
    { id: 'DADO DE BAJA SIN PLACA', descripcion: 'DADO DE BAJA SIN PLACA' },
    { id: 'A DAR DE BAJA', descripcion: 'A DAR DE BAJA' },
  ];
  placas: { id: boolean, descripcion: string }[] = [
    { id: false, descripcion: 'No' },
    { id: true, descripcion: 'Si' },
  ];
  datos: any;
  activoId: any;
  activoNo: any;

  selectedUbicacion: any; 
  selectedModoAdquisicion: any; 

  currentUserId: any;
  adminType: any = '';

  constructor(
    private gService: GenericService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder
  ) {

    
   }

  ngOnInit(): void {
    this.activoNo = this.route.snapshot.paramMap.get('id');
    
    this.loadModosAdquisicion();
    this.loadUbicaciones();
    

    this.myForm = this.formBuilder.group({
      descripcion: ['', Validators.required],
      ubicacion_actual: [Validators.required],
      modo_adquisicion: [Validators.required],
      marca: ["N/A"],
      modelo: ["N/A"],
      serie_modificado: ["N/A"],
      baja: ['DADO DE BAJA'],
      placa: [''],
      estado: ['', Validators.required],
      precio: [''],
      conectividad: [false],
      seguridad: [false]
    });

    this.authService.getCurrentUser$().subscribe(userId => {
      this.currentUserId = userId;
    });
    this.authService.getAdminType$().subscribe(adminType => {
      this.adminType = adminType;
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
          this.filteredUbicaciones = data;
          
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
          this.modosAdquisiciones = data;
          this.filteredModos = data;

          this.isLoadingResults = false;
          clearTimeout(loadingTimeout);
          this.loadActivosDetails();
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

  loadActivosDetails(): void {
    this.gService.list(`activo/${this.activoNo}/`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.datos = data;
        this.ubicacion_anterior_id = data.ubicacion_actual.id;
        this.activoId = data.id;
        
        this.myForm.patchValue(this.datos);
        console.log("final load activo details")
      });
  }

  onSubmit() {
    if (this.myForm.valid) {
      const datas = this.myForm.value;

      const original = this.datos;
      const changes: any = {};

      for (const key in datas) {
        if (Object.hasOwn(datas, key)) {
          const newValue = datas[key];
          const oldValue = original[key];
          
          if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
            changes[key] = newValue;
          }
        }
      }

      const changeCount = Object.keys(changes).length;

      if (!changeCount) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No ha hecho cambios.',
        });
        return;
      }
      
      if ('ubicacion_actual' in changes && this.myForm.value.ubicacion_actual?.id) {
        changes.ubicacion_actual = this.myForm.value.ubicacion_actual.id;
        changes.ubicacion_anterior_id = this.ubicacion_anterior_id;
      }
      if ('modo_adquisicion' in changes && this.myForm.value.modo_adquisicion?.id) {
        changes.modo_adquisicion = this.myForm.value.modo_adquisicion.id;
      }

      changes.no_identificacion = this.datos.no_identificacion;

      const semiAdminData = {
        adminType: this.adminType,
        currentUserId: this.currentUserId,
        descripcion: "Actualizar Activo"
      }

      this.gService.patch(`update-activo/${this.activoId}/`, changes, semiAdminData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            if (this.adminType == 'semiadmin') {
              Swal.fire({
                icon: 'success',
                title: 'Éxito',
                html: `Se han enviado los cambios a aprobación por un admin.`,
              });
              this.router.navigate([`/activos/${this.activoNo}`]);
              return;
            }
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: 'Activo actualizado correctamente',
            });
            this.router.navigate([`/activos/${this.activoNo}`]);
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

  filterUbicacion(value: string) {
    this.filteredUbicaciones = this.ubicaciones.filter(u => u.nombre_oficial.toLowerCase().includes(value.toLowerCase()));
  }
  onEnterPressedUbicacion() {
    if (this.filteredUbicaciones.length > 0) {
      this.myForm.get('ubicacion_actual')?.setValue(this.filteredUbicaciones[0]);
    }
  }
  displayUbicacion(ubicacion: any): string {
    return ubicacion?.nombre_oficial || '';
  }
  validateUbicacionInput() {
    const value = this.myForm.get('ubicacion_actual')?.value;
  
    if (!value || typeof value !== 'object' || !value.id) {
      this.myForm.get('ubicacion_actual')?.setValue(null);
      this.filterUbicacion("");
    }
  }
  onUbicacionBlur() {
    setTimeout(() => {
      this.validateUbicacionInput();
    }, 100);
  }

  filterModo(value: string) {
    this.filteredModos = this.modosAdquisiciones.filter(u => u.descripcion.toLowerCase().includes(value.toLowerCase()));
  }
  onEnterPressedModo() {
    if (this.filteredModos.length === 1) {
      this.myForm.get('modo_adquisicion')?.setValue(this.filteredModos[0]);
    }
  }
  displayModo(modo: any): string {
    return modo?.descripcion || '';
  }
  validateModoInput() {
    const value = this.myForm.get('modo_adquisicion')?.value;
  
    if (!value || typeof value !== 'object' || !value.id) {
      this.myForm.get('modo_adquisicion')?.setValue(null);
      this.filterModo("");
    }
  }
  onModoBlur() {
    setTimeout(() => {
      this.validateModoInput();
    }, 100);
  }
}
