import { CommonModule } from '@angular/common';
import { Component, ViewChild,  ElementRef, Renderer2, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatRippleModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { GenericService } from '../../share/generic.service';
import { ConfirmationService } from '../../share/confirmation.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../share/auth.service';

import { HotToastService } from '@ngxpert/hot-toast';

import Swal from 'sweetalert2';

import moment from 'moment';
import 'moment/locale/es';

@Component({
  selector: 'app-acta-mover-create',
  standalone: true,
  providers:[provideNativeDateAdapter()],
  imports: [
    MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatRippleModule, MatTabsModule, MatGridListModule, MatCardModule,
    ReactiveFormsModule, MatButtonModule, MatSelectModule, CommonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatProgressSpinnerModule,
    MatCheckbox, MatIconModule, MatRippleModule, MatTooltipModule
  ],
  templateUrl: './acta-mover-create.component.html',
  styleUrl: './acta-mover-create.component.scss'
})
export class ActaMoverCreateComponent {
  destroy$: Subject<boolean> = new Subject<boolean>();

  datos: any;
  datosActivos:any;
  activosUbicacion: any;
  myForm: FormGroup;

  isLoadingResults:any;

  displayedColumns: string[] = ['select', 'no_identificacion', 'descripcion', 'marca', 'modelo', 'serie', 'ubicacion_actual'];
  displayedColumns2: string[] = ['select', 'no_identificacion', 'descripcion', 'marca', 'modelo', 'serie', 'ubicacion_primera', 'ubicacion_actual'];
  pageSizeOptions: number[] = [10, 25, 40, 100];
  dataSource = new MatTableDataSource<any>();
  dataSourceUbicacion = new MatTableDataSource<any>();

  activoTablas: any[] = [[]];
  currentRow: any = 0;
  currentHeightPx: any = 0.00;

  @ViewChild('allPaginator') allPaginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  @ViewChild('paginatorUbicacion') paginatorUbicacion: MatPaginator;
  @ViewChild(MatSort) sortUbicacion: MatSort;

  @ViewChild('specific') specific!: ElementRef;
  @ViewChild('header') header!: ElementRef;
  @ViewChildren('blanco') blancos: QueryList<ElementRef>;

  @ViewChild('input') inputElement!: ElementRef<HTMLInputElement>;

  filtros: FormGroup;
  
  selectionAll = new SelectionModel<any>(true, []);
  selectionUbicacion = new SelectionModel<any>(true, []);

  selectedActivos: any[] = [];

  numActa: any;
  actaAnio: any;
  fechaActa: any;
  descActa: any;

  constructor(private gService: GenericService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private renderer: Renderer2,
    private toast: HotToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.filtros = this.formBuilder.group({
      id: true,
      id_registro: false,
      no_identificacion: true,
      descripcion: true,
      marca: true,
      modelo: true,
      serie: true,
      estado: false,
      impreso: false,
      ubicacion_original: false,
      ubicacion_actual: true,
      ubicacion_primera: true,
      modo_adquisicion: false,
      precio: false,
      conectividad: false,
      seguridad: false,
      placa: false,
      baja: true,
      fecha: false,
    });
    moment.locale('es'); // Set locale to Spanish

    this.loadActivos();
    this.listaDocs();
  }

  ngOnInit() {
    this.dataSource.paginator = this.allPaginator;
    this.dataSourceUbicacion.paginator = this.paginatorUbicacion;

    this.initForm();
  }

  initForm() {
    this.myForm = this.formBuilder.group({
      descripcion: ['', Validators.required],
      activo: [''],
      fecha: ['', Validators.required]
    });

    this.myForm.get('fecha').valueChanges.subscribe(selectedDate => {
      if (selectedDate) {
        this.fechaActa = moment(selectedDate).format('dddd D [de] MMMM YYYY');
      }
    });
  }

  loadActivos() {
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
    this.gService.create('activos/historial/select-columns/', formData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        this.datos = data;
        
        this.datosActivos = data.filter((activo: any) => activo.count_historial == 0); // Exclude activos with different ubicacion
        this.dataSource.data = this.datosActivos;
        this.dataSource.paginator = this.allPaginator;
        this.dataSource.sort = this.sort;

        this.activosUbicacion = data.filter((activo: any) => activo.count_historial > 0); // Activos to with different ubicacion
        this.dataSourceUbicacion.data = this.activosUbicacion;
        this.dataSourceUbicacion.paginator = this.paginatorUbicacion;
        this.dataSourceUbicacion.sort = this.sortUbicacion;

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
  }

  listaDocs(){
    this.gService.list('obtener-documentos/')
    .pipe(takeUntil(this.destroy$))
    .subscribe((data:any)=>{
      this.datos = data;

      const currentYear = new Date().getFullYear();
      const docsThisYear = this.datos.filter(doc => 
        new Date(doc.creado_el).getFullYear() === currentYear 
        && doc.titulo.toLowerCase().includes('traslado'));
      const numDocsThisYear = docsThisYear.length + 1;
      
      this.numActa = numDocsThisYear;
      this.actaAnio = currentYear;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  isAllSelectedAll() {
    const numSelected = this.selectionAll.selected.length;
    const numRows = this.dataSource.filteredData.length;
    return numSelected === numRows;
  }
  toggleAllRowsAll() {
    if (this.isAllSelectedAll()) {
      this.selectionAll.clear();
      return;
    }

    this.selectionAll.select(...this.dataSource.filteredData);
  }

  isAllSelectedUbicacion() {
    const numSelected = this.selectionUbicacion.selected.length;
    const numRows = this.dataSourceUbicacion.filteredData.length;
    return numSelected === numRows;
  }
  toggleAllRowsUbicacion() {
    if (this.isAllSelectedUbicacion()) {
      this.selectionUbicacion.clear();
      return;
    }

    this.selectionUbicacion.select(...this.dataSourceUbicacion.filteredData);
  }


  async onSubmit() {
    let selectedUbicacion: any = true;

    if (this.selectionAll.selected.length > 0) {
      const ubicacionConfirmation = this.confirmationService.confirm(8, '', this.selectionAll.selected);
      selectedUbicacion = await firstValueFrom(ubicacionConfirmation);
    }
    
    if (selectedUbicacion) {
      const selectedFromA = this.selectionAll.selected.map(item => ({ 
        ...item, lista: 'A' ,
        origen: item.ubicacion_actual.nombre_oficial,
        destino_id: selectedUbicacion.id,
        destino: selectedUbicacion.nombre_oficial
      }));
      const selectedFromB = this.selectionUbicacion.selected.map(item => ({ 
        ...item, lista: 'B' ,
        origen: item.ubicacion_primera.nombre_oficial,
        destino: item.ubicacion_actual.nombre_oficial
      }));
      const activosSelected = [...selectedFromA, ...selectedFromB];

      const cantSelected = activosSelected.length;
      let result = true;

      //if (cantSelected > 50) {
      //  const confirmation = this.confirmationService.confirm(3, cantSelected);
      //  result = await firstValueFrom(confirmation);
      // }
      
      if (result) {
        this.selectedActivos.push(...activosSelected);

        this.datosActivos = this.datosActivos.filter(item => !this.selectionAll.selected.includes(item));
        this.dataSource.data = this.datosActivos;
        this.dataSource.paginator = this.allPaginator;
        this.dataSource.sort = this.sort;

        this.activosUbicacion = this.activosUbicacion.filter(item => !this.selectionUbicacion.selected.includes(item));
        this.dataSourceUbicacion.data = this.activosUbicacion;
        this.dataSourceUbicacion.paginator = this.paginatorUbicacion;
        this.dataSourceUbicacion.sort = this.sortUbicacion;
        
        this.selectionAll.clear();
        this.selectionUbicacion.clear();

        this.toast.success(`Activos agregados al acta exitosamente`, {
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
      }
    }
  }

  removeActivo(item: any) {
    this.selectedActivos = this.selectedActivos.filter(i => i.id !== item.id);

    if (item.lista === 'A') {
      this.datosActivos.push(item);
      this.datosActivos.sort((a, b) => b.id - a.id);

      this.dataSource.data = this.datosActivos;
      this.dataSource.paginator = this.allPaginator;
      this.dataSource.sort = this.sort;
    } else if (item.lista === 'B') {
      this.activosUbicacion.push(item);
      this.activosUbicacion.sort((a, b) => b.id - a.id);

      this.dataSourceUbicacion.data = this.activosUbicacion;
      this.dataSourceUbicacion.paginator = this.paginatorUbicacion;
      this.dataSourceUbicacion.sort = this.sortUbicacion;
    }

    this.toast.success(`Activo eliminado del acta exitosamente`, {
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
  }

  generatePdf() {
    if (this.myForm.invalid || this.selectedActivos.length < 1) { 
      console.log('no valid');
      return;
    }

    let dataActa = {
      numActa: this.numActa,
      anio: this.actaAnio,
      fechaActa: this.fechaActa,
      nombreColegio: "CARRIZAL",
      descActa: this.myForm.value.descripcion,
      items: this.selectedActivos
    }
          
    this.confirmationService.confirm(4)
    .subscribe(documento => {
      if (documento === true || documento === false) {
        this.confirmationService.confirm(5, this.selectedActivos.length)
        .subscribe(async confirmacion => {
          if (confirmacion) {
            let result500 = true;

            if (this.selectedActivos.length > 500) {
              const confirmation500 = this.confirmationService.confirm(6, this.selectedActivos.length);
              result500 = await firstValueFrom(confirmation500);
            }

            if (result500) {
              this.isLoadingResults = true;  // Start loading
              this.cdr.detectChanges();

              const loadingTimeout = setTimeout(() => {
                if (this.isLoadingResults) {
                  Swal.fire({
                    icon: 'error',
                    title: 'Hay problemas...',
                    text: 'La carga de datos esta durando mas de lo esperado... Por favor intente nuevamente',
                  });
                }
              }, 60000); // 60 seconds
              
              dataActa['formato'] = documento ? 'pdf' : 'docx';
              dataActa['acta'] = 'traslado';

              this.gService.excel('generar-acta/', dataActa)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (data: any) => {
                  const link = document.createElement('a');
                  link.href = window.URL.createObjectURL(data);
                  link.download = `ACTA DE TRASLADO DE BIENES N ${this.numActa}-${this.actaAnio}`;
                  link.click();
                  
                  Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: `Activos trasladados correctamente`,
                  });
                  this.resetActa();

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
            }
          }
        });
      }
    });
  }

  resetActa(): void {
    this.myForm.reset(); 
    this.initForm();
    this.selectionAll.clear();
    this.selectionUbicacion.clear();
    this.activoTablas = [[]];
    this.selectedActivos = [];
    this.inputElement.nativeElement.value = '';
    this.dataSource.filter = '';
    this.loadActivos();
    this.listaDocs();
  }
}
