import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
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
  ubicacion_original_alias: string;
  ubicacion_actual_alias: string;
  modo_adquisicion_desc: string;
  precio: string;
  conectividad: string;
  seguridad: string;
  placa_impresa: string;
  de_baja: string;
  creado_el: string;
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

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  datos:any;
  destroy$:Subject<boolean>=new Subject<boolean>();
  baseUrl: string = environment.apiURL;

  totalItems: number;

  pageSizeOptions: number[] = [10, 25, 40, 100];
  loading = false; // Add a loading state flag

  filtros: FormGroup;



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
        ubicacion_original_alias: true,
        ubicacion_actual_alias: false,
        modo_adquisicion_desc: false,
        precio: false,
        conectividad: false,
        seguridad: false,
        placa_impresa: false,
        de_baja: false,
        creado_el: false,
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
      this.filtros.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.updateDisplayedColumns();
        this.displayMessage = true;
      });
    }

    ngAfterViewInit() {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }

    ngOnDestroy(): void {

      this.destroy$.complete();
    }

    updateDisplayedColumns(): void {
      this.displayedColumns = Object.keys(this.filtros.value).filter(key => this.filtros.value[key]);
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
            this.dataSource.data = data;
            this.totalItems = data.length;
            this.updatePageSizeOptions();
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

    updatePageSizeOptions() {
      this.pageSizeOptions = [10, 25, 40, 100, this.totalItems];
    }

    applyFilter(event: Event) {
      const filterValue = (event.target as HTMLInputElement).value;
      this.dataSource.filter = filterValue.trim().toLowerCase();
      
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }

    verDetalles(id: string): void {
      this.router.navigate(['activos/', id]);
    }

    

  
}
