import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatButtonModule} from '@angular/material/button';
import {MatCardActions, MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule, FormBuilder, ReactiveFormsModule, FormGroup} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatDividerModule} from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import {AfterViewInit, ViewChild} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';

import Swal from 'sweetalert2';
import { GenericService } from '../../share/generic.service';
import { Subject, takeUntil } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { RegistroSuperAdminDialogComponent } from '../registro-super-admin-dialog/registro-super-admin-dialog.component';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-registro-super-admin',
  standalone: true,
    imports: [MatGridListModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,MatDividerModule, MatSelectModule, 
      CommonModule, MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule, MatTooltip, FormsModule, ReactiveFormsModule, RouterLink, MatAutocompleteModule
    ],
  templateUrl: './registro-super-admin.component.html',
  styleUrl: './registro-super-admin.component.scss'
})
export class RegistroSuperAdminComponent {
  destroy$: Subject<boolean> = new Subject<boolean>();
  public isLoadingResults = false;
  displayMessage: boolean = false;

  registros: any[] = [];

  ubicaciones: any[] = [];
  filteredUbicaciones: any[] = [];
  modosAdquisiciones: any[] = [];
  filteredModos: any[] = [];

  changes: { id: number; id_registro: any; column: string; oldValue: any; value: any; isObservacion: boolean }[] = [];

  columns = ['id_registro', 'no_identificacion', 'descripcion', 
            'marca', 'modelo', 'serie', 'estado',
            'ubicacion_original', 'modo_adquisicion', 'precio'];
  
  rowsDataSource = new MatTableDataSource<any>([]);
            
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  get displayedColumns() {
    return ['rowNumber', ...this.columns];
  }

  constructor(
      private gService:GenericService,
      private fb: FormBuilder,
      private dialog: MatDialog
  ){
    this.resetData();
    
    Swal.fire({
      icon: 'warning',
      title: 'Advertencia',
      text: `Está a punto de trabajar con registros sensibles.
            Asegúrese de que comprende las acciones que va a realizar antes de continuar.`,
    });
}

  ngAfterViewInit() {
    this.rowsDataSource.paginator = this.paginator; // Attach paginator
  }

  blurInput(event: Event) {
    const target = event.target as HTMLInputElement;
    target.blur();
  }
    
  loadRegistros(){
    this.isLoadingResults = true;  // Start loading

    const loadingTimeout = setTimeout(() => {
      if (this.isLoadingResults) {
        Swal.fire({
          icon: 'error',
          title: 'Hay problemas...',
          text: 'La carga de datos esta durando mas de lo esperado... Por favor intente nuevamente',
        });
      }
    }, 15000); // 15 seconds
    
    this.gService.list('registros/all/')
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        this.registros = JSON.parse(JSON.stringify(data));
        this.rowsDataSource.data = data;
        console.log(data)

        this.isLoadingResults = false; // Stop loading
        clearTimeout(loadingTimeout); // Clear the timeout if loading is finished
        this.displayMessage = false;
      },
      error: (error) => {
        this.isLoadingResults = false; // Stop loading on error
        clearTimeout(loadingTimeout); // Clear the timeout if there's an error
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador.',
        });
      }
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

  hasAtMostTwoValues(obj: Record<string, any>): boolean {
    if (!obj) return false;

    const nonNullCount = Object.values(obj)
      .filter(value => value !== null && value !== undefined && value !== '')
      .length;

    return nonNullCount <= 3;
  }

  updateChanges(row: any, col: string, value: any, isObservacion: boolean) {
    const id = row.id;
    const original = this.registros.find(r => r.id === id);

    if (!original) {
      console.warn(`Row with id ${id} not found in registros`);
      return;
    }
    const oldValue = original[col];

    if (col === "id_registro" || (col == "no_identificacion" && !isObservacion)) {
      const duplicate = this.registros.find(r => r[col] === value && r.id !== id);
      if (duplicate) {
        row[col] = oldValue;
        Swal.fire({
          icon: 'error',
          title: 'Valor duplicado',
          text: `El valor "${value}" para ${col} ya está en uso en otro registro.`,
        });
        return;
      }
    }

    const existingIndex = this.changes.findIndex(c => c.id === id && c.column === col);

    if (oldValue !== value) {
      if (existingIndex > -1) {
        this.changes[existingIndex].value = value;
      } else {
        const id_registro = original.id_registro
        this.changes.push({ id, id_registro, column: col, oldValue, value, isObservacion });
      }
    } else {
      if (existingIndex > -1) {
        this.changes.splice(existingIndex, 1);
      }
    }
    if (col == "id_registro" || (col == "no_identificacion" && !isObservacion)) {
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: `Ha modificado un campo crítico (ID de registro o Número de identificación).
              Verifique que el cambio es correcto, ya que podría afectar la integridad de los datos.`,
      });
    }
  }

  isRowChanged(id: number, col: string): boolean {
    return this.changes.some(c => c.id == id && c.column == col);
  }

  guardarCambios() {
    if (this.changes.length == 0) return;

    const groupedChanges = [];
    for (const change of this.changes) {
      let registroGroup = groupedChanges.find(r => r.id_registro === change.id_registro);
      if (!registroGroup) {
        registroGroup = {
          id_registro: change.id_registro,
          id: change.id,
          isObservacion: change.isObservacion,
          changes: []
        };
        groupedChanges.push(registroGroup);
      }
      registroGroup.changes.push({
        column: change.isObservacion && change.column == "no_identificacion" ? "descripcion" : change.column,
        oldValue: change.oldValue,
        value: change.value
      });
    }

    groupedChanges.sort((a, b) => b.id_registro.localeCompare(a.id_registro));
    
    const dialogRef = this.dialog.open(RegistroSuperAdminDialogComponent, {
      width: '80vw', // Adjust the width as needed
      data: { changes: groupedChanges, ubicaciones: this.ubicaciones, modos: this.modosAdquisiciones }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        Swal.fire({
          title: '¿Está seguro de que desea confirmar los cambios realizados?',
          text: 'Esta acción no se puede deshacer.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, continuar',
          cancelButtonText: 'Cancelar',
          reverseButtons: true
        }).then((result) => {
          if (result.isConfirmed) {
            if (this.changes.find(g =>  (g.column == "no_identificacion" && !g.isObservacion) || g.column == "id_registro")) {
              Swal.fire({
                title: 'Atención especial',
                text: 'Se han modificado campos críticos (ID de registro o Número de identificación). Confirme únicamente si está absolutamente seguro de que estos cambios son correctos.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, continuar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true
              }).then((result) => {
                if (result.isConfirmed) {
                  this.guardarEnDB(groupedChanges);
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                  console.log('Cancelado');
                }
              });
            } else {
              this.guardarEnDB(groupedChanges);
            }
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            console.log('Cancelado');
          }
        });
      }
    });
  }

  guardarEnDB(groupedChanges: any) {
    this.gService.create('registros/guardar-cambios/', groupedChanges)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: `Cambios realiados correctamente`,
        });
        this.resetData()
      },    
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador. ${error}`,
        });
      }
    });
  }

  resetData() {
    this.loadRegistros();
    this.loadUbicaciones();
    this.loadModosAdquisicion();
    this.changes = [];
  }



  

  filterUbicacion(value: string) {
    this.filteredUbicaciones = this.ubicaciones.filter(u => u.nombre_oficial.toLowerCase().includes(value.toLowerCase()));
  }
  displayUbicacion = (id: number): string => {
    if (!id) return '';
    const ubic = this.ubicaciones.find(u => u.id === id);
    return ubic ? ubic.nombre_oficial : '';
  };
  validateUbicacionInput(row: any, col: any) {
    const selected = this.ubicaciones.find(u => u.id.toString().includes(row[col].toString().toLowerCase()));
    
    if (!selected) {
      const defaultValue = this.registros.find(r => r.id == row.id);
      row.ubicacion_original = defaultValue.ubicacion_original;
      row.ubicacion_original__nombre_oficial = defaultValue.ubicacion_original__nombre_oficial;
      this.filterUbicacion("");
    }

    this.updateChanges(row, col, row[col], row.isObservacion)
  }
  onUbicacionBlur(row: any, col: any) {
    setTimeout(() => {
      this.validateUbicacionInput(row, col);
    }, 200);
  }

  filterModo(value: string) {
    this.filteredModos = this.modosAdquisiciones.filter(u => u.descripcion.toLowerCase().includes(value.toString().toLowerCase()));
  }
  displayModo = (id: number): string => {
    if (!id) return '';
    const modo = this.modosAdquisiciones.find(u => u.id === id);
    return modo ? modo.descripcion : '';
  };
  validateModoInput(row: any, col: any) {
    const selected = this.modosAdquisiciones.find(u => u.id.toString().includes(row[col].toString().toLowerCase()));

    if (!selected) {
      const defaultValue = this.registros.find(r => r.id == row.id);
      row.modo_adquisicion = defaultValue.modo_adquisicion;
      row.modo_adquisicion__descripcion = defaultValue.modo_adquisicion__descripcion;
      this.filterModo("");
    }

    this.updateChanges(row, col, row[col], row.isObservacion)
  }
  onModoBlur(row: any, col: any) {
    setTimeout(() => {
      this.validateModoInput(row, col);
    }, 200);
  }

}
