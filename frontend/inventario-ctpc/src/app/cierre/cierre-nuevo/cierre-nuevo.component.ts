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
import { CierreNotaDialogComponent } from '../cierre-nota-dialog/cierre-nota-dialog.component';

@Component({
  selector: 'app-cierre-nuevo',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,
    CommonModule, MatRadioModule, MatCardModule, RouterLink,
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule, FormsModule, ReactiveFormsModule
  ],
  templateUrl: './cierre-nuevo.component.html',
  styleUrl: './cierre-nuevo.component.scss'
})
export class CierreNuevoComponent {
  public isLoadingResults = false;

  datos:any;
  destroy$:Subject<boolean>=new Subject<boolean>();
  baseUrl: string = environment.apiURL;

  funcionarioId: number;
  ubicacionId: number;
  datosUbi: any;

  currentCierre: any;
  cierresIndex: number;

  activos: any[] = [];
  revisiones: any[] = [];
  storedData: any[] = [];

  highlightErrorIds: number[] = [];
  
  @ViewChild('finalizar') finalizarButton!: ElementRef;
  @ViewChildren('notaField') notaTextareas!: QueryList<ElementRef>;
  @ViewChildren('card') cards: QueryList<ElementRef>;

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
    this.route.queryParams.subscribe(params => {
      this.funcionarioId = params['funcionarioId'];
      this.ubicacionId = params['ubicacionId'];

      this.storedData = JSON.parse(localStorage.getItem('cierres') || '[]');

      this.getCierre();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.complete();
  }

  getCierre() {
    let newCierre = {
      funcionario: this.funcionarioId,
      ubicacion: this.ubicacionId,
      finalizado: false
    }

    this.cierresIndex = this.storedData.findIndex((item: any) =>
      item.funcionario == newCierre.funcionario &&
      item.ubicacion == newCierre.ubicacion &&
      (item.finalizado == 0 || item.finalizado == false)
    );
    
    const foundCierre = this.cierresIndex !== -1 ? this.storedData[this.cierresIndex] : null;

    if (foundCierre) {
      this.currentCierre = foundCierre;
      
      if (this.currentCierre.revisiones) {
        this.revisiones = this.currentCierre.revisiones;
      }

      this.getUbicacion();
    } else {
      this.createCierre();
    }
  }

  createCierre() {
    const currentDate = new Date();
      const fullDate = `${currentDate.getFullYear()}-${currentDate.getMonth()+1}-${currentDate.getDate()}`
      let tipoRevision = '';

      if (currentDate.getMonth() <= 5) {
        tipoRevision = 'PRINCIPIO';
      } else {
        tipoRevision = 'MEDIO';
      }
            
      let datas = {
        tipo_revision: tipoRevision,
        fecha: fullDate,
        finalizado: 0,
        funcionario: this.funcionarioId,
        ubicacion: this.ubicacionId
      };

      this.gService.create('nuevo-cierre/', datas)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:(data: any) => {
          this.currentCierre = data;
          this.cierresIndex = this.storedData.length;

          this.storedData.push(data);
          localStorage.setItem('cierres', JSON.stringify(this.storedData));
      
          this.getUbicacion();
        },
        error:(error) => {
          console.log(error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Error al crear el cierre de invetario.`,
          });
          
          this.router.navigate([`/revision/`]);
        }
      });
  }

  getUbicacion() {
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
    
    this.gService.list(`ubicacion/${this.ubicacionId}/`)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any[]) => {
        this.datosUbi = data;

        this.getActivos();
        
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
        }
      }
    });
  }

  getActivos(){
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

    const selectedColumns = ['id', 'id_registro', 'no_identificacion', 'descripcion', 'marca', 'modelo', 'ubicacion_actual']

    const formData = { fields: selectedColumns };

    // Make the request
    this.gService.create('activos/select-columns/', formData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        this.datos = data.filter(a => a.ubicacion_actual.nombre_oficial == this.datosUbi.nombre_oficial);

        if (this.currentCierre.revisiones) {
          this.currentCierre.revisiones.forEach(revision => {
            const activo = this.datos.find(a => a.id_registro === revision.id_registro);
            
            if (activo) {
              activo.nota = revision.nota;
              activo.status = revision.status;
            }
          });
        }
        this.activos = this.datos;

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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    this.activos = this.datos.filter(item =>
      Object.values(item).some(value =>
        value.toString().toLowerCase().includes(filterValue)
      )
    );
  }

  scrollToFinalizar() {
    this.finalizarButton.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async confirmacion(activo: any) {
    setTimeout(() => {
      const filterActivos = this.activos.filter(a => a.status == 'NO EXISTE');
      const index = filterActivos.findIndex(a => a.id === activo.id);
      const textareaToFocus = this.notaTextareas.get(index);
      textareaToFocus?.nativeElement.focus();

      this.confirmarNota(activo);
    }, 80);
  }

  async confirmarNota(activo: any) {
    const index = this.revisiones.findIndex(r => r.id_registro === activo.id_registro);
    const currentDate = new Date();
    const fullDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`


    const newRevision = {
      status: activo.status,
      fecha: fullDate,
      nota: activo.status == 'NO EXISTE' ? activo.nota : null,
      cierre_inventario_id: this.currentCierre.id,
      id_registro: activo.id_registro
    }
  
    if (index != -1) {
      this.revisiones[index] = newRevision;
    } else {
      this.revisiones.push(newRevision);
    }

    this.saveLocalStorage();
  }

  async saveLocalStorage() {
    this.currentCierre.revisiones = this.revisiones;
    this.storedData[this.cierresIndex] = this.currentCierre;
    localStorage.setItem('cierres', JSON.stringify(this.storedData));
  }
  
  validarStatus() {
    this.highlightErrorIds = [];
    let cont = 0;
    let bandera = true;

    for (const activo of this.activos) {
      if (activo.status === null || activo.status === undefined || (activo.status == 'NO EXISTE' && (activo.nota === null || activo.nota === undefined || activo.nota.length == 0))) {
        this.highlightErrorIds.push(activo.id);
        bandera = false;
      }
      if (bandera) {
        cont++;
      }
    }
    return {index: cont, completo: bandera};
  }

  scrollToCheck(index: number) {
    const cardElements = this.cards.toArray();
    const firstCard = cardElements[index];

    if (firstCard) {
      firstCard.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  async submitCierre() {
    const validation = this.validarStatus()

    if (!validation.completo) {
      this.scrollToCheck(validation.index);
      return;
    }

    await Promise.all(this.revisiones.map(revision => this.createRevision(revision)));
    this.updateCierre();

    this.borrarLocalStorage();
  }

  async createRevision(revision: any) {
    this.gService.create('nueva-revision/', revision)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        
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

  async updateCierre() {
    this.currentCierre.finalizado = 1;

    this.gService.patch(`update-cierre/${this.currentCierre.id}/`, this.currentCierre)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Cierre actualizado correctamente',
        });

        this.router.navigate(['/revision']);
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al actualizar el cierre, por favor intente de nuevo.',
        });
      }
    });
  }

  borrarLocalStorage() {
    this.storedData.splice(this.cierresIndex, 1);
    localStorage.setItem('cierres', JSON.stringify(this.storedData));
  }
}
