import {AfterViewInit, Component, ViewChild,  ElementRef, Renderer2, ViewChildren, QueryList} from '@angular/core';
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

import Swal from 'sweetalert2';

import moment from 'moment';
import 'moment/locale/es';



import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

import jspdf from 'jspdf';
import html2canvas from 'html2canvas';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-acta-baja-create',
  standalone: true,
  imports: [
    MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatRippleModule, MatTabsModule, MatGridListModule, MatCardModule,
    ReactiveFormsModule,MatButtonModule,MatSelectModule,CommonModule,
  ],
  templateUrl: './acta-baja-create.component.html',
  styleUrl: './acta-baja-create.component.scss'
})
export class ActaBajaCreateComponent {
  numActa: any;
  fechaActa: any;
  ahno: any;
  descActa: any;

  datos: any;
  datosActivos:any;
  myForm: FormGroup;

  id: any;
  desc: any;
  marca: any;
  modelo: any;
  serie: any;
  obs: any;
  ins: any;

  isLoadingResults:any;

 
  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['no_identificacion', 'descripcion', 'marca', 'modelo', 'serie'];

  activoTablas: any[] = [[]];
  currentRow: any = 0;
  currentHeightPx: any = 0.00;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  destroy$:Subject<boolean>=new Subject<boolean>();

  selectedActivos: any[] = []; // Array to store selected activos
  activosForm: any[] = []; // Array to store selected activos

  @ViewChild('specific') specific!: ElementRef;
  @ViewChild('firstTable') firstTable!: ElementRef;
  @ViewChild('header') header!: ElementRef;
  @ViewChildren('blanco') blancos: QueryList<ElementRef>;

  filtros: FormGroup;
  


  constructor(private gService:GenericService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private renderer: Renderer2
  ) {
    this.filtros = this.formBuilder.group({
      id_registro: false,
      no_identificacion: true,
      descripcion: true,
      marca: true,
      modelo: true,
      serie: true,
      estado: false,
      impreso: false,
      ubicacion_original_alias: false,
      ubicacion_actual_alias: false,
      modo_adquisicion_desc: false,
      precio: false,
      conectividad: false,
      seguridad: false,
      placa: false,
      baja: false,
      fecha: false,
    });

    this.loadActivos();
    
      moment.locale('es'); // Set locale to Spanish
  }

  ngOnInit(){
    this.myForm = this.formBuilder.group({
      descripcion: ['', Validators.required],
      activo: ['', Validators.required],
      razon: ['', Validators.required],
      search: [''] 

    });

    

    this.listaDocs();

    this.myForm.get('search')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.applyFilter(value);
      });

  

    
  }

  

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  resetActa(): void {
    // this.myForm.reset(); 
    // this.selectedActivos = []; 
    window.location.reload();
  }

  selectActivo(activo: any): void {

    let heightTabla = 0;

    // Add the activo with the selected reason to the array if it's not already present
    // Solo lo hace con el row actual, ver despues que
    if (!this.activoTablas[this.currentRow].some(a => a.no_identificacion === activo.no_identificacion)) {
      //heightTabla = this.calculateHeightPercentage();
      this.calcularTablas(activo);
    }
    // Update the form control with the array
    this.myForm.patchValue({ activo: this.activosForm.join(', ') });
  }
  
  calcularTablas(activo) {
    const selectedRazon = this.myForm.get('razon').value;
    
    const textDiv = this.getTextDiv(activo.descripcion);
    const textHeightPx = textDiv.clientHeight + 1;
    
    const contentheightPx = this.specific.nativeElement.offsetHeight;

    let currentPx = this.currentHeightPx + textHeightPx;

    const headerSize = 67;

    
    const tableHeightLimitPx = (contentheightPx * (this.currentRow == 0 || this.currentRow == this.activoTablas.length - 1 ? 0.51 : 0.75)).toFixed(2);
    
    if (currentPx > (parseFloat(tableHeightLimitPx) * 0.65) && currentPx < tableHeightLimitPx) {
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
    this.activosForm.push({ ...activo, razon: selectedRazon });
    console.log((this.currentHeightPx))
  }

  getTextDiv(text, font = '11pt Calibri') {
    const div = document.getElementById('text-measure');
    div.style.font = font;
    div.style.width = '22.227%';
    
    div.innerText = text;
    return div;
  }

  /*
  calculateHeightPercentage(): number {
    const contentHeight = this.contentToConvert.nativeElement.offsetHeight;

    const secondTableHeight = this.secondTable.nativeElement.offsetHeight;


    const secondTableHeightPercentage = (secondTableHeight / contentHeight) * 100;

    console.log(`Second table height percentage: ${secondTableHeightPercentage}%`);

    // Use Renderer2 to dynamically set styles or handle further logic

    
    return secondTableHeightPercentage;


  }
*/

  listaDocs(){
    
    this.gService.list('obtener-documentos/')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data:any)=>{
        this.datos = data;

        console.log(this.datos);

        const currentYear = new Date().getFullYear();
        const docsThisYear = this.datos.filter(doc => new Date(doc.creado_el).getFullYear() === currentYear);
        const numDocsThisYear = docsThisYear.length + 1;

        this.numActa = `${numDocsThisYear}-${currentYear}`;
        this.fechaActa = moment().format('dddd D [de] MMMM YYYY');
        this.ahno = currentYear;

      });
  }



  loadActivos(){
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
          // Count the number of items where datos.placa is false
          this.datosActivos = data;
          this.dataSource.data = data;
          this.dataSource.data = data;

          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          console.log(this.datosActivos);
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

  generatePdf(data) {
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

      });

      
   });
 }

 onSubmit() {
  if (this.myForm.valid) {
    // this.myForm.value.pimgspath=this.logo;
    const formData = new FormData();
    // const formData = this.myForm.value;
    formData.append('descripcion', this.myForm.value.descripcion);
    formData.append('activo', this.myForm.value.activo);
    formData.append('razon', this.myForm.value.razon);
    this.descActa=this.myForm.value.descripcion;



    console.log(formData);
    // const formData = this.myForm.value;


    
  }
}


 
}
