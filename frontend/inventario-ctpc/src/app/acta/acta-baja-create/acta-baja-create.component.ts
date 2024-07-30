import {AfterViewInit, Component, ViewChild,  ElementRef, Renderer2} from '@angular/core';
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

 
  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['no_identificacion', 'descripcion', 'marca', 'modelo', 'serie'];


  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  destroy$:Subject<boolean>=new Subject<boolean>();

  selectedActivos: any[] = []; // Array to store selected activos

  @ViewChild('contentToConvert') contentToConvert!: ElementRef;
  @ViewChild('firstTable') firstTable!: ElementRef;
  @ViewChild('secondTable') secondTable!: ElementRef;

  


  constructor(private gService:GenericService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private renderer: Renderer2
  ) {
    
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
    this.listaActivos();

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
    this.myForm.reset(); 
    this.selectedActivos = []; 
  }

  selectActivo(activo: any): void {

    let heightTabla = 0;
    const selectedRazon = this.myForm.get('razon').value;

    // Add the activo with the selected reason to the array if it's not already present
    if (!this.selectedActivos.some(a => a.no_identificacion === activo.no_identificacion)) {
      this.selectedActivos.push({ ...activo, razon: selectedRazon });
      console.log(this.selectedActivos);
      heightTabla = this.calculateHeightPercentage();
      if(heightTabla>51){
        
        
      }

    }
    // Update the form control with the array
    this.myForm.patchValue({ activo: this.selectedActivos.join(', ') });
  }

  calculateHeightPercentage(): number {
    const contentHeight = this.contentToConvert.nativeElement.offsetHeight;

    const secondTableHeight = this.secondTable.nativeElement.offsetHeight;


    const secondTableHeightPercentage = (secondTableHeight / contentHeight) * 100;

    console.log(`Second table height percentage: ${secondTableHeightPercentage}%`);

    // Use Renderer2 to dynamically set styles or handle further logic

    
    return secondTableHeightPercentage;


  }


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

  listaActivos(){
    // this.isLoadingResults = true;  // Start loading
    this.gService.list('activos-filtrados-columna/')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data:any)=>{
        this.datosActivos = data;
        this.dataSource.data = data;
        // this.dataSource.data = data;

        this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
        console.log(this.datosActivos);
        // this.isLoadingResults = false; // Stop loading
      });
  }

  generatePdf(data) {
    html2canvas(data, { scale: 2, allowTaint: true }).then(canvas => {
     let HTML_Width = canvas.width;
     let HTML_Height = canvas.height;
     console.log(HTML_Height +"h " + HTML_Width +"w ")
     let top_left_margin = 15;
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

     let totalPDFPages = Math.ceil(HTML_Height / PDF_Height) - 1;

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

      pdf.save("HTML-Document.pdf");
      // Convert PDF to Blob
      const pdfBlob = pdf.output('blob');

      // Create FormData and append fields
      const formData = new FormData();
      formData.append('titulo', 'pdf-one');
      formData.append('tipo', 'PDF');
      formData.append('archivo', pdfBlob, 'document.pdf');
      formData.append('impreso', '0');

      console.log(formData);
      // const formData = this.myForm.value;
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
