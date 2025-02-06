import { Component } from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient} from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import {MatButtonModule} from '@angular/material/button';
import {MatCardActions, MatCardModule} from '@angular/material/card';
import {AfterViewInit, ViewChild} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule, FormBuilder, ReactiveFormsModule, FormGroup} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';

import Swal from 'sweetalert2';

export interface ActivoData {
  descripcion: string;
  marca: string;
  modelo: string;
  placa: string;
}

@Component({
  selector: 'app-cierre-nuevo',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,
    CommonModule, RouterLink,
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule, MatTooltip, FormsModule, ReactiveFormsModule
  ],
  templateUrl: './cierre-nuevo.component.html',
  styleUrl: './cierre-nuevo.component.scss'
})
export class CierreNuevoComponent {
  displayedColumns: string[] = ['descripcion', 'marca', 'modelo', 'placa', ];
  dataSource: MatTableDataSource<ActivoData> = new MatTableDataSource<ActivoData>();
  public isLoadingResults = false;


  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  datos:any;
  destroy$:Subject<boolean>=new Subject<boolean>();
  baseUrl: string = environment.apiURL;

  funcionarioId: number;
  ubicacionId: number;
  datosUbi: any;

  totalItems: number;

  pageSizeOptions: number[] = [10, 25, 40, 100];

  constructor(
    private gService:GenericService,
    private fb: FormBuilder,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer
  ){

  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.funcionarioId = params['funcionarioId'];
      this.ubicacionId = params['ubicacionId'];

      this.getUbicacion()
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.complete();
  }

  getUbicacion() {
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
    
    this.gService.list(`ubicacion/${this.ubicacionId}/`)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any[]) => {
        this.datosUbi = data;

        this.getActivos();
        
        this.isLoadingResults = false;
        clearTimeout(loadingTimeout);
      },
      error: (error) => {
        this.isLoadingResults = false;
        clearTimeout(loadingTimeout);

        if (!error.message.includes(`404 Not Found`)) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador. Error: 4. ${error}`,
          });
        }
      }
    });
  }

  getActivos(){
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

    const selectedColumns = ['id_registro', 'no_identificacion', 'descripcion', 'marca', 'modelo', 'placa', 'ubicacion_actual_nombre_oficial']

    const formData = { fields: selectedColumns };


    // Make the request
    this.gService.create('activos/select-columns/', formData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        this.datos = data;
        this.datos.filter(a => a.ubicacion_actual_nombre_oficial == this.datosUbi.nombre_oficial);

        console.log(this.datos);
        this.isLoadingResults = false; // Stop loading
        clearTimeout(loadingTimeout); // Clear the timeout if loading is finished

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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  verDetalles(id: string): void {
    this.router.navigate(['usuarios/', id]);
  }
}
