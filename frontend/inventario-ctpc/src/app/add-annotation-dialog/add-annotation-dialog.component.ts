import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';
import { GenericService } from '../share/generic.service';
import { Subject, filter, takeUntil, forkJoin, from, concatMap } from 'rxjs';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';

import {MatDividerModule} from '@angular/material/divider';
import {MatSliderModule} from '@angular/material/slider';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatMenuModule} from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient} from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';
import {AfterViewInit, ViewChild} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { DialogRef } from '@angular/cdk/dialog';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-add-annotation-dialog',
  standalone: true,
  imports: [MatSelectModule, MatInputModule, MatFormFieldModule,FormsModule, ReactiveFormsModule,

    MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,MatDividerModule,
    MatCheckboxModule,
    MatSliderModule,
    MatMenuModule,MatDialogModule,
    RouterLink, MatSelectModule,
    CommonModule,ReactiveFormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule, MatTooltip
  ],
  templateUrl: './add-annotation-dialog.component.html',
  styleUrl: './add-annotation-dialog.component.scss'
})
export class AddAnnotationDialogComponent {
  myForm: FormGroup;
  filtros: FormGroup;
  activoIdRegistro: any;
  currentActivo: any;
  activoId:any;
  datosActivos: any; // This should be populated with the actual data
  activosACrear: any[] = [];
  public isLoadingResults = false;
  destroy$:Subject<boolean>=new Subject<boolean>();
  activosEnLista:any;
  listaActi:any[] = [];;

  
  constructor(
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
    private gService:GenericService,
    public dialogRef: MatDialogRef<AddAnnotationDialogComponent>,
    private toast: HotToastService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.myForm = this.fb.group({
      descripcion: [null, Validators.required],
      no_identificacion: [null ,Validators.required]
    });

    this.activoIdRegistro = data.activoIdRegistro;
    this.activoId = data.activoId;
    console.log(this.activoIdRegistro)
    this.filtros = this.fb.group({
      id_registro: true,
      no_identificacion: true,
      descripcion: true,
      marca: false,
      modelo: false,
      serie: false,
      estado: false,
      ubicacion_original_alias: true,
      ubicacion_actual_alias: false,
      modo_adquisicion_desc: false,
      precio: false,
      conectividad: false,
      seguridad: false,
      placa: false,
      baja: false,
      fecha: false,
    });
    this.loadActivos();
    
  }

  ngOnInit() {
    this.activosACrear.push(this.activoIdRegistro); // Add the default activo to the array
    this.listaActi.push(this.activoId);
    this.activosList();
  }

  activosList(): void {
    this.activosEnLista= this.listaActi.map(activo => activo).join(', '); 
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

    const formData = { fields: selectedColumns };


    // Make the request
    this.gService.create('activos/select-columns/', formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          console.log(data);
          
          // Count the number of items where datos.placa is false
          this.datosActivos = data;
     
          console.log(this.datosActivos);
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

  agregarActivo(){
    const selectedActivo = this.myForm.value.no_identificacion.id_registro;

    // Prevent duplicates and the initially passed activoIdRegistro
    if (selectedActivo && selectedActivo !== this.activoIdRegistro && !this.activosACrear.includes(selectedActivo)) {
      this.activosACrear.push(selectedActivo);
      this.listaActi.push(this.myForm.value.no_identificacion.no_identificacion);
      this.toast.success(`Activo ${this.myForm.value.no_identificacion.no_identificacion} seleccionado correctamente`, {
        dismissible: true,
        duration: 4000,  // 3 seconds
        position: 'top-right',  // position of the toast
        style: {
          border: '1px solid #28a745', // Add a green border
          // padding: '16px',
          color: '#28a745',
          background: '#f0fdf4' // Light green background
        },
        iconTheme: {
          primary: '#28a745',
          secondary: '#FFFAEE',
        },
      });
      console.log(this.activosACrear);
    } else {

      this.toast.warning(`El activo ${this.myForm.value.no_identificacion.no_identificacion} ya ha sido seleccionado`, {
        duration: 4000,
        position: 'top-right',
        style: {
          border: '1px solid #ffc107',
          color: '#856404',
          background: '#fff3cd'
        },
        dismissible: true,
      });
    }
   
    this.activosList()

  }

  async onSubmit() {
    if (this.myForm.valid) {
      let descripcion = this.myForm.value.descripcion;

      // Ensure the description ends with a period
      if (descripcion.charAt(descripcion.length - 1) !== '.') {
          descripcion += '.';
      }

      const splitDescripcion = (text: string, chunkSize: number) => {
          const chunks = [];
          let start = 0;

          while (start < text.length) {
              let end = start + chunkSize;
              if (end >= text.length) {
                  chunks.push(text.slice(start));
                  break;
              }
              if (text.charAt(end) !== ' ' && text.charAt(end) !== '.') {
                  let spaceIndex = text.lastIndexOf(' ', end);
                  if (spaceIndex > start) {
                      end = spaceIndex;
                  }
              }
              chunks.push(text.slice(start, end));
              start = end + 1;
          }
          return chunks;
      };

      const chunks = splitDescripcion(descripcion, 98);
      let exitosos = 0;

      for (const activoId of this.activosACrear) {
          try {
              for (const chunk of chunks) {
                  const formData = new FormData();
                  formData.append('descripcion', chunk);
                  formData.append('activo', activoId);

                  console.log("Data to send:", formData);

                  const data = await firstValueFrom(this.gService.create('nueva-observacion/', formData));
                  console.log(`Observation for activo ${activoId} created:`, data);
              }
              exitosos++;
          } catch (error) {
              Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: `Hubo un error de servidor al crear la observación para el activo ${activoId}, por favor intente otra vez o contacte a su administrador si el problema persiste.`,
              });
              return;
          }
      }

      if (exitosos === this.activosACrear.length) {
          this.myForm.reset();
          Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: 'Se han agregado las anotaciones correctamente.',
          });
      } else {
          Swal.fire({
              icon: 'warning',
              title: 'Parcialmente exitoso',
              text: `Se han creado anotaciones para ${exitosos} del total de ${this.activosACrear.length} activos correctamente. Por favor revise y agregue las faltantes nuevamente.`,
          });
      }
  }
  }

}
