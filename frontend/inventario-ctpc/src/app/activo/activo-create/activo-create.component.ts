import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatRippleModule} from '@angular/material/core';
import {MatTabsModule} from '@angular/material/tabs';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { AsyncPipe, CommonModule } from '@angular/common';
import { map, Observable, startWith, Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../share/auth.service';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { ActivoSerieDialogComponent } from '../activo-serie-dialog/activo-serie-dialog.component';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-activo-create',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatRippleModule, MatTabsModule, MatGridListModule, MatCardModule,
    ReactiveFormsModule,MatButtonModule,MatSelectModule,CommonModule,MatCheckboxModule, MatAutocompleteModule, MatIconModule, RouterLink
  ],
  templateUrl: './activo-create.component.html',
  styleUrl: './activo-create.component.scss'
})
export class ActivoCreateComponent {
  myForm: FormGroup;
  destroy$:Subject<boolean> = new Subject<boolean>();

  ubicaciones: any[] = [];
  filteredUbicaciones: any[] = [];
  modosAdquisiciones: any[] = [];
  filteredModos: any[] = [];
  isLoadingResults: boolean = false;

  estados: { id: string, descripcion: string }[] = [
    { id: 'BUENO', descripcion: 'Bueno' },
    { id: 'MALO', descripcion: 'Malo' },
    { id: 'REGULAR', descripcion: 'Regular' }
  ];
  
  constructor(private gService:GenericService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private dialog: MatDialog // Add this
  ) {
    this.loadUbicaciones();
    this.loadModosAdquisicion();
  }

  ngOnInit(){
    this.initForm();
  }

  initForm(){
    this.myForm = this.formBuilder.group({
      descripcion: ['', Validators.required],
      ubicacion_original: ['', Validators.required],
      modo_adquisicion: ['', Validators.required],
      marca: ['', ],
      modelo: ['', ],
      // serie:['', ],
      hasNumeroSerie: [false], // New control for "Has numero de serie?"
      estado:['', Validators.required ],
      precio: ['', Validators.pattern(/^\d+(\.\d{1,2})?$/)],
      conectividad: [false],
      seguridad: [false],
      cantidadActivosIguales: [1, [Validators.min(1), Validators.required]],
      
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
          this.filteredUbicaciones = data;
          
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
          this.filteredModos = data;
          
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

  formatearPrecio(): void {
    const precio = this.myForm.get('precio');
    const digitos = precio.value.replace(/\D/g, '');

    precio.setValue(digitos);
  }

  async onSubmit() {
    if (this.myForm.valid) {
      let datas: { [key: string]: any } = {
        descripcion: this.myForm.value.descripcion,
        ubicacion_original: this.myForm.value.ubicacion_original.id,
        modo_adquisicion: this.myForm.value.modo_adquisicion.id,
        estado: this.myForm.value.estado,
        precio: this.myForm.value.precio,
        conectividad: this.myForm.value.conectividad,
        seguridad: this.myForm.value.seguridad
      };

      if (this.myForm.value.marca?.trim()) {
        datas['marca'] = this.myForm.value.marca;
      }
      if (this.myForm.value.modelo?.trim()) {
        datas['modelo'] = this.myForm.value.modelo;
      }

      const tieneSerie = this.myForm.value.hasNumeroSerie;
      const cantidadActivosIguales = this.myForm.value.cantidadActivosIguales;

      let dataList = Array.from({ length: cantidadActivosIguales }, () =>
        JSON.parse(JSON.stringify(datas))
      );
      
      if (tieneSerie) {
        for (let i = 0; i < cantidadActivosIguales; i++) {
          const dialogRef = this.dialog.open(ActivoSerieDialogComponent, {
            width: '270px',
            height: '200px',
            data: { index: i + 1, total: cantidadActivosIguales }
          });
  
          const result = await firstValueFrom(dialogRef.afterClosed());
          if (result) {
            dataList[i].serie = result.serie;
          } else {
            Swal.fire({
              icon: 'info',
              title: 'Cancelado',
              text: 'Proceso cancelado por el usuario',
            });
            dataList = null;
            return;
          }
        }
      }
      
      try {
        if ( dataList != null && dataList.length > 0) {
          const data = await firstValueFrom(this.gService.create('agregar-multiples-activos/', dataList));
          let text = `
            <div>
              Los siguientes activos se han creado correctamente:<br>
              <div style="max-height: 200px; overflow-y: auto; margin-top: 12px;">
                ${data.map(no => `${no}<br>`).join('')}
              </div>
            </div>
          `;
          
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            html: text,
          });
          if (!this.myForm.value.mantener) {
            this.myForm.reset();
            this.initForm();
          }
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Hubo un error de servidor al crear el activo, por favor intente otra vez o contacte a su administrador si el problema persiste.`,
        });
        return;
      }
    }
  }

  filterUbicacion(value: string) {
    this.filteredUbicaciones = this.ubicaciones.filter(u => u.nombre_oficial.toLowerCase().includes(value.toLowerCase()));
  }
  onEnterPressedUbicacion() {
    if (this.filteredUbicaciones.length > 0) {
      this.myForm.get('ubicacion_original')?.setValue(this.filteredUbicaciones[0]);
    }
  }
  displayUbicacion(ubicacion: any): string {
    return ubicacion?.nombre_oficial || '';
  }
  validateUbicacionInput() {
    const value = this.myForm.get('ubicacion_original')?.value;
  
    if (!value || typeof value !== 'object' || !value.id) {
      this.myForm.get('ubicacion_original')?.setValue(null);
      this.filterUbicacion("");
    }
  }
  onUbicacionBlur() {
    setTimeout(() => {
      this.validateUbicacionInput();
    }, 100);
  }

  filterModo(value: string) {
    this.filteredModos = this.modosAdquisiciones.filter(u => u.descripcion.toLowerCase().includes(value.toLowerCase()));
  }
  onEnterPressedModo() {
    if (this.filteredModos.length === 1) {
      this.myForm.get('modo_adquisicion')?.setValue(this.filteredModos[0]);
    }
  }
  displayModo(modo: any): string {
    return modo?.descripcion || '';
  }
  validateModoInput() {
    const value = this.myForm.get('modo_adquisicion')?.value;
  
    if (!value || typeof value !== 'object' || !value.id) {
      this.myForm.get('modo_adquisicion')?.setValue(null);
      this.filterModo("");
    }
  }
  onModoBlur() {
    setTimeout(() => {
      this.validateModoInput();
    }, 100);
  }
}
