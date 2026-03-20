import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatButtonModule} from '@angular/material/button';
import {MatCardActions, MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule, FormBuilder, ReactiveFormsModule, FormGroup} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatDividerModule} from '@angular/material/divider';
import {MatSliderModule} from '@angular/material/slider';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatMenuModule} from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient} from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import {AfterViewInit, ViewChild} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import {JsonPipe} from '@angular/common';
import { BooleanToYesNoPipe } from '../../share/boolean-to-yes-no.pipe';

import Swal from 'sweetalert2';

export interface ActivoData {
  id_registro: string;
  no_identificacion: string;
  descripcion: string;
  marca: string;
  modelo: string;
  serie: string;
  serie_modificado: string;
  estado: string;
  ubicacion_original: any;
  ubicacion_actual: any;
  modo_adquisicion: any;
  precio: string;
  conectividad: string;
  seguridad: string;
  placa: string;
  baja: string;
  fecha: string;
}

@Component({
  selector: 'app-activo-index',
  standalone: true,
  imports: [MatGridListModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,MatDividerModule,
    MatCheckboxModule,
    MatSliderModule,
    MatMenuModule,
    CommonModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule, MatTooltip, FormsModule, ReactiveFormsModule, BooleanToYesNoPipe
  ],
  templateUrl: './activo-index.component.html',
  styleUrl: './activo-index.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivoIndexComponent implements AfterViewInit  {
  displayedColumns: string[] = ['id_registro', 'no_identificacion', 'descripcion', 'ubicacion'];
  dataSource: MatTableDataSource<ActivoData> = new MatTableDataSource<ActivoData>();
  public isLoadingResults = false;

  displayMessage: boolean = false;
  filterValue: any;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  @ViewChild('input') input: ElementRef;

  datos: any;
  destroy$: Subject<boolean> = new Subject<boolean>();
  baseUrl: string = environment.apiURL;

  observaciones: any[] = [];

  totalItems: number;

  pageSizeOptions: number[] = [10, 25, 40, 100];
  loading = false;

  filtros: FormGroup;
  ubicaciones: any;

  constructor(private gService:GenericService,
    private fb: FormBuilder,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ){
    this.filtros = this.fb.group({
      id_registro: false,
      no_identificacion: true,
      descripcion: true,
      marca: true,
      modelo: true,
      serie: true,
      estado: false,
      ubicacion_original: true,
      ubicacion_actual: true,
      modo_adquisicion: false,
      precio: false,
      conectividad: false,
      seguridad: false,
      placa: false,
      baja: false,
      fecha: false
    });

    // Load cached filters if available
    const cachedFilters = JSON.parse(localStorage.getItem('selectedColumns') || '{}');
    if (Object.keys(cachedFilters).length) {
      this.filtros.patchValue(cachedFilters);
    }
    //this.moverObservaciones()
    this.loadActivos(); 
    this.updateDisplayedColumns();
  }

  ngOnInit(): void {
    this.filtros.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.displayMessage = true;
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'ubicacion_original':
          return item.ubicacion_original?.nombre_oficial || '';
        case 'ubicacion_actual':
          return item.ubicacion_actual?.nombre_oficial || '';
        case 'modo_adquisicion':
          return item.modo_adquisicion?.descripcion || '';
        default:
          return item[property];
      }
    };

    if (localStorage.getItem('lastSearch')) {
      this.input.nativeElement.value = localStorage.getItem('lastSearch');
      this.applyFilter(null,localStorage.getItem('lastSearch'));
    } else{
      this.input.nativeElement.value = null;
    }
  }

  ngOnDestroy(): void {
    if (this.filterValue) { 
      localStorage.setItem('lastSearch', this.filterValue);
    } else {
      localStorage.setItem('lastSearch', '');
    }
    this.destroy$.complete();
  }
    
  moverObservaciones(): void {
    this.gService.list('mover-observaciones/')
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any[]) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: `${data}`,
        });
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `${error}`,
        });
      }
    });
  }

  updateDisplayedColumns(): void {
    this.displayedColumns = Object.keys(this.filtros.value).filter(key => this.filtros.value[key]);
  }
  
  loadActivos(){
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

    const selectedColumns = Object.keys(this.filtros.value)
      .filter(key => this.filtros.value[key]);

    if (!selectedColumns.includes('has_observaciones')) {
      selectedColumns.push('has_observaciones');
    }
    const formData = { fields: selectedColumns, observaciones: true };

    // Save selected columns to cache
    localStorage.setItem('selectedColumns', JSON.stringify(this.filtros.value));

    // Make the request
    this.gService.create('activos/select-columns/', formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.datos = data;
          
          for (let element of this.datos) {
            element.class = this.getRowClass(element);
          }
        
          this.displayMessage = true;
          this.dataSource.data = this.datos;
          this.totalItems = data.length;
          this.updatePageSizeOptions();
          this.updateDisplayedColumns();

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

  getRowClass(row: any): string {
    this.isLoadingResults = true;
    if (row.baja == 'DADO DE BAJA CON PLACA' || row.baja == 'DADO DE BAJA SIN PLACA') {
      return 'row-red';
    } else if (row.baja == 'A DAR DE BAJA') {
      return 'row-orange';
    } else if (row.has_observaciones) {
      return 'row-yellow';
    }
    return '';
  }

  updatePageSizeOptions() {
    this.pageSizeOptions = [10, 25, 40, 100, this.totalItems];
  }

  applyFilter(event: Event, flag: string) {
    if (flag) {
      this.filterValue = flag;
    } else { 
      this.filterValue = (event.target as HTMLInputElement).value;
    }
    
    this.dataSource.filter = this.filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onMiddleClick(event: MouseEvent, id: Number): void {
    if (event.button === 1) {  // Middle-click detection
      event.preventDefault();  // Prevent default behavior (scrolling)
      const url = new URL(`activos/${id}`, document.baseURI).toString();
      window.open(url, '_blank');
    }
  }

  verDetalles(id: Number): void {
    this.router.navigate(['activos/', id]);
  }
}
/*
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
        this.updateDisplayedColumns();
        this.ubicaciones = data;

        // Match ubicacion fields and attach aliases for both original and actual ubicaciones
        this.datos.forEach((element: any) => {
          const ubicacionOriginal = this.ubicaciones.find(
            (ubi: any) => ubi.nombre_oficial === element.ubicacion_original.nombre_oficial
          );
          const ubicacionActual = this.ubicaciones.find(
            (ubi: any) => ubi.nombre_oficial === element.ubicacion_actual.nombre_oficial
          );

          // Assign aliasOriginal and aliasActual if found
          element.aliasOriginal = ubicacionOriginal?.alias || null;
          element.aliasActual = ubicacionActual?.alias || null;
        });

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
*/
