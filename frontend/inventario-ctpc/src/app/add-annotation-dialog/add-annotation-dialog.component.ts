import { ChangeDetectorRef, Component, ElementRef, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';
import { GenericService } from '../share/generic.service';
import { Subject, filter, takeUntil, forkJoin, from, concatMap, Observable, startWith, map } from 'rxjs';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';

import {MatDividerModule} from '@angular/material/divider';
import {MatSliderModule} from '@angular/material/slider';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatMenuModule} from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient} from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';
import {AfterViewInit, ViewChild} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { DialogRef } from '@angular/cdk/dialog';
import { HotToastService } from '@ngxpert/hot-toast';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import {MatChipInputEvent, MatChipsModule} from '@angular/material/chips';

@Component({
  selector: 'app-add-annotation-dialog',
  standalone: true,
  imports: [MatSelectModule, MatInputModule, MatFormFieldModule,FormsModule, ReactiveFormsModule,

    MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,MatDividerModule,
    MatCheckboxModule,
    MatSliderModule,
    MatMenuModule,MatDialogModule,
    MatSelectModule,
    CommonModule,ReactiveFormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule, MatAutocompleteModule, MatChipsModule
  ],
  templateUrl: './add-annotation-dialog.component.html',
  styleUrl: './add-annotation-dialog.component.scss'
})
export class AddAnnotationDialogComponent {
  destroy$: Subject<boolean> = new Subject<boolean>();
  myForm: FormGroup;
  filtros: FormGroup;

  select_no_identificacion = new FormControl();
  search_no_identificacion = new FormControl();
  @ViewChild('search') searchTextBox: ElementRef;

  activos: any[] = [];
  filteredActivos: any[] = [];
  selectedActivos: any[] = [];

  activoIdRegistro: any;
  activoId: any;

  public isLoadingResults = false;

  @ViewChild(MatAutocompleteTrigger) autoTrigger!: MatAutocompleteTrigger;

  constructor(
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
    private gService:GenericService,
    public dialogRef: MatDialogRef<AddAnnotationDialogComponent>,
    private toast: HotToastService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.myForm = this.fb.group({
      descripcion: [null, Validators.required]
    });
    this.activoIdRegistro = data.activoIdRegistro;
    this.activoId = data.activoId;
    
    this.filtros = this.fb.group({
      id_registro: true,
      no_identificacion: true,
      descripcion: true,
      marca: false,
      modelo: false,
      serie: false,
      estado: false,
      ubicacion_original_nombre_oficial: true,
      ubicacion_actual_nombre_oficial: false,
      modo_adquisicion: false,
      precio: false,
      conectividad: false,
      seguridad: false,
      placa: false,
      baja: false,
      fecha: false,
    });
  }

  ngOnInit() {
    this.loadActivos();
  }

  filterActivos(value: string) {
    const filterValue = value.toLowerCase();
    this.filteredActivos = this.activos.filter(a => a.no_identificacion.toLowerCase().includes(filterValue));
  }
  selectionChange(event) {
    if (event.isUserInput) {
      if (event.source.selected == true) {
        this.selectedActivos.push(event.source.value);
      } else if (event.source.selected == false) {
        let index = this.selectedActivos.indexOf(event.source.value);
        this.selectedActivos.splice(index, 1)
      }
    }
  }
  openedChange(e) {
    // Set search textbox value as empty while opening selectbox 
    this.search_no_identificacion.patchValue('');
    // Focus to search textbox while clicking on selectbox
    if (e == true) {
      this.searchTextBox?.nativeElement?.focus();
    }
  }
  onSearchFocus(selectRef: MatSelect) {
    selectRef.open();
  }

  removeActivo(activo) {
    const index = this.selectedActivos.indexOf(activo);
    if (index >= 0) {
      this.selectedActivos.splice(index, 1);
      this.select_no_identificacion.setValue(this.selectedActivos);
    }
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
    this.gService.create('activos/select-columns/', formData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        this.activos = data;
        this.filteredActivos = data;
        
        this.selectedActivos.push(data.find(d => d.no_identificacion == this.activoId));
        this.select_no_identificacion.setValue(this.selectedActivos);
        
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

  async onSubmit() {
    if (this.myForm.valid && this.selectedActivos.length > 0) {
      let descripcion = this.myForm.value.descripcion.trim();

      if (descripcion.charAt(descripcion.length - 1) !== '.') {
          descripcion += '.';
      }

      const splitDescripcion = (text: string, chunkSize: number) => {
        const chunks = [];
        let start = 0;

        while (start < text.length) { 
            let end = start + chunkSize;
            if (end >= text.length) {
                chunks.push(text.slice(start));
                break;
            }
            if (text.charAt(end) !== ' ' && text.charAt(end) !== '.') {
                let spaceIndex = text.lastIndexOf(' ', end);
                if (spaceIndex > start) {
                    end = spaceIndex;
                }
            }
            chunks.push(text.slice(start, end));
            start = end + 1;
        }
        return chunks;
      };

      const chunks = splitDescripcion(descripcion, 98);

      const datos = {
        descripciones: chunks,
        activos: this.selectedActivos
      }
      
      this.gService.create('create-activo-observacion/', datos)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: 'Se han agregado las anotaciones correctamente.',
          });

          this.dialogRef.close();
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador. ${error}`,
          });
        }
      });
    }
  }
  
}
