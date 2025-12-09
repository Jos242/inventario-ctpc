import {AfterViewInit, Component, ViewChild,  ElementRef, Renderer2, ViewChildren, QueryList, ChangeDetectorRef} from '@angular/core';
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
import { concatMap, firstValueFrom, from, Subject, takeUntil, timeout } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../share/auth.service';
import { BooleanToYesNoPipe } from '../../share/boolean-to-yes-no.pipe';
import {ChangeDetectionStrategy} from '@angular/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {provideNativeDateAdapter} from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { HotToastService } from '@ngxpert/hot-toast';

import Swal from 'sweetalert2';

import moment from 'moment';
import 'moment/locale/es';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

import jspdf from 'jspdf';
import html2canvas from 'html2canvas';
import { MatCheckbox } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { ConfirmationService } from '../../share/confirmation.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';


pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-acta-baja-create',
  standalone: true,
  providers:[provideNativeDateAdapter()],
  imports: [
    MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatRippleModule, MatTabsModule, MatGridListModule, MatCardModule,
    ReactiveFormsModule, MatButtonModule, MatSelectModule, CommonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatProgressSpinnerModule,
    MatCheckbox, MatIconModule, MatRippleModule, MatTooltipModule, RouterLink
  ],
  templateUrl: './acta-baja-create.component.html',
  styleUrl: './acta-baja-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActaBajaCreateComponent {
  destroy$: Subject<boolean> = new Subject<boolean>();

  datos: any;
  datosActivos:any;
  activosDeBaja: any;
  myForm: FormGroup;

  isLoadingResults: any;

  displayedColumns: string[] = ['select', 'no_identificacion', 'descripcion', 'marca', 'modelo', 'serie', 'ubicacion_actual'];
  pageSizeOptions: number[] = [10, 25, 40, 100];
  dataSource = new MatTableDataSource<any>();
  dataSourceDeBaja = new MatTableDataSource<any>();

  activoTablas: any[] = [[]];
  currentRow: any = 0;
  currentHeightPx: any = 0.00;

  @ViewChild('allPaginator') allPaginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  @ViewChild('paginatorDeBaja') paginatorDeBaja: MatPaginator;
  @ViewChild(MatSort) sortDeBaja: MatSort;

  @ViewChild('specific') specific!: ElementRef;
  @ViewChild('header') header!: ElementRef;
  @ViewChildren('blanco') blancos: QueryList<ElementRef>;

  @ViewChild('input') inputElement!: ElementRef<HTMLInputElement>;

  filtros: FormGroup;
  
  selectionAll = new SelectionModel<any>(true, []);
  selectionBaja = new SelectionModel<any>(true, []);

  selectedActivos: any[] = [];

  numActa: any;
  actaAnio: any;
  fechaActa: any;
  descActa: any;

  constructor(private gService:GenericService,
    private confirmationService: ConfirmationService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
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
      modo_adquisicion: true,
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
    this.dataSourceDeBaja.paginator = this.paginatorDeBaja;

    this.initForm();
  }

  initForm() {
    this.myForm = this.formBuilder.group({
      descripcion: ['Se llevara a la unidad productiva de reciclaje para la reutilización de los dispositivos y el desecho de las partes que no sean útiles según corresponda a las empresas recolectoras de reciclaje (Se separa papel, plástico, vidrío, baterías, cartón y otros).', Validators.required],
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
    this.gService.create('activos/no-baja/select-columns/', formData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data: any) => {
        this.datos = data;
        
        this.datosActivos = data.filter((activo: any) => activo.baja !== 'A DAR DE BAJA'); // Exclude "A DAR DE BAJA"
        this.dataSource.data = this.datosActivos;
        this.dataSource.paginator = this.allPaginator;
        this.dataSource.sort = this.sort;

        this.activosDeBaja = data.filter((activo: any) => activo.baja == 'A DAR DE BAJA'); // Activos to be deactivated
        this.dataSourceDeBaja.data = this.activosDeBaja;
        this.dataSourceDeBaja.paginator = this.paginatorDeBaja;
        this.dataSourceDeBaja.sort = this.sortDeBaja;

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
        && doc.titulo.toLowerCase().includes('baja'));
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

  isAllSelectedBaja() {
    const numSelected = this.selectionBaja.selected.length;
    const numRows = this.dataSourceDeBaja.filteredData.length;
    return numSelected === numRows;
  }
  toggleAllRowsBaja() {
    if (this.isAllSelectedBaja()) {
      this.selectionBaja.clear();
      return;
    }

    this.selectionBaja.select(...this.dataSourceDeBaja.filteredData);
  }


  async onSubmit() {
    const razonConfirmation = this.confirmationService.confirm(7);
    const selectedRazon = await firstValueFrom(razonConfirmation);
    
    if (selectedRazon == true || selectedRazon == false) {
      const selectedFromA = this.selectionAll.selected.map(item => ({ 
        ...item, lista: 'A' ,
        obsolencia: !selectedRazon,   //Obsolencia
        inservibilidad: selectedRazon //Inservibilidad
      }));
      const selectedFromB = this.selectionBaja.selected.map(item => ({ 
        ...item, lista: 'B' ,
        obsolencia: !selectedRazon,   //Obsolencia
        inservibilidad: selectedRazon //Inservibilidad
      }));
      const activosSelected = [...selectedFromA, ...selectedFromB];

      const cantSelected = activosSelected.length;
      let result = true;

      if (cantSelected > 50) {
        const confirmation = this.confirmationService.confirm(3, cantSelected);
        result = await firstValueFrom(confirmation);
      }
      
      if (result) {
        this.selectedActivos.push(...activosSelected);

        this.datosActivos = this.datosActivos.filter(item => !this.selectionAll.selected.includes(item));
        this.dataSource.data = this.datosActivos;
        this.dataSource.paginator = this.allPaginator;
        this.dataSource.sort = this.sort;

        this.activosDeBaja = this.activosDeBaja.filter(item => !this.selectionBaja.selected.includes(item));
        this.dataSourceDeBaja.data = this.activosDeBaja;
        this.dataSourceDeBaja.paginator = this.paginatorDeBaja;
        this.dataSourceDeBaja.sort = this.sortDeBaja;
        
        this.selectionAll.clear();
        this.selectionBaja.clear();

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
      this.activosDeBaja.push(item);
      this.activosDeBaja.sort((a, b) => b.id - a.id);

      this.dataSourceDeBaja.data = this.activosDeBaja;
      this.dataSourceDeBaja.paginator = this.paginatorDeBaja;
      this.dataSourceDeBaja.sort = this.sortDeBaja;
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
    const normalActivos = this.selectedActivos.filter(sa => sa.modo_adquisicion.id != 2 && sa.modo_adquisicion.id != 25 );
    const adquisicionActivos = this.selectedActivos.filter(sa => sa.modo_adquisicion.id == 2 || sa.modo_adquisicion.id == 25 );
          
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

              const groups = [];
              if (normalActivos.length > 0) groups.push(normalActivos);
              if (adquisicionActivos.length > 0) groups.push(adquisicionActivos);

              let actaCounter = this.numActa;
              for (const group of groups) {
                await this.generateActa(group, actaCounter, documento);
                actaCounter++;
              }

              this.isLoadingResults = false; // Stop loading
              clearTimeout(loadingTimeout); // Clear the timeout if loading is finished
              this.cdr.detectChanges();
            }
          }
        });
      }
    });
  }

  async generateActa(items: any[], numActa: number, documento: string) {
    let dataActa = {
      numActa: numActa,
      anio: this.actaAnio,
      fechaActa: this.fechaActa,
      nombreColegio: "CARRIZAL",
      descActa: this.myForm.value.descripcion,
      items: items,
      formato: documento ? 'pdf' : 'docx',
      acta: 'baja'
    }

    try {
      const response = await firstValueFrom(
        this.gService.excel('generar-acta/', dataActa)
      );
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(response);
      link.download = `ACTA DE BAJA DE BIENES N ${this.numActa}-${this.actaAnio}`;
      link.click();
      
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Activos dados de baja correctamente`,
      });
      this.resetActa();

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Hubo un error al cargar los datos, por favor recargue la página para intentar otra vez o contacte a su administrador. ${error}`,
      });
    }
  }

  resetActa(): void {
    this.myForm.reset(); 
    this.initForm();
    this.selectionAll.clear();
    this.selectionBaja.clear();
    this.activoTablas = [[]];
    this.selectedActivos = [];
    this.inputElement.nativeElement.value = '';
    this.dataSource.filter = '';
    this.loadActivos();
    this.listaDocs();
  }
}

  /*generatePdf(data) {
    this.isLoadingResults = true;  // Start loading
    html2canvas(data, { scale: 2, allowTaint: true }).then(canvas => {
      let HTML_Width = canvas.width;
      let HTML_Height = canvas.height;
      console.log(HTML_Height +"h " + HTML_Width +"w ")
      let top_left_margin = 0.75;
      //  let PDF_Width = HTML_Width + (top_left_margin * 2);
      //  let PDF_Height = (PDF_Width * 1.5) + (top_left_margin * 2);
      let PDF_Width = 612;
      let PDF_Height = 792;
      //  let canvas_image_width = HTML_Width;
      //  let canvas_image_height = HTML_Height;
      let ratio = HTML_Width / HTML_Height;
      console.log(ratio)
      let canvas_image_width = PDF_Width - (top_left_margin * 2);
      let canvas_image_height = canvas_image_width / ratio;

      let totalPDFPages = this.currentRow + 1;

      console.log(totalPDFPages+"paginas")
      canvas.getContext('2d');
      let imgData = canvas.toDataURL("image/jpeg", 3.0);
      //  let pdf = new jspdf('p', 'pt', [PDF_Width, PDF_Height]);
      let pdf = new jspdf('p', 'pt', 'letter');
      pdf.addImage(imgData, 'jpg', top_left_margin, top_left_margin, canvas_image_width, canvas_image_height);
      for (let i = 1; i <= totalPDFPages; i++) {
      //  pdf.addPage([PDF_Width, PDF_Height], 'p');
      pdf.addPage('letter'); // Add a new page of 'letter' size
        pdf.addImage(imgData, 'jpg', top_left_margin, -(PDF_Height * i) + (top_left_margin * 4), canvas_image_width, canvas_image_height);
      }

      pdf.save(`ACTA DE BAJA DE BIENES N ${this.numActa}.pdf`);
      // Convert PDF to Blob
      const pdfBlob = pdf.output('blob');

      // Create FormData and append fields
      const formData = new FormData();
      formData.append('titulo', `ACTA DE BAJA DE BIENES N ${this.numActa}`);
      formData.append('tipo', 'PDF');
      formData.append('archivo', pdfBlob, `ACTA DE BAJA DE BIENES N ${this.numActa}.pdf`);
      formData.append('impreso', '0');

      console.log(formData);
      // const formData = this.myForm.value;
      // console.log("en teoria aqui lo guardaria en el server but comented for andres");
      this.gService.create('guardar-acta/', formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data:any)=>{
        console.log(data);

        this.isLoadingResults = false;  // Start loading
      });
    
      this.darBaja();


      this.isLoadingResults = false;  // Start loading
      
    });
    this.isLoadingResults = false;  // Start loading
  }

  async darBaja() {
    this.toast.warning(`Activos se han dado de baja`, {
      duration: 4000,
      position: 'top-right',
      style: {
        border: '1px solid #ffc107',
        color: '#856404',
        background: '#fff3cd'
      },
      dismissible: true,
    });

    const updatedData = {
      baja: 'DADO DE BAJA CON PLACA'
    };

    // Flatten the nested array
    const flatActivos = this.activoTablas.flat();

    for (const activo of flatActivos) {
      try {
        // Update each activo
        await firstValueFrom(this.gService.patch(`update-activo/${activo.id}/`, updatedData));
        console.log(`Activo ${activo.id} updated successfully`);
      } catch (error) {
        console.error(`Error updating Activo ${activo.id}`);
      }
    }
  }
    
  calcularTablas() {
    this.currentRow = 0;
    this.activoTablas = [[]];

    this.selectedActivos.forEach(activo => {
      const selectedRazon = this.myForm.get('razon').value;
      const textDiv = this.getTextDiv(activo.descripcion);
      const textHeightPx = textDiv.clientHeight + 1;
      const contentheightPx = this.specific.nativeElement.offsetHeight;
      const headerSize = 67;
      const tableHeightLimitPx = (contentheightPx * (this.currentRow == 0 || this.currentRow == this.activoTablas.length - 1 ? 0.51 : 0.75)).toFixed(2);

      let currentPx = this.currentHeightPx + textHeightPx;
      
      if (currentPx + headerSize > (parseFloat(tableHeightLimitPx) * 0.65) && currentPx + headerSize < tableHeightLimitPx) {
        const heightToSetPx = (contentheightPx - ((this.currentRow == 0 ? this.header.nativeElement.offsetHeight : 99.86  ) + (this.currentHeightPx + 1 + headerSize))).toFixed(2);
        const blanco = this.blancos.toArray()[this.currentRow]?.nativeElement;

        if (blanco) {
          this.renderer.setStyle(blanco, 'height', `${heightToSetPx}px`);
        }
        
        if (!this.activoTablas[this.currentRow + 1]) {
          this.activoTablas[this.currentRow + 1] = [];
          this.activoTablas[this.currentRow + 1].push({ ...activo, razon: selectedRazon });
        } else {
          this.activoTablas[this.currentRow].push({ ...activo, razon: selectedRazon });
        }

        this.currentHeightPx = currentPx;
      } else {
        if (currentPx > tableHeightLimitPx) {
          this.currentHeightPx = textHeightPx;
          this.currentRow++;
          this.activoTablas[this.currentRow] = [];
        } else {
          this.currentHeightPx = currentPx;
        }

        this.activoTablas[this.currentRow].push({ ...activo, razon: selectedRazon });
      }
    })
  }
  getTextDiv(text, font = '11pt Calibri') {
    const div = document.getElementById('text-measure');
    div.style.font = font;
    div.style.width = '22.227%';
    div.innerText = text;

    return div;
  }*/
