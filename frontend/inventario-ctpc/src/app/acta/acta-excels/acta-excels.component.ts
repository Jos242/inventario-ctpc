import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-acta-excels',
  standalone: true,
  imports: [MatCardModule, MatDividerModule, RouterLink, MatButtonModule],
  templateUrl: './acta-excels.component.html',
  styleUrl: './acta-excels.component.scss'
})
export class ActaExcelsComponent {
  excels:any;
  fileName:any;

  
  filtros: FormGroup;
  datos: any;
  isLoadingResults: any;
  destroy$:Subject<boolean>=new Subject<boolean>();


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
        ubicacion_original_alias: false,
        ubicacion_actual_alias: false,
        modo_adquisicion_desc: false,
        precio: false,
        conectividad: false,
        seguridad: false,
        placa: true,
        baja: false,
        fecha: false,
      });

      this.loadActivos();


    }

    getFormattedDate(): string {
      const date = new Date();
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // January is 0
      const year = date.getFullYear();
    
      return `${day}-${month}-${year}`;
    }

    getFileName(date: string): string {
      return `Formato de Impresion - ${date}.xlsx`;
    }

    createFormData(): FormData {
      const formData = new FormData();
      const date = this.getFormattedDate();
      this.fileName = this.getFileName(date);
  
      formData.append('file_name', this.fileName);
  
      return formData;
    }


  excelImpresion(){

    const formData = this.createFormData();
    console.log(formData)
    
    this.gService.create('crear-excel/impresiones/', formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          console.log(data);
          this.datos = data;
          // Count the number of items where datos.placa is false
          const url = `${environment.apiURL}media/documentos_de_impresion/${this.fileName}/`;
          window.open(url, '_blank');
          this.isLoadingResults = false; // Stop loading
          // clearTimeout(loadingTimeout); // Clear the timeout if loading is finished

        },
        error: (error) => {
          this.isLoadingResults = false; // Stop loading on error
          // clearTimeout(loadingTimeout); // Clear the timeout if there's an error
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un error, por favor recargue la página para intentar otra vez o contacte a su administrador.',
          });
        }
      });
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

}
