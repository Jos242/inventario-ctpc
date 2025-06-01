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
import { MatDialog } from '@angular/material/dialog';
import { RevisionCierreDialogComponent } from '../revision-cierre-dialog/revision-cierre-dialog.component';
import { ConfirmationService } from '../../share/confirmation.service';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-revision-index',
  standalone: true,
  imports: [MatButtonModule, CommonModule, MatProgressSpinnerModule, MatSelectModule],
  templateUrl: './revision-index.component.html',
  styleUrl: './revision-index.component.scss'
})
export class RevisionIndexComponent {

  destroy$: Subject<boolean> = new Subject<boolean>();
  datos: any;
  ubicaciones: any[] = [];
  datosUbi: any;

  isLoadingResults: boolean = false;
  hasUbicacion: boolean = true;

  currentUserData: any =null;
  currentUserId: any =null;

  constructor(private gService:GenericService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private authService: AuthService,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService
  ){

  }

  ngOnInit(): void {
    this.authService.getCurrentUser$().subscribe(userId => {
      this.currentUserId = userId;
      
      if (userId) {
        this.getFuncionarioByIdUsuario();
      }
    });
  }

    getFuncionarioByIdUsuario(): void {
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
    
      this.gService.list(`funcionario/usuario/${this.currentUserId}/`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: any[]) => {
            this.datos = data;
            console.log(this.datos);

            // Save the matched user to a variable
            this.currentUserData = data;
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
            this.ubicaciones = data;
            this.datosUbi = data[0];
            console.log(this.ubicaciones);

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
      console.log(this.datosUbi.id)
      const storedData = JSON.parse(localStorage.getItem('cierres') || '[]');

      const index = storedData.findIndex((item: any) =>
        item.funcionario == this.currentUserData.id &&
        item.ubicacion == this.datosUbi.id &&
        (item.finalizado == 0 || item.finalizado == false)
      );
      const foundCierre = index !== -1 ? storedData[index] : null;
      
      const dialogRef = this.dialog.open(RevisionCierreDialogComponent, {
        width: '600px',
        data: foundCierre ? 1 : 0
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          if (foundCierre) {
            this.router.navigate(['/cierre'], { 
              queryParams: { funcionarioId: this.currentUserData.id, ubicacionId: this.datosUbi.id } 
            });
          } else {
            this.gService.delete(`delete-all-progreso-cierre/${this.currentUserData.id}/${this.datosUbi.id}/`)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.router.navigate(['/cierre'], { 
                  queryParams: { funcionarioId: this.currentUserData.id, ubicacionId: this.datosUbi.id } 
                });
              },
              error: () => {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'Hubo un problema con el cierre de inventario',
                });
              }
            });
          }
        } else if (result === false && foundCierre) {
          this.borrarCierre(foundCierre, storedData, index);
        }
      });
    }

    borrarCierre(foundCierre: any, storedData: any, index: any) {
      this.confirmationService.confirm()
      .subscribe(result => {
        if (result) {
          this.gService.delete(`delete-cierre/${foundCierre.id}/`)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              storedData.splice(index, 1);
              localStorage.setItem('cierres', JSON.stringify(storedData));

              this.router.navigate(['/cierre'], { 
                queryParams: { funcionarioId: this.currentUserData.id, ubicacionId: this.datosUbi.id } 
              });
            },
            error: () => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al borrar el cierre',
              });
            }
          });
        }
      });
    }

    getCierreCount(): number {
      return this.ubicaciones.filter(item => item.cierre).length;
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
