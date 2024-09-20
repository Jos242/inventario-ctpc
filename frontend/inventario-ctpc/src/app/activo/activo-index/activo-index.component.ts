import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, ElementRef } from '@angular/core';
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
  estado: string;
  ubicacion_original_nombre_oficial: string;
  ubicacion_actual_nombre_oficial: string;
  modo_adquisicion_desc: string;
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
    RouterLink, 
    CommonModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule, MatTooltip, FormsModule, ReactiveFormsModule, JsonPipe, BooleanToYesNoPipe
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

  datos:any;
  destroy$:Subject<boolean>=new Subject<boolean>();
  baseUrl: string = environment.apiURL;

  observaciones: any[] = []; // Store all observaciones

  totalItems: number;

  pageSizeOptions: number[] = [10, 25, 40, 100];
  loading = false; // Add a loading state flag

  filtros: FormGroup;
  ubicaciones: any;



  constructor(private gService:GenericService,
    private fb: FormBuilder,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer
    ){
      this.filtros = this.fb.group({
        id_registro: false,
        no_identificacion: true,
        descripcion: true,
        marca: true,
        modelo: true,
        serie: false,
        estado: false,
        ubicacion_original_nombre_oficial: true,
        ubicacion_actual_nombre_oficial: false,
        modo_adquisicion_desc: false,
        precio: false,
        conectividad: false,
        seguridad: false,
        placa: false,
        baja: false,
        fecha: false,
      });
  
      // Load cached filters if available
      const cachedFilters = JSON.parse(localStorage.getItem('selectedColumns') || '{}');
      if (Object.keys(cachedFilters).length) {
        this.filtros.patchValue(cachedFilters);
      }

      
      
      this.checks(); 
      // Initialize displayedColumns based on initial filter values
      this.updateDisplayedColumns();
    }

    

    ngOnInit(): void {
       // Fetch observaciones on initialization
      // this.input.nativeElement.value = localStorage.getItem('lastSearch') ? localStorage.getItem('lastSearch') : '';

      
      this.filtros.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.updateDisplayedColumns();
        this.displayMessage = true;
      });
      
    }

    ngAfterViewInit() {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      if(localStorage.getItem('lastSearch')){
        console.log(localStorage.getItem('lastSearch'))
        console.log(this.input)
        this.input.nativeElement.value = localStorage.getItem('lastSearch');
        this.applyFilter(null,localStorage.getItem('lastSearch'))
      }else{
        this.input.nativeElement.value=null;
      }
    }

    ngOnDestroy(): void {
      if(this.filterValue){
        localStorage.setItem('lastSearch', this.filterValue);
      }else{
        localStorage.setItem('lastSearch', '');
      }
      
      this.destroy$.complete();
    }

    updateDisplayedColumns(): void {
      this.displayedColumns = Object.keys(this.filtros.value).filter(key => this.filtros.value[key]);
    }

    fetchObservaciones(): void {
      this.isLoadingResults = true; // Stop loading
      this.gService.list('todas-las-observaciones/')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => {
          this.observaciones = data; // Store all observaciones
          console.log(this.observaciones)
          for(let element of this.datos){
            element.class=this.getRowClass(element);
          }
          this.dataSource.data = this.datos;
            this.totalItems = this.datos.length;
            this.updatePageSizeOptions();
          this.isLoadingResults = false; // Stop loading
        });
      

    }

    hasObservaciones(activoId: string): boolean {
      // Check if activo has observaciones by matching the id_registros
    //  console.log(activoId, "regisgtro que se esta matcheando")
    //  console.log(this.observaciones.some(obs => obs.activo == activoId))
      return this.observaciones.some(obs => obs.activo == activoId);
    }

    getRowClass(row: any): string {
      this.isLoadingResults = true;
      if (  row.baja == 'DADO DE BAJA CON PLACA' || row.baja == 'DADO DE BAJA SIN PLACA') {
        return 'row-red';
      } else if (row.baja == 'A DAR DE BAJA') {
        return 'row-orange';
      } else if (this.hasObservaciones(row.id_registro)) {
        return 'row-yellow';
      }
      return '';
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
            console.log(this.ubicaciones);
    
            // Match ubicacion fields and attach aliases for both original and actual ubicaciones
            this.datos.forEach((element: any) => {
              const ubicacionOriginal = this.ubicaciones.find(
                (ubi: any) => ubi.nombre_oficial === element.ubicacion_original_nombre_oficial
              );
              const ubicacionActual = this.ubicaciones.find(
                (ubi: any) => ubi.nombre_oficial === element.ubicacion_actual_nombre_oficial
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
    
    
    
    
    
    checks(){
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
  
      const formData = { fields: selectedColumns };
  
      // Save selected columns to cache
      localStorage.setItem('selectedColumns', JSON.stringify(this.filtros.value));
  
      // Make the request
      this.gService.create('activos/select-columns/', formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: any) => {
            console.log(data);
            this.datos = data;
            this.fetchObservaciones();
            this.displayMessage = true;
            // data.for(element => {
              
            // });
           
            this.dataSource.data = this.datos;
            this.totalItems = data.length;
            this.updatePageSizeOptions();
            this.isLoadingResults = false; // Stop loading
            clearTimeout(loadingTimeout); // Clear the timeout if loading is finished
            this.displayMessage = false;
            this.loadUbicaciones();
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

    updatePageSizeOptions() {
      this.pageSizeOptions = [10, 25, 40, 100, this.totalItems];
    }

    applyFilter(event: Event, flag: string) {
      if(flag){
        this.filterValue=flag;
      }else{
        this.filterValue = (event.target as HTMLInputElement).value;
      }

      
      this.dataSource.filter = this.filterValue.trim().toLowerCase();
      
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }

    onMiddleClick(event: MouseEvent, no_identificacion: string): void {
      console.log(event)
      if (event.button === 1) {  // Middle-click detection
        console.log(event)
        event.preventDefault();  // Prevent default behavior (scrolling)
        
        // Open the page in a new tab
        // this.router.navigate(['activos/',no_identificacion, '_blank']);
        // this.router.navigate(['activos', no_identificacion]);
        window.open(`/activos/${no_identificacion}`, '_blank');
      }
    }

    verDetalles(id: string): void {
      this.router.navigate(['activos/', id]);
    }

    

  
}
