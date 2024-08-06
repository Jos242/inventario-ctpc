import {AfterViewInit, Component, ViewChild} from '@angular/core';
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
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../share/auth.service';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { ActivoSerieDialogComponent } from '../activo-serie-dialog/activo-serie-dialog.component';

@Component({
  selector: 'app-activo-create',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatRippleModule, MatTabsModule, MatGridListModule, MatCardModule,
    ReactiveFormsModule,MatButtonModule,MatSelectModule,CommonModule,MatCheckboxModule
  ],
  templateUrl: './activo-create.component.html',
  styleUrl: './activo-create.component.scss'
})
export class ActivoCreateComponent {
  myForm: FormGroup;
  destroy$:Subject<boolean>=new Subject<boolean>();

  ubicaciones: any;
  modosAdquisicion: any;
  isLoadingResults: boolean = false;

  cantidadActivosIguales: number = 1; // Add this property

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
      seguridad: [false, ],
      cantidadActivosIguales: [1, [Validators.min(1), Validators.required]],
      
    });
  }

  checkCantidadActivosIguales() {
    // if (this.cantidadActivosIguales > 1) {
    //   this.myForm.get('serie').disable();
    // } else {
    //   this.myForm.get('serie').enable();
    // }
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
          console.log(this.ubicaciones)
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
          this.modosAdquisicion = data;
          console.log(this.modosAdquisicion)
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

      const formData = new FormData();

      let datas: { [key: string]: any } = {
        descripcion: this.myForm.value.descripcion,
        ubicacion_original: this.myForm.value.ubicacion_original,
        modo_adquisicion: this.myForm.value.modo_adquisicion,
        estado: this.myForm.value.estado,
        precio: this.myForm.value.precio,
        conectividad: this.myForm.value.conectividad,
        seguridad: this.myForm.value.seguridad,

        
      };

      if (this.myForm.value.marca !== "") {
        datas = { ...datas, marca: this.myForm.value.marca };
      }
      if(this.myForm.value.modelo!==""){
        datas = { ...datas, modelo: this.myForm.value.modelo };
      }


      


  
      console.log("data a enviar: ");
      console.log(datas);
      console.log("-----------------------");

      const tieneSerie = this.myForm.value.hasNumeroSerie;
      this.cantidadActivosIguales=this.myForm.value.cantidadActivosIguales;
      let exitosos = 0;

      for (let i = 0; i < this.cantidadActivosIguales; i++) {
        if (tieneSerie) {
          const dialogRef = this.dialog.open(ActivoSerieDialogComponent, {
            width: '270px',
            height: '200px',
            data: { index: i + 1, total: this.cantidadActivosIguales }
          });
  
          const result = await firstValueFrom(dialogRef.afterClosed());
          if (result) {
            datas = { ...datas, serie: result.serie };
          } else {
            Swal.fire({
              icon: 'info',
              title: 'Cancelado',
              text: 'Proceso cancelado por el usuario',
            });
            return;
          }
        }
  
        try {
          const data = await firstValueFrom(this.gService.create('agregar-activo/', datas));
          console.log(`Activo ${i + 1} creado:`, data);
          exitosos++;
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Hubo un error de servidor al crear el activo ${i + 1}, por favor intente otra vez o contacte a su administrador si el problema persiste.`,
          });
          return;
        }
      }
  
      // TypeScript Code Change in onSubmit method
        if (exitosos === this.cantidadActivosIguales) {
          if (!this.myForm.value.mantener) {
            this.myForm.reset();
            this.initForm();
          }
          this.cantidadActivosIguales = 1;
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Se han creado los activos correctamente',
          });
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Parcialmente exitoso',
            text: `Se han creado ${exitosos} del total de ${this.cantidadActivosIguales} activos correctamente. Por favor revise la tabla de activos y agregue los faltantes nuevamente. `,
          });
        }
      
      console.log("completo el proceso");

    }
  }
}
