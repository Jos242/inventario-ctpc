import {AfterViewInit, Component, ViewChild,  ElementRef, Renderer2, ViewChildren, QueryList, ChangeDetectorRef} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatRippleModule} from '@angular/material/core';
import {MatTabsModule} from '@angular/material/tabs';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { concatMap, firstValueFrom, from, Subject, takeUntil, timeout } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../share/auth.service';
import { BooleanToYesNoPipe } from '../../share/boolean-to-yes-no.pipe';
import {ChangeDetectionStrategy} from '@angular/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {provideNativeDateAdapter} from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { HotToastService } from '@ngxpert/hot-toast';

import Swal from 'sweetalert2';

import 'moment/locale/es';
import { MatCheckbox } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { ConfirmationService } from '../../share/confirmation.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-activo-excel',
  standalone: true,
  imports: [
    MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatRippleModule, MatTabsModule, MatGridListModule, MatCardModule,
    ReactiveFormsModule, MatButtonModule, MatSelectModule, CommonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatProgressSpinnerModule,
    MatCheckbox, MatIconModule, MatRippleModule, MatTooltipModule, FormsModule, RouterLink],
  templateUrl: './activo-excel.component.html',
  styleUrl: './activo-excel.component.scss'
})
export class ActivoExcelComponent {
  destroy$: Subject<boolean> = new Subject<boolean>();

  datos: any;

  filtroIgual: boolean = true;
  filtroDiferente: boolean = true;
  filtroNoEncontrado: boolean = true;

  isLoadingResults: any;
  displayedColumns: string[] = [
    'id_registro', 'origen', 'no_identificacion',
    'descripcion', 'marca', 'modelo', 'serie', 'estado',
    'ubicacion_original', 'precio'
  ];
  observacionColumns: string[] = [
    'id_registro', 'origen', 'no_identificacion'
  ];
  isObservacionRow = (row: any) => row.observacion;
  isNormalRow = (row: any) => !row.observacion;
  
  pageSizeOptions: number[] = [10, 25, 40, 100];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  constructor(
    private gService: GenericService
  ) {

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'id_registro':
          return item.excel.id_registro;
        case 'no_identificacion':
          return item.excel.no_identificacion;
        case 'descripcion':
          return item.excel.descripcion;
        case 'marca':
          return item.excel.marca;
        case 'modelo':
          return item.excel.modelo;
        case 'serie':
          return item.excel.serie;
        case 'estado':
          return item.excel.estado;
        case 'ubicacion_original':
          return item.excel.ubicacion_original;
        case 'precio':
          return item.excel.precio;
        default:
          return item[property];
      }
    };

    this.dataSource.filterPredicate = (data, filter: string): boolean => {
      const transformedFilter = filter.trim().toLowerCase();

      return data.excel.id_registro.toLowerCase().includes(transformedFilter) ||
            (data.excel.no_identificacion && data.excel.no_identificacion.toLowerCase().includes(transformedFilter)) ||
            (data.excel.descripcion && data.excel.descripcion.toLowerCase().includes(transformedFilter)) ||
            (data.excel.marca && data.excel.marca.toLowerCase().includes(transformedFilter)) ||
            (data.excel.modelo && data.excel.modelo.toLowerCase().includes(transformedFilter)) ||
            (data.excel.serie && data.excel.serie.toLowerCase().includes(transformedFilter)) ||
            (data.excel.estado && data.excel.estado.toLowerCase().includes(transformedFilter)) ||
            (data.excel.ubicacion_original && data.excel.ubicacion_original.toLowerCase().includes(transformedFilter)) ||
            (data.excel.precio && data.excel.precio.toLowerCase().includes(transformedFilter));
    };
  }

  onFileSelected(event: any) {
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
    
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      this.gService.create("/activos/excel/", formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {

          data.sort((a, b) => {
            const valA = parseInt((a.excel?.id_registro || '0').replace(/,/g, ''), 10);
            const valB = parseInt((b.excel?.id_registro || '0').replace(/,/g, ''), 10);

            //return valA - valB; // ascending
            return valB - valA; // descending
          });

          this.datos = data;

          this.dataSource.data = data;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
    
          this.isLoadingResults = false; // Stop loading
          clearTimeout(loadingTimeout); // Clear the timeout if loading is finished
        },
        error: (error) => {
          this.isLoadingResults = false; // Stop loading on error
          clearTimeout(loadingTimeout); // Clear the timeout if there's an error
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador. ${error}`,
          });
        }
      });
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  filtrosActivos() {
    console.log(this.datos)
    this.dataSource.data = this.datos.filter(d => {
      let include = false;

      // Only include if matches at least one active filter
      if (this.filtroIgual && d.db != null && d.nel.length === 0) include = true;
      if (this.filtroDiferente && d.nel.length > 0) include = true;
      if (this.filtroNoEncontrado && d.db == null) include = true;

      return include;
    });
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  isMismatch(row: any, value: string) {
    return row.nel.find(n => n == value);
  }

  async onSubmit() {
    
  }
}
