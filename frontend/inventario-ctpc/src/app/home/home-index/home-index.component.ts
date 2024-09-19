import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatCardModule} from '@angular/material/card';
import { FormBuilder, FormGroup } from '@angular/forms';
import { GenericService } from '../../share/generic.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { Subject, takeUntil } from 'rxjs';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-home-index',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatDividerModule, MatButtonModule,NgClass],
  templateUrl: './home-index.component.html',
  styleUrl: './home-index.component.scss'
})
export class HomeIndexComponent {

  filtros: FormGroup;
  datos: any;
  isLoadingResults: any;
  destroy$:Subject<boolean>=new Subject<boolean>();
  placas: any;
  actas: any;
  excels: any;

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
        marca: false,
        modelo: false,
        serie: false,
        estado: false,
        impreso: true,
        ubicacion_original_nombre_oficial: false,
        ubicacion_actual_nombre_oficial: false,
        modo_adquisicion_desc: false,
        precio: false,
        conectividad: false,
        seguridad: false,
        placa: true,
        baja: false,
        fecha: false,
      });

      this.loadActivos();
      this.loadDocs();

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
            this.datos = data;
            // Count the number of items where datos.placa is false
            this.placas = this.datos.filter((item: any) => item.placa==0).length;
            this.excels = this.datos.filter((item: any) => item.impreso==0).length;
            console.log(this.excels)
            this.excels = Math.floor(this.excels/40)
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

    loadDocs() {
      this.isLoadingResults = true;
  
      const loadingTimeout = setTimeout(() => {
        if (this.isLoadingResults) {
          Swal.fire({
            icon: 'error',
            title: 'Hay problemas...',
            text: 'La carga de datos está durando más de lo esperado... Por favor intente nuevamente',
          });
        }
      }, 15000);
  
      this.gService.list('obtener-documentos/')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: any) => {
            this.datos = data;
            console.log(this.datos)
            this.isLoadingResults = false;
            clearTimeout(loadingTimeout);
            this.actas = this.datos.filter((item: any) => !item.impreso).length;
          },
          error: () => {
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

    getColorClass(): string {
      if (this.excels < 2) {
        return 'green';
      } else if (this.excels < 15) {
        return 'orange';
      } else {
        return 'red';
      }
    }

  
    

   
}
