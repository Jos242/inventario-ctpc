import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatButtonModule} from '@angular/material/button';
import {MatCardActions, MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule, FormBuilder, ReactiveFormsModule, FormGroup, Validators} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatDividerModule} from '@angular/material/divider';
import {MatSliderModule} from '@angular/material/slider';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatSelectModule} from '@angular/material/select';
import {MatMenuModule} from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { Subject, filter, takeUntil, timeInterval } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient} from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import {AfterViewInit, ViewChild} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import {JsonPipe} from '@angular/common';
import { BooleanToYesNoPipe } from '../../share/boolean-to-yes-no.pipe';
import { HotToastService } from '@ngxpert/hot-toast';



import Swal from 'sweetalert2';

export interface ActivoData {
  id_registro: string;
  no_identificacion: string;
  descripcion: string;
  marca: string;
  modelo: string;
  serie: string;
  estado: string;
  ubicacion_original_alias: string;
  ubicacion_actual_alias: string;
  modo_adquisicion_desc: string;
  precio: string;
  conectividad: string;
  seguridad: string;
  placa: string;
  baja: string;
  fecha: string;
}

@Component({
  selector: 'app-acta-excel-custom',
  standalone: true,
  imports: [
    MatGridListModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,MatDividerModule,
    MatCheckboxModule,
    MatSliderModule,
    MatMenuModule,
    RouterLink, 
    CommonModule, MatSelectModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule, MatTooltip, FormsModule, ReactiveFormsModule, JsonPipe, BooleanToYesNoPipe
  ],
  templateUrl: './acta-excel-custom.component.html',
  styleUrl: './acta-excel-custom.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActaExcelCustomComponent implements AfterViewInit {

  displayedColumns: string[] = ['no_identificacion', 'descripcion', 'ubicacion_original_alias'];
  displayedColumns2: string[] = ['no_identificacion', 'descripcion', 'ubicacion_original_alias'];
  dataSource: MatTableDataSource<ActivoData> = new MatTableDataSource<ActivoData>();
  dataSource2: MatTableDataSource<ActivoData> = new MatTableDataSource<ActivoData>();
  public isLoadingResults = false;

  activosExcel: ActivoData[] = []; // Initialize the array to hold selected activos

  displayMessage: boolean = false;

  selectedActivo: any;

  ubicaciones: any;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  datos:any;
  destroy$:Subject<boolean>=new Subject<boolean>();
  baseUrl: string = environment.apiURL;

  totalItems: number;

  pageSizeOptions: number[] = [5, 10, 25, 100];
  loading = false; // Add a loading state flag

  filtros: FormGroup;
  agregar: FormGroup;





  constructor(private gService:GenericService,
    private fb: FormBuilder,
    private router:Router,
    private route:ActivatedRoute,
    private formBuilder: FormBuilder,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private toast: HotToastService
    ){
      this.filtros = this.fb.group({
        id_registro: false,
        no_identificacion: true,
        descripcion: true,
        marca: false,
        modelo: false,
        serie: false,
        estado: false,
        ubicacion_original_alias: true,
        ubicacion_actual_alias: false,
        modo_adquisicion_desc: false,
        precio: false,
        conectividad: false,
        seguridad: false,
        placa: false,
        baja: false,
        fecha: false,
      });

      this.agregar = this.formBuilder.group({

        ubicacion_original: [null, Validators.required],
        
      });
  



      this.checks();  
      // Initialize displayedColumns based on initial filter values
      this.loadUbicaciones();
      this.updateDisplayedColumns();
    }

    ngOnInit(): void {
      this.filtros.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.updateDisplayedColumns();
        this.displayMessage = true;
      });
    }

    ngAfterViewInit() {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }

    ngOnDestroy(): void {

      this.destroy$.complete();
    }

    updateDisplayedColumns(): void {
      this.displayedColumns = Object.keys(this.filtros.value).filter(key => this.filtros.value[key]);
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

    

    
    checks(){
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
            this.dataSource.data = data;
            this.totalItems = data.length;
            this.updatePageSizeOptions();
            this.isLoadingResults = false; // Stop loading
            clearTimeout(loadingTimeout); // Clear the timeout if loading is finished
            this.displayMessage = false;
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

    updatePageSizeOptions() {
      this.pageSizeOptions = [5, 10, 25, 100, this.totalItems];
    }

    applyFilter(event: Event) {
      const filterValue = (event.target as HTMLInputElement).value;
      this.dataSource.filter = filterValue.trim().toLowerCase();
      
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }

    agregarExcel(id: string): void {
      this.selectedActivo = this.datos.find(activo => activo.no_identificacion === id);
    
      if (!this.activosExcel.some(activo => activo.no_identificacion === id)) {
        this.activosExcel.push(this.selectedActivo);
        this.sortActivosExcel();
        // Show a success toast when an item is added
        this.toast.success(`Activo ${id} agregado al excel`, {
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
    
      this.dataSource2.data = this.activosExcel;
    }

    agregarXUbi(): void {

      const selectedUbi = this.agregar.value.ubicacion_original;
      console.log(selectedUbi)
    


      // Find all activos with the selected ubicacion
      const activosConUbicacion = this.datos.filter(activo => activo.ubicacion_original_alias === selectedUbi);


      // Add each activo to the second table if it's not already there
      activosConUbicacion.forEach(activo => {
        if (!this.activosExcel.some(a => a.no_identificacion === activo.no_identificacion)) {
          this.activosExcel.push(activo);
          

          
        }

        
      });

      

      // Sort the activos in the second table
      this.sortActivosExcel();

      // Update the data source for the second table
      this.dataSource2.data = this.activosExcel;
      this.toast.success(`Activos de ${selectedUbi} agregados al excel`, {
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
    
    removerExcel(id: string): void {
      const index = this.activosExcel.findIndex(activo => activo.no_identificacion === id);
    
      if (index !== -1) {
        this.activosExcel.splice(index, 1);
        this.sortActivosExcel();
        this.dataSource2.data = this.activosExcel;
        // Show an info toast when an item is removed
        this.toast.warning(`Activo ${id} eliminado del excel`, {
          duration: 4000,
          position: 'top-right',
          style: {
            border: '1px solid #ffc107',
            color: '#856404',
            background: '#fff3cd'
          },
          dismissible: true,
        });
      }
    }
    
    private sortActivosExcel(): void {
      this.activosExcel.sort((a, b) => {
        const aPart = a.no_identificacion.split('-')[1];
        const bPart = b.no_identificacion.split('-')[1];
        return aPart.localeCompare(bPart, undefined, { numeric: true });
      });
    }
    
    generarExcel() {
        this.isLoadingResults = true;  // Start loading

      const loadingTimeout = setTimeout(() => {
        if (this.isLoadingResults) {
          Swal.fire({
            icon: 'error',
            title: 'Hay problemas...',
            text: 'La carga de datos esta durando mas de lo esperado... Por favor intente nuevamente',
          });
        }
      }, 30000); // 30 seconds

      // Create formData with only no_identificacion values
      const formData = { nos_identificacion: this.activosExcel.map(activo => activo.no_identificacion) };

      // Make the request
      this.gService.excel('activos/excel/by/nos-identificacion/', formData,)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (blob: Blob) => {
            this.isLoadingResults = false; // Stop loading
            clearTimeout(loadingTimeout); // Clear the timeout if loading is finished

            // Create a link element
            const link = document.createElement('a');
            const url = window.URL.createObjectURL(blob);
            
            // Set the file name and attributes
            link.href = url;
            link.download = 'activos.xlsx';  // Set the file name for download

            // Append to the DOM and click
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            this.isLoadingResults = false; // Stop loading
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
            this.isLoadingResults = false; // Stop loading on error
            clearTimeout(loadingTimeout); // Clear the timeout if there's an error
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador.',
            });
          }
        });
        this.isLoadingResults = false; // Stop loading on error
    }

    

}
