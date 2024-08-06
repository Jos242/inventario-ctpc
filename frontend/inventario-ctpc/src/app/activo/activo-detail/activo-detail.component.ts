import { Component , OnInit, ElementRef} from '@angular/core';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatDividerModule} from '@angular/material/divider';
import {MatSliderModule} from '@angular/material/slider';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatMenuModule} from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { Subject, filter, takeUntil, forkJoin, from, concatMap } from 'rxjs';
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
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BooleanToYesNoPipe } from '../../share/boolean-to-yes-no.pipe';
import Swal from 'sweetalert2';
import { DialogRef } from '@angular/cdk/dialog';
import { Modal } from 'bootstrap'; // Import Modal from Bootstrap



@Component({
  selector: 'app-activo-detail',
  standalone: true,
  imports: [MatGridListModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,MatDividerModule,
    MatCheckboxModule,
    MatSliderModule,
    MatMenuModule,
    RouterLink, 
    CommonModule,ReactiveFormsModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule, MatTooltip, BooleanToYesNoPipe
  ],
  templateUrl: './activo-detail.component.html',
  styleUrl: './activo-detail.component.scss'
})
export class ActivoDetailComponent implements OnInit{
  datos:any;
  datos2:any;
  destroy$:Subject<boolean>=new Subject<boolean>();
  baseUrl: string = environment.apiURL;
  activoId: any;
  activoIdRegistro: any;
  myForm: FormGroup;

  @ViewChild('exampleModal', { static: false }) exampleModal: ElementRef;


  constructor(private gService:GenericService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,

    ){
      
    }

    ngOnInit(): void {
      this.activoId = this.route.snapshot.paramMap.get('id');
      this.loadActivosDetails(this.activoId);

      
      this.myForm = this.formBuilder.group({
        descripcion: ['', Validators.required],
      });
      
    
    }


    loadActivosDetails(activoId: string): void {
      this.gService.list(`activo/${activoId}/`)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data:any)=>{
          this.datos = data;
          console.log(this.datos);
          this.activoIdRegistro=this.datos.id_registro;
          this.loadDetails();
        });

        
    }

    loadDetails(){
      this.gService.list(`observacion/${this.datos.id_registro}/`)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data:any)=>{
          this.datos2 = data;
          console.log(this.datos2);
          if(this.datos2.length!=0){
            this.datos.combinedDescripcion = this.datos2.map(d => d.descripcion).join(' ').replace(/\./g, '.<br> <br>');
          }else{
            this.datos.combinedDescripcion = "Este activo no tiene observaciones"
          }
          
        });
    }

    darBaja(){

    }

    onEdit(): void {
      this.router.navigate([`/activos/${this.activoId}/edit`]);
    }
   

onSubmit() {
  if (this.myForm.valid) {
    let descripcion = this.myForm.value.descripcion;
    const activo = this.activoIdRegistro;

    // Check if the last character is a period, if not, add one
    if (descripcion.charAt(descripcion.length - 1) !== '.') {
      descripcion += '.';
    }

    // Function to split descripcion into chunks of up to 98 characters without breaking words
    const splitDescripcion = (text: string, chunkSize: number) => {
      const chunks = [];
      let start = 0;

      while (start < text.length) {
        let end = start + chunkSize;
        
        // Check for word length exceeding chunk size
        let nextSpace = text.indexOf(' ', start);
        if (nextSpace === -1) nextSpace = text.length;

        if (nextSpace - start > chunkSize) {
          console.error('Error: A single word exceeds the maximum chunk size of 98 characters.');
          // Optional: handle the error as needed, e.g., skip the word or truncate it
          return [];
        }
        
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


     // Split descripcion into chunks of up to 98 characters
     const chunks = splitDescripcion(descripcion, 98);

    // Convert the chunks array into an observable sequence
    from(chunks)
      .pipe(
        concatMap(chunk => {
          const formData = new FormData();
          formData.append('descripcion', chunk);
          formData.append('activo', activo);
          console.log(formData)

          return this.gService.create('nueva-observacion/', formData);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(
        (data: any) => {
          console.log(data);
          Swal.fire({
            icon: 'success',
            title: 'Exito',
            text: 'Se ha agregado la anotacion correctamente.',
          });

          document.getElementById("closeModalButton").click();
          this.loadDetails();
          this.myForm.reset();
        }
  
          
        
      );
      
  }
}

    

    



    // loadActivosDetails(activoId: string): void {
    //   this.gService.list(`activo/${activoId}/`)
    //     .pipe(takeUntil(this.destroy$))
    //     .toPromise()
    //     .then((data: any) => {
    //       this.datos = data;
    //       console.log(this.datos);
    //       return this.gService.list(`observacion/${this.datos.id_registro}/`).toPromise();
    //     })
    //     .then((data: any[]) => {
    //       this.datos2 = data;
    //       console.log(this.datos2);
    
    //       // Combine descriptions
    //       this.datos.combinedDescripcion = this.datos2.map(d => d.descripcion).join(' ');
    //     })
    //     .catch(error => {
    //       console.error('Error loading data', error);
    //     });
    // }
}
