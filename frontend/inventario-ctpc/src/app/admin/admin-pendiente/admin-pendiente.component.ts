import { Component } from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Subject, filter, firstValueFrom, takeUntil } from 'rxjs';
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
import { AuthService } from '../../share/auth.service';

@Component({
  selector: 'app-admin-pendiente',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,
    CommonModule, RouterLink,
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule, MatTooltip, FormsModule, ReactiveFormsModule
  ],
  templateUrl: './admin-pendiente.component.html',
  styleUrl: './admin-pendiente.component.scss'
})
export class AdminPendienteComponent {
  displayedColumns: string[] = ['usuario_nombre', 'descripcion', 'creado_en', 'acciones'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();
  public isLoadingResults = false;


  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  datos:any;
  destroy$:Subject<boolean>=new Subject<boolean>();
  baseUrl: string = environment.apiURL;

  totalItems: number;

  pageSizeOptions: number[] = [10, 25, 40, 100];

  currentUserId: any;

  historial: boolean = false;

  ubicaciones: any;
  modosAdquisiciones: any;

  constructor(
    private gService:GenericService,
    private authService:AuthService,
    private fb: FormBuilder,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer
  ){
    this.getPendientes()
  }

  ngOnInit() {
    this.authService.getCurrentUser$().subscribe(userId => {
      this.currentUserId = userId;
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {

    this.destroy$.complete();
  }

  getPendientes(){
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
    this.gService.list('all-pendientes/')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          if (!this.historial) {
            this.displayedColumns = ['usuario_nombre', 'descripcion', 'creado_en', 'acciones'];
            this.datos = data.filter(d => d.aprovado == null);
          } else {
            this.displayedColumns = ['usuario_nombre', 'descripcion', 'creado_en', 'estado'];
            this.datos = data.filter(d => d.aprovado != null);
          }
          this.dataSource.data = this.datos;

          this.loadUbicaciones();

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
          
          this.loadModosAdquisicion();

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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  verDetalles(data: any): void {
    Swal.fire({
      title: 'Datos',
      html: this.getHTML(data),
    });
  }

  getHTML(data: any) {
    
    // ✅ Ensure data is always an array
    const list = Array.isArray(data) ? data : [data];

    // ✅ Build styled HTML content
    let html = `
      <div style="font-family: 'Segoe UI', sans-serif; font-size: 14px; text-align: left;">
    `;

    list.forEach((row, index) => {
      console.log(row)
      html += `
        <div style="
          margin-bottom: 12px;
          padding: 10px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: #f9f9f9;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        ">
          <div style="font-size: 20px; font-weight: 600; color: #333; margin-bottom: 6px;">
            Activo ${row.no_identificacion}
          </div>
      `;

      for (const [key, value] of Object.entries(row)) {
        let displayValue;

        // If it's an array (list)
        if (Array.isArray(value)) {
          // If array of objects with 'no_identificacion'
          if (value.length && typeof value[0] === 'object' && 'no_identificacion' in value[0]) {
            displayValue = value
              .map((item: any) => item.no_identificacion ?? '')
              .filter(v => v)
              .join(', ');
          } else {
            // Otherwise, join simple values
            displayValue = value.join(', ');
          }
        }
        // If it's an object (not array)
        else if (typeof value === 'object' && value !== null) {
          // If the object itself has no_identificacion
          if ('no_identificacion' in value) {
            displayValue = value.no_identificacion;
          } else {
            // Convert object to readable string
            displayValue = JSON.stringify(value, null, 2);
          }
        }
        // Otherwise, primitive
        else {
          displayValue = value;

          // 👇 Replace IDs with descriptions
          if (key === 'ubicacion_actual') {
            const ubic = this.ubicaciones.find((u: any) => u.id === value);
            if (ubic) displayValue = `${ubic.alias}`;
          }

          if (key === 'modo_adquisicion') {
            const modo = this.modosAdquisiciones.find((m: any) => m.id === value);
            if (modo) displayValue = `${modo.descripcion}`;
          }
        }
        if (key != 'ubicacion_anterior_id' && key != 'no_identificacion') {
          html += `
            <div style="padding: 2px 0;">
              <strong style="color:#555;">${key}:</strong>
              <span style="color:#222; margin-left: 4px;">${displayValue}</span>
            </div>
          `;
        }
      }

      html += `</div>`;
    });

    html += `</div>`;

    return html;
  }

  setHistorial() {
    this.historial = !this.historial;

    this.getPendientes();
  }

  aprovar(row: any, aprovado: boolean, event?: MouseEvent): void {
    if (event) event.stopPropagation(); // ✅ Prevents row click from firing
  
    row.aprovar = aprovado;
    row.aprovado_por_id = this.currentUserId;

    console.log()
    if (aprovado) {
      Swal.fire({
        title: '¿Aprobar pendiente?',
        html: this.getHTML(row.data),
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
        cancelButtonColor: '#d33',
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          // Only send patch if confirmed
          this.gService.patch(`aprovar-pendiente/${row.id}/`, row)
            .subscribe({
              next: async (res) => {
                if (aprovado) {
                  await firstValueFrom(this.gService.postRequest(row));
                }
                Swal.fire('Aprobado', 'El pendiente fue aprobado correctamente.', 'success');
                this.getPendientes();
              },
              error: (err) => {
                Swal.fire('Error', 'No se pudo aprobar el pendiente.', 'error');
                console.error(err);
              }
            });
        }
      });
    } else {
      this.gService.patch(`aprovar-pendiente/${row.id}/`, row)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (data: any) => {
          let title = 'Rechazado';
          if (aprovado) {
            await firstValueFrom(this.gService.postRequest(row));
            title = 'Aprobado'
          }
          
          Swal.fire({
            icon: 'success',
            title: title,
            text: `Cambio ${title} correctamente.`,
          });
          this.getPendientes();
        },
        error: () => {
          this.isLoadingResults = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un error al marcar el documento como impreso. Por favor intente nuevamente.',
          });
        }
      });
    }
  }
}