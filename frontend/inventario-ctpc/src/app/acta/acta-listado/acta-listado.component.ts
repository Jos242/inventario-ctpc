import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient} from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-acta-listado',
  standalone: true,
  imports: [],
  templateUrl: './acta-listado.component.html',
  styleUrl: './acta-listado.component.scss'
})
export class ActaListadoComponent {

  public isLoadingResults = false;
  datos:any;
  destroy$:Subject<boolean>=new Subject<boolean>();

  constructor(private gService:GenericService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer
    ){
      this.loadDocs();  

    }




  loadDocs(){
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
    this.gService.list('obtener-documentos/')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          console.log(data);
          this.datos=data;

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
