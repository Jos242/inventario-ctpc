import { Component } from '@angular/core';
import { Subject, filter, takeUntil, forkJoin, from, concatMap } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse} from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../share/auth.service';

import Swal from 'sweetalert2';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-revision-index',
  standalone: true,
  imports: [MatButtonModule, CommonModule, MatProgressSpinnerModule],
  templateUrl: './revision-index.component.html',
  styleUrl: './revision-index.component.scss'
})
export class RevisionIndexComponent {

  destroy$:Subject<boolean>=new Subject<boolean>();
  datos:any;
  datosUbi: any;

  ubicaciones: any;
  isLoadingResults: boolean = false;
  hasUbicacion: boolean = true;

  currentUserData: any =null;
  currentUserId: any =null;

  constructor(private gService:GenericService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private authService: AuthService,
  ){

  }

  ngOnInit(): void {
    this.authService.getCurrentUser$().subscribe(userId => {
      this.currentUserId = userId;

      this.getFuncionario();
    });
  }

    getFuncionario(): void {
      this.isLoadingResults = true;
    
      const loadingTimeout = setTimeout(() => {
        if (this.isLoadingResults) {
          Swal.fire({
            icon: 'error',
            title: 'Hay problemas...',
            text: 'La carga de datos esta durando mas de lo esperado... Por favor intente nuevamente. Error: 1',
          });
        }
      }, 15000);
    
      this.gService.list(`all-funcionarios/`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: any[]) => {
            this.datos = data;
            console.log(this.datos);
    
            // Get the current user
            const currentUser = this.authService.getCurrentUser();
            console.log(currentUser)
    
            // Find the current user in the funcionarios list
            const matchedUser = this.datos.find((funcionario: any) => funcionario.user === currentUser);
    
            // Save the matched user to a variable
            this.currentUserData = matchedUser;
            console.log(this.currentUserData);

            this.loadUbiByFunc();

    
            this.isLoadingResults = false;
            clearTimeout(loadingTimeout);
            
          },
          error: (error) => {
            this.isLoadingResults = false;
            clearTimeout(loadingTimeout);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: `Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador. Error: 2. ${error}`,
            });
          }
        });
    }

    loadUbiByFunc(): void {
      this.isLoadingResults = true;
    
      const loadingTimeout = setTimeout(() => {
        if (this.isLoadingResults) {
          Swal.fire({
            icon: 'error',
            title: 'Hay problemas...',
            text: 'La carga de datos esta durando mas de lo esperado... Por favor intente nuevamente. Error: 3',
          });
        }
      }, 15000);
    
      this.gService.list(`ubicacion/funcionario-id/${this.currentUserData.id}/`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: any[]) => {
            this.datosUbi = data;
            console.log(this.datosUbi);
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
            } else { 
              this.hasUbicacion = false;
            }
          }
        });
    }

    

    iniciarRevision(){

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

      let formData;
      //crear cierre
      this.gService.create('nuevo-cierre/', formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          console.log(data);
          this.datos = data;             


          this.isLoadingResults = false; // Stop loading
          clearTimeout(loadingTimeout); // Clear the timeout if loading is finished

        },
        error: (error) => {
          this.isLoadingResults = false; // Stop loading on error
          clearTimeout(loadingTimeout); // Clear the timeout if there's an error
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador. ${error}`,
          });
        }
      });

      //retorna el create con el id
      //usar ese id para redireccionar al cierre-nuevo
      console.log("enlace redireccionamiento: " , `/cierre-nuevo/${this.currentUserData.id}/`,  )
    }

  // loadUbicaciones(): void {
  //   this.isLoadingResults = true;

  //   const loadingTimeout = setTimeout(() => {
  //     if (this.isLoadingResults) {
  //       Swal.fire({
  //         icon: 'error',
  //         title: 'Hay problemas...',
  //         text: 'La carga de datos esta durando mas de lo esperado... Por favor intente nuevamente',
  //       });
  //     }
  //   }, 15000);

  //   this.gService.list('all-ubicaciones/')
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (data: any[]) => {
  //         this.ubicaciones = data;
  //         this.ubicaciones.sort();
  //         console.log(this.ubicaciones)
  //         this.isLoadingResults = false;
  //         clearTimeout(loadingTimeout);
  //       },
  //       error: (error) => {
  //         this.isLoadingResults = false;
  //         clearTimeout(loadingTimeout);
  //         Swal.fire({
  //           icon: 'error',
  //           title: 'Error',
  //           text: `Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador. Error: ${error}`,
  //         });
  //       }
  //     });
  // }


}
