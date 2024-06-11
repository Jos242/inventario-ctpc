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

@Component({
  selector: 'app-activo-create',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatRippleModule, MatTabsModule, MatGridListModule, MatCardModule,
    ReactiveFormsModule,MatButtonModule,MatSelectModule,CommonModule,
  ],
  templateUrl: './activo-create.component.html',
  styleUrl: './activo-create.component.scss'
})
export class ActivoCreateComponent {
  myForm: FormGroup;
  destroy$:Subject<boolean>=new Subject<boolean>();

  constructor(private gService:GenericService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    private authService: AuthService,
  ) {

  }

  ngOnInit(){

    this.myForm = this.formBuilder.group({
      descripcion: ['', Validators.required],
      ubicacion: ['', Validators.required],
      modo_adquisicion: ['', Validators.required],
      marca: ['', ],
      modelo: ['', ],
      serie:['', ],
      estado:['', Validators.required ],
      precio:['', ],
    });


    
  }

  onSubmit() {
    if (this.myForm.valid) {
      // this.myForm.value.pimgspath=this.logo;
      const formData = new FormData();
      // const formData = this.myForm.value;
      formData.append('descripcion', this.myForm.value.descripcion);
      formData.append('ubicacion', this.myForm.value.ubicacion);
      formData.append('modo_adquisicion', this.myForm.value.modo_adquisicion);
      formData.append('marca', this.myForm.value.modelo);
      formData.append('serie', this.myForm.value.serie);
      formData.append('estado', this.myForm.value.estado);
      formData.append('precio', this.myForm.value.precio);


  
      console.log(formData);
      // const formData = this.myForm.value;
      this.gService.create('agregar-activo/', formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data:any)=>{
        console.log(data);

        this.myForm.reset();
      });

      
    }
  }
}
