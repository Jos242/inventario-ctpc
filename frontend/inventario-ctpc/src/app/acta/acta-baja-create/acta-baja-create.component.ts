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

  listaActivos(){
    //this.isLoadingResults = true;  // Start loading
    //this.gService.list('activos-filtrados-columna/')
    //  .pipe(takeUntil(this.destroy$))
    //  .subscribe((data:any)=>{
const data = [
  {
    "descripcion": "PROYECTOR",
    "id": 8241,
    "id_registro": "1,138,07",
    "no_identificacion": "6105-4219",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "EXTINTOR",
    "id": 8240,
    "id_registro": "1,138,06",
    "no_identificacion": "6105-4218",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA PROFESOR",
    "id": 8239,
    "id_registro": "1,138,05",
    "no_identificacion": "6105-4217",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8238,
    "id_registro": "1,138,04",
    "no_identificacion": "6105-4216",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8237,
    "id_registro": "1,138,03",
    "no_identificacion": "6105-4215",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8236,
    "id_registro": "1,138,02",
    "no_identificacion": "6105-4214",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8235,
    "id_registro": "1,137,41",
    "no_identificacion": "6105-4213",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8234,
    "id_registro": "1,137,40",
    "no_identificacion": "6105-4212",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8233,
    "id_registro": "1,137,39",
    "no_identificacion": "6105-4211",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8232,
    "id_registro": "1,137,38",
    "no_identificacion": "6105-4210",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8231,
    "id_registro": "1,137,37",
    "no_identificacion": "6105-4209",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8230,
    "id_registro": "1,137,36",
    "no_identificacion": "6105-4208",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8229,
    "id_registro": "1,137,35",
    "no_identificacion": "6105-4207",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8228,
    "id_registro": "1,137,34",
    "no_identificacion": "6105-4206",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8227,
    "id_registro": "1,137,33",
    "no_identificacion": "6105-4205",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8226,
    "id_registro": "1,137,32",
    "no_identificacion": "6105-4204",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8225,
    "id_registro": "1,137,31",
    "no_identificacion": "6105-4203",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8224,
    "id_registro": "1,137,30",
    "no_identificacion": "6105-4202",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8223,
    "id_registro": "1,137,29",
    "no_identificacion": "6105-4201",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8222,
    "id_registro": "1,137,28",
    "no_identificacion": "6105-4200",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8221,
    "id_registro": "1,137,27",
    "no_identificacion": "6105-4199",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8220,
    "id_registro": "1,137,26",
    "no_identificacion": "6105-4198",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8219,
    "id_registro": "1,137,25",
    "no_identificacion": "6105-4197",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8218,
    "id_registro": "1,137,24",
    "no_identificacion": "6105-4196",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8217,
    "id_registro": "1,137,23",
    "no_identificacion": "6105-4195",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8216,
    "id_registro": "1,137,22",
    "no_identificacion": "6105-4194",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8215,
    "id_registro": "1,137,21",
    "no_identificacion": "6105-4193",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8214,
    "id_registro": "1,137,20",
    "no_identificacion": "6105-4192",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8213,
    "id_registro": "1,137,19",
    "no_identificacion": "6105-4191",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8212,
    "id_registro": "1,137,18",
    "no_identificacion": "6105-4190",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8211,
    "id_registro": "1,137,17",
    "no_identificacion": "6105-4189",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8210,
    "id_registro": "1,137,16",
    "no_identificacion": "6105-4188",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8209,
    "id_registro": "1,137,15",
    "no_identificacion": "6105-4187",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8208,
    "id_registro": "1,137,14",
    "no_identificacion": "6105-4186",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8207,
    "id_registro": "1,137,13",
    "no_identificacion": "6105-4185",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8206,
    "id_registro": "1,137,12",
    "no_identificacion": "6105-4184",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8205,
    "id_registro": "1,137,11",
    "no_identificacion": "6105-4183",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8204,
    "id_registro": "1,137,10",
    "no_identificacion": "6105-4182",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8203,
    "id_registro": "1,137,09",
    "no_identificacion": "6105-4181",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8202,
    "id_registro": "1,137,08",
    "no_identificacion": "6105-4180",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8201,
    "id_registro": "1,137,07",
    "no_identificacion": "6105-4179",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8200,
    "id_registro": "1,137,06",
    "no_identificacion": "6105-4178",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8199,
    "id_registro": "1,137,05",
    "no_identificacion": "6105-4177",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8198,
    "id_registro": "1,137,04",
    "no_identificacion": "6105-4176",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8197,
    "id_registro": "1,137,03",
    "no_identificacion": "6105-4175",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8196,
    "id_registro": "1,137,02",
    "no_identificacion": "6105-4174",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8195,
    "id_registro": "1,137,01",
    "no_identificacion": "6105-4173",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8194,
    "id_registro": "1,136,41",
    "no_identificacion": "6105-4172",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8193,
    "id_registro": "1,136,40",
    "no_identificacion": "6105-4171",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8192,
    "id_registro": "1,136,39",
    "no_identificacion": "6105-4170",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8191,
    "id_registro": "1,136,38",
    "no_identificacion": "6105-4169",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8190,
    "id_registro": "1,136,37",
    "no_identificacion": "6105-4168",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8189,
    "id_registro": "1,136,36",
    "no_identificacion": "6105-4167",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8188,
    "id_registro": "1,136,35",
    "no_identificacion": "6105-4166",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8187,
    "id_registro": "1,136,34",
    "no_identificacion": "6105-4165",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8186,
    "id_registro": "1,136,33",
    "no_identificacion": "6105-4164",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8185,
    "id_registro": "1,136,32",
    "no_identificacion": "6105-4163",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8184,
    "id_registro": "1,136,31",
    "no_identificacion": "6105-4162",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8183,
    "id_registro": "1,136,30",
    "no_identificacion": "6105-4161",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8182,
    "id_registro": "1,136,29",
    "no_identificacion": "6105-4160",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8181,
    "id_registro": "1,136,28",
    "no_identificacion": "6105-4159",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8180,
    "id_registro": "1,136,27",
    "no_identificacion": "6105-4158",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8179,
    "id_registro": "1,136,26",
    "no_identificacion": "6105-4157",
    "ubicacion_original": "Ejecutivo"
  },{
    "descripcion": "PROYECTOR",
    "id": 8241,
    "id_registro": "1,138,07",
    "no_identificacion": "6105-4219",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "EXTINTOR",
    "id": 8240,
    "id_registro": "1,138,06",
    "no_identificacion": "6105-4218",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA PROFESOR",
    "id": 8239,
    "id_registro": "1,138,05",
    "no_identificacion": "6105-4217",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8238,
    "id_registro": "1,138,04",
    "no_identificacion": "6105-4216",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8237,
    "id_registro": "1,138,03",
    "no_identificacion": "6105-4215",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8236,
    "id_registro": "1,138,02",
    "no_identificacion": "6105-4214",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8235,
    "id_registro": "1,137,41",
    "no_identificacion": "6105-4213",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8234,
    "id_registro": "1,137,40",
    "no_identificacion": "6105-4212",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8233,
    "id_registro": "1,137,39",
    "no_identificacion": "6105-4211",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8232,
    "id_registro": "1,137,38",
    "no_identificacion": "6105-4210",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8231,
    "id_registro": "1,137,37",
    "no_identificacion": "6105-4209",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8230,
    "id_registro": "1,137,36",
    "no_identificacion": "6105-4208",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8229,
    "id_registro": "1,137,35",
    "no_identificacion": "6105-4207",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8228,
    "id_registro": "1,137,34",
    "no_identificacion": "6105-4206",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8227,
    "id_registro": "1,137,33",
    "no_identificacion": "6105-4205",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8226,
    "id_registro": "1,137,32",
    "no_identificacion": "6105-4204",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8225,
    "id_registro": "1,137,31",
    "no_identificacion": "6105-4203",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8224,
    "id_registro": "1,137,30",
    "no_identificacion": "6105-4202",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8223,
    "id_registro": "1,137,29",
    "no_identificacion": "6105-4201",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8222,
    "id_registro": "1,137,28",
    "no_identificacion": "6105-4200",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8221,
    "id_registro": "1,137,27",
    "no_identificacion": "6105-4199",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8220,
    "id_registro": "1,137,26",
    "no_identificacion": "6105-4198",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8219,
    "id_registro": "1,137,25",
    "no_identificacion": "6105-4197",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8218,
    "id_registro": "1,137,24",
    "no_identificacion": "6105-4196",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8217,
    "id_registro": "1,137,23",
    "no_identificacion": "6105-4195",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8216,
    "id_registro": "1,137,22",
    "no_identificacion": "6105-4194",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8215,
    "id_registro": "1,137,21",
    "no_identificacion": "6105-4193",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8214,
    "id_registro": "1,137,20",
    "no_identificacion": "6105-4192",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8213,
    "id_registro": "1,137,19",
    "no_identificacion": "6105-4191",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8212,
    "id_registro": "1,137,18",
    "no_identificacion": "6105-4190",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8211,
    "id_registro": "1,137,17",
    "no_identificacion": "6105-4189",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8210,
    "id_registro": "1,137,16",
    "no_identificacion": "6105-4188",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8209,
    "id_registro": "1,137,15",
    "no_identificacion": "6105-4187",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8208,
    "id_registro": "1,137,14",
    "no_identificacion": "6105-4186",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8207,
    "id_registro": "1,137,13",
    "no_identificacion": "6105-4185",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8206,
    "id_registro": "1,137,12",
    "no_identificacion": "6105-4184",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8205,
    "id_registro": "1,137,11",
    "no_identificacion": "6105-4183",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8204,
    "id_registro": "1,137,10",
    "no_identificacion": "6105-4182",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8203,
    "id_registro": "1,137,09",
    "no_identificacion": "6105-4181",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8202,
    "id_registro": "1,137,08",
    "no_identificacion": "6105-4180",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8201,
    "id_registro": "1,137,07",
    "no_identificacion": "6105-4179",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8200,
    "id_registro": "1,137,06",
    "no_identificacion": "6105-4178",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8199,
    "id_registro": "1,137,05",
    "no_identificacion": "6105-4177",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8198,
    "id_registro": "1,137,04",
    "no_identificacion": "6105-4176",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8197,
    "id_registro": "1,137,03",
    "no_identificacion": "6105-4175",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8196,
    "id_registro": "1,137,02",
    "no_identificacion": "6105-4174",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8195,
    "id_registro": "1,137,01",
    "no_identificacion": "6105-4173",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8194,
    "id_registro": "1,136,41",
    "no_identificacion": "6105-4172",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8193,
    "id_registro": "1,136,40",
    "no_identificacion": "6105-4171",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8192,
    "id_registro": "1,136,39",
    "no_identificacion": "6105-4170",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8191,
    "id_registro": "1,136,38",
    "no_identificacion": "6105-4169",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8190,
    "id_registro": "1,136,37",
    "no_identificacion": "6105-4168",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8189,
    "id_registro": "1,136,36",
    "no_identificacion": "6105-4167",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8188,
    "id_registro": "1,136,35",
    "no_identificacion": "6105-4166",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8187,
    "id_registro": "1,136,34",
    "no_identificacion": "6105-4165",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8186,
    "id_registro": "1,136,33",
    "no_identificacion": "6105-4164",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8185,
    "id_registro": "1,136,32",
    "no_identificacion": "6105-4163",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8184,
    "id_registro": "1,136,31",
    "no_identificacion": "6105-4162",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8183,
    "id_registro": "1,136,30",
    "no_identificacion": "6105-4161",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8182,
    "id_registro": "1,136,29",
    "no_identificacion": "6105-4160",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8181,
    "id_registro": "1,136,28",
    "no_identificacion": "6105-4159",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8180,
    "id_registro": "1,136,27",
    "no_identificacion": "6105-4158",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8179,
    "id_registro": "1,136,26",
    "no_identificacion": "6105-4157",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8178,
    "id_registro": "1,136,25",
    "no_identificacion": "6105-4156",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8177,
    "id_registro": "1,136,24",
    "no_identificacion": "6105-4155",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8176,
    "id_registro": "1,136,23",
    "no_identificacion": "6105-4154",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8175,
    "id_registro": "1,136,22",
    "no_identificacion": "6105-4153",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8174,
    "id_registro": "1,136,21",
    "no_identificacion": "6105-4152",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8173,
    "id_registro": "1,136,20",
    "no_identificacion": "6105-4151",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8172,
    "id_registro": "1,136,19",
    "no_identificacion": "6105-4150",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8171,
    "id_registro": "1,136,18",
    "no_identificacion": "6105-4149",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8170,
    "id_registro": "1,136,17",
    "no_identificacion": "6105-4148",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8169,
    "id_registro": "1,136,16",
    "no_identificacion": "6105-4147",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8168,
    "id_registro": "1,136,15",
    "no_identificacion": "6105-4146",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8167,
    "id_registro": "1,136,14",
    "no_identificacion": "6105-4145",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8166,
    "id_registro": "1,136,13",
    "no_identificacion": "6105-4144",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8165,
    "id_registro": "1,136,12",
    "no_identificacion": "6105-4143",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8164,
    "id_registro": "1,136,11",
    "no_identificacion": "6105-4142",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8163,
    "id_registro": "1,136,10",
    "no_identificacion": "6105-4141",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8162,
    "id_registro": "1,136,09",
    "no_identificacion": "6105-4140",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8161,
    "id_registro": "1,136,08",
    "no_identificacion": "6105-4139",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8160,
    "id_registro": "1,136,07",
    "no_identificacion": "6105-4138",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8159,
    "id_registro": "1,136,06",
    "no_identificacion": "6105-4137",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8158,
    "id_registro": "1,136,05",
    "no_identificacion": "6105-4136",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8157,
    "id_registro": "1,136,04",
    "no_identificacion": "6105-4135",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8156,
    "id_registro": "1,136,03",
    "no_identificacion": "6105-4134",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8155,
    "id_registro": "1,136,02",
    "no_identificacion": "6105-4133",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8154,
    "id_registro": "1,136,01",
    "no_identificacion": "6105-4132",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8153,
    "id_registro": "1,135,22",
    "no_identificacion": "6105-4131",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8152,
    "id_registro": "1,135,21",
    "no_identificacion": "6105-4130",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8151,
    "id_registro": "1,135,20",
    "no_identificacion": "6105-4129",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8150,
    "id_registro": "1,135,19",
    "no_identificacion": "6105-4128",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8149,
    "id_registro": "1,135,18",
    "no_identificacion": "6105-4127",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8148,
    "id_registro": "1,135,17",
    "no_identificacion": "6105-4126",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8147,
    "id_registro": "1,135,16",
    "no_identificacion": "6105-4125",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8146,
    "id_registro": "1,135,15",
    "no_identificacion": "6105-4124",
    "ubicacion_original": "Ejecutivo"
  },
  {
    "descripcion": "SILLA EJECUTIVA NEGRA",
    "id": 8145,
    "id_registro": "1,135,14",
    "no_identificacion": "6105-4123",
    "ubicacion_original": "Ejecutivo"
  }
];

        this.datosActivos = data;
        this.dataSource.data = data;
        // this.dataSource.data = data;

        this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
        console.log(this.datosActivos);
        // this.isLoadingResults = false; // Stop loading
    //  });
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
