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

export interface RevisionData {
  status: string;
  fecha: Date;
  nota: string;
  cierre_inventario_id: string;
  id_registro: string;
}

@Component({
  selector: 'app-cierre-detail',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,
    CommonModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule, FormsModule, ReactiveFormsModule
  ],
  templateUrl: './cierre-detail.component.html',
  styleUrl: './cierre-detail.component.scss'
})
export class CierreDetailComponent {
  displayedColumns: string[] = ['id_registro', 'no_identificacion', 'descripcion', 'marca', 'modelo', 'status', 'nota'];
  dataSource: MatTableDataSource<RevisionData> = new MatTableDataSource<RevisionData>();
  public isLoadingResults = false;


  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  cierreId: any;
  cierreInventario: any;

  datos: any;
  destroy$:Subject<boolean>=new Subject<boolean>();
  baseUrl: string = environment.apiURL;

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
  

  ngOnInit(){
    this.cierreId = this.route.snapshot.paramMap.get('id');
    this.getRevisionesByCierreId()
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {

    this.destroy$.complete();
  }

  getRevisionesByCierreId(){
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

 

    // Make the request
    this.gService.list(`revision/cierre/${this.cierreId}/`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          console.log(data)
          if (data && data.length > 0 && data[0].cierre_inventario) {
            this.cierreInventario = data[0].cierre_inventario;
          }
          this.datos = data;
          this.dataSource.data = data;
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

  removeCaps(text: string): string {
    if (!text) return ''; 
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
}