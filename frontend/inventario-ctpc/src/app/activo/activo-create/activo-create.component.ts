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
import Swal from 'sweetalert2';

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
  ) {

    this.loadUbicaciones();
    this.loadModosAdquisicion();

  }

  

  ngOnInit(){
    this.myForm = this.formBuilder.group({
      descripcion: ['', Validators.required],
      ubicacion_original: ['', Validators.required],
      modo_adquisicion: ['', Validators.required],
      marca: ['', ],
      modelo: ['', ],
      serie:['', ],
      estado:['', Validators.required ],
      precio:['', ],
      conectividad: [false],
      seguridad: [false, ]
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

  onSubmit() {
    if (this.myForm.valid) {
      // this.myForm.value.pimgspath=this.logo;
      const formData = new FormData();
      // const formData = this.myForm.value;
      // formData.append('descripcion', this.myForm.value.descripcion);
      // formData.append('ubicacion', this.myForm.value.ubicacion_original);
      // formData.append('modo_adquisicion', this.myForm.value.modo_adquisicion);
      // formData.append('marca', this.myForm.value.marca);
      // formData.append('modelo', this.myForm.value.modelo);
      // formData.append('serie', this.myForm.value.serie);
      // formData.append('estado', this.myForm.value.estado);
      // formData.append('precio', this.myForm.value.precio);

      // formData.append('conectividad', this.myForm.value.conectividad);
      // formData.append('seguridad', this.myForm.value.seguridad);

      const datas = {
        descripcion: this.myForm.value.descripcion,
        ubicacion_original: this.myForm.value.ubicacion_original,
        modo_adquisicion: this.myForm.value.modo_adquisicion,
        marca: this.myForm.value.marca,
        modelo: this.myForm.value.modelo,
        serie: this.myForm.value.serie,
        estado: this.myForm.value.estado,
        precio: this.myForm.value.precio,
        conectividad: this.myForm.value.conectividad,
        seguridad: this.myForm.value.seguridad
      };

      


  
      console.log(datas);
      // const formData = this.myForm.value;
      this.gService.create('agregar-activo/', datas)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          console.log(data);
          this.myForm.reset();
          Swal.fire({
            icon: 'success',
            title: 'Exito',
            text: 'Se ha creado el activo correctamente',
          });

        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un error de servidor al crear el activo, por favor intente otra vez o contacte a su administrador si el problema persiste.',
          });
        }
      } 
    );

      
    }
  }
}
