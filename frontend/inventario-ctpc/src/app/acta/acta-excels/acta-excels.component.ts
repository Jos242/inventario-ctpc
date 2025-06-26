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
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { HotToastService } from '@ngxpert/hot-toast';



@Component({
  selector: 'app-acta-excels',
  standalone: true,
  imports: [MatCardModule, MatDividerModule, RouterLink, MatButtonModule, MatProgressSpinner],
  templateUrl: './acta-excels.component.html',
  styleUrl: './acta-excels.component.scss'
})
export class ActaExcelsComponent {
  excels: number = 0;
  cantNot: number = 0;
  fileName: any;

  datos: any;
  isLoadingResults: any;
  destroy$: Subject<boolean>=new Subject<boolean>();


  constructor(private gService:GenericService,
    private fb: FormBuilder,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private toast: HotToastService
    ){
      this.loadRegistros();
    }

    getFormattedDate(): string {
      const date = new Date();
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // January is 0
      const year = date.getFullYear();

      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${day}-${month}-${year} ${hours}-${minutes}-${seconds}`;
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
          this.toast.success(`Excel generado correctamente`, {
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

          this.loadRegistros()
        },
        error: (error) => {
          this.isLoadingResults = false; // Stop loading on error
          // clearTimeout(loadingTimeout); // Clear the timeout if there's an error
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador. Descripcion del error: ${error.message}`,
          });
        }
      });
  }

  loadRegistros(){
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
    this.gService.list('registro/no-impreso/count/')
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        this.excels = data;
        this.cantNot = data;
        this.excels = Math.floor(this.excels / 40);

        this.isLoadingResults = false; // Stop loading
        clearTimeout(loadingTimeout); // Clear the timeout if loading is finished
      },
      error: (error) => {
        this.isLoadingResults = false; // Stop loading on error
        clearTimeout(loadingTimeout); // Clear the timeout if there's an error
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador. Descripcion del error: ${error.message}`,
        });
      }
    });
  }

    downloadExcel(endpoint: string, fileName: string): void {
      this.isLoadingResults = true;

      const loadingTimeout = setTimeout(() => {
          if (this.isLoadingResults) {
              Swal.fire({
                  icon: 'error',
                  title: 'Hay problemas...',
                  text: 'La carga de datos esta durando más de lo esperado... Por favor intente nuevamente',
              });
          }
      }, 15000);

      this.gService.excelGet(endpoint)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
              next: (blob: Blob) => {

                  // Create a link element
                  const link = document.createElement('a');
                  const url = window.URL.createObjectURL(blob);

                  // Set the file name and attributes
                  link.href = url;
                  link.download = fileName;  // Set the file name for download

                  // Append to the DOM and click
                  document.body.appendChild(link);
                  link.click();

                  // Clean up
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(link);

                  this.isLoadingResults = false;
                  clearTimeout(loadingTimeout);

                  this.toast.success(`Excel generado correctamente`, {
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
                  
              },
              error: (error) => {
                  this.isLoadingResults = false;
                  clearTimeout(loadingTimeout);
                  Swal.fire({
                      icon: 'error',
                      title: 'Error',
                      text: `Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador. Descripción del error: ${error.message}`,
                  });
              }
          });
  }

    printFuncs() {
      this.downloadExcel('funcionarios/as-excel-file/', 'funcionarios.xlsx');
  }

  printUbis() {
      this.downloadExcel('ubicaciones-excel/', 'ubicaciones.xlsx');
  }

  printActivos() {
      this.downloadExcel('excel/todos-los-activos/', 'activos_completo.xlsx');
  }

  printObs() {
      this.downloadExcel('observaciones-excel/', 'anotaciones_completo.xlsx');
  }

  printObsYAct() {
      this.downloadExcel('excel/activos-observaciones/', 'registro_completo.xlsx');
  }
}
