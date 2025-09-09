import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
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
import {MatRadioModule} from '@angular/material/radio';

import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { RevisionAdminDialogComponent } from '../revision-admin-dialog/revision-admin-dialog.component';

@Component({
  selector: 'app-revision-admin',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,
    CommonModule, MatRadioModule, MatCardModule, RouterLink,
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule, FormsModule, ReactiveFormsModule
  ],
  templateUrl: './revision-admin.component.html',
  styleUrl: './revision-admin.component.scss'
})
export class RevisionAdminComponent {
  public isLoadingResults = false;

  datos: any;
  destroy$: Subject<boolean>=new Subject<boolean>();
  baseUrl: string = environment.apiURL;

  activos: any[] = [];

  cantActivos: number = 10;

  constructor(
    private gService:GenericService,
    private fb: FormBuilder,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog
  ){

  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.destroy$.complete();
  }

  generarActivos() {
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
    this.gService.list(`activo/aleatorio/${this.cantActivos}/`)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        this.activos = data;

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
  
  elegirActivos(){
    const dialogRef = this.dialog.open(RevisionAdminDialogComponent, {
      width: '600px', // Adjust the width as needed
      data: { cantActivos: this.cantActivos }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.activos = result;
      }
    });
  }

  updateEncontrado(activo: any, encontrado: boolean) {
    activo.encontrado = encontrado;
  }

  get trueCount(): number {
    return this.activos.filter(item => item.encontrado == true).length;
  }

  get falseCount(): number {
    return this.activos.filter(item => item.encontrado == false).length;
  }

  get pendingCount(): number {
    return this.activos.filter(item => item.encontrado != true && item.encontrado != false).length;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    this.activos = this.datos.filter(item =>
      Object.values(item).some(value =>
        value.toString().toLowerCase().includes(filterValue)
      )
    );
  }

  confirmarRevision() {
    this.gService.create('create-observacion-revision/', this.activos)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Se han agregado las anotaciones correctamente.',
        });

        this.activos = [];
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador.',
        });
      }
    });
  }
}