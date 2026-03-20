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
import { MatSelectModule } from '@angular/material/select';

export interface CierreData {
  id: string;
  tipo_revision: string;
  fecha: string;
  finalizado: string;
  funcionario: string;
  aula: string;
}

@Component({
  selector: 'app-cierre-reporte',
  standalone: true,
  imports: [MatGridListModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,MatDividerModule,
    MatCheckboxModule, MatSelectModule,
    MatSliderModule,
    MatMenuModule,
    RouterLink, 
    CommonModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule, MatTooltip, FormsModule, ReactiveFormsModule, JsonPipe, BooleanToYesNoPipe
  ],
  templateUrl: './cierre-reporte.component.html',
  styleUrl: './cierre-reporte.component.scss'
})
export class CierreReporteComponent {
  destroy$:Subject<boolean>=new Subject<boolean>();
  baseUrl: string = environment.apiURL;

  displayedColumns: string[] = ['ubicacion_nombre', 'funcionario_nombre', 'fecha', 'finalizado'];
  dataSource: MatTableDataSource<CierreData> = new MatTableDataSource<CierreData>();
  public isLoadingResults = false;

  displayMessage: boolean = false;
  filterValue: any;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  datos:any;
  fechaCierres: any[] = [];
  cierres: any[] = [];

  observaciones: any[] = []; // Store all observaciones

  totalItems: number;

  selected: any;

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
    this.loadcierres();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
    
  loadcierres(): void {
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
  
    this.gService.list('cierres/finalizado')
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any[]) => {
        this.fechaCierres = [...new Map(
            data.map(item => {
                const fecha = item.fecha.split("-")[0]; // Extract year from date
                return [`${fecha}-${item.tipo_revision}`, { fecha, tipo: item.tipo_revision }];
            })
        ).values()];
        this.fechaCierres.sort((a, b) => {
          if (b.fecha !== a.fecha) {
              return b.fecha - a.fecha; // Sort by year descending
          }
          return a.tipo === "PRINCIPIO" ? 1 : -1; // Sort PRINCIPIO before MEDIO
        });
        this.selected = this.fechaCierres[0];
        this.applyFilter(this.selected);

        this.dataSource.data = data;

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

  verDetalles(id: string): void {
    this.router.navigate(['cierre/reporte/', id]);
  }

  onMiddleClick(event: MouseEvent, id: string): void {
    if (event.button === 1) {  // Middle-click detection
      event.preventDefault();  // Prevent default behavior (scrolling)
      const url = new URL(`cierre/reporte/${id}`, document.baseURI).toString();
      window.open(url, '_blank'); // Open the page in a new tab
    }
  }

  applyFilter(filtro: any) {
    const fechaFiltro = filtro?.fecha || '';  // Extract the year from JSON, default to empty if not provided
    const tipoFiltro = filtro?.tipo ? filtro.tipo.toLowerCase() : '';

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      if (!fechaFiltro && !tipoFiltro) {
        return true; 
      }

      const fecha = new Date(data.fecha).getFullYear().toString();
      
      const tipo = data.tipo_revision.toLowerCase();
  
      return fecha === filtro.fecha && tipo.includes(filtro.tipo.toLowerCase());
    };
    this.dataSource.filter = Math.random().toString();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
