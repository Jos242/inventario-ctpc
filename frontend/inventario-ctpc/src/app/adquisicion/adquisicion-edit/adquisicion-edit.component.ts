import {Component} from '@angular/core';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
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
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-adquisicion-edit',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatRippleModule, MatTabsModule, MatGridListModule, MatCardModule,
    ReactiveFormsModule,MatButtonModule,MatSelectModule,CommonModule,MatCheckboxModule
  ],
  templateUrl: './adquisicion-edit.component.html',
  styleUrl: './adquisicion-edit.component.scss'
})
export class AdquisicionEditComponent {
  myForm: FormGroup;
  destroy$:Subject<boolean>=new Subject<boolean>();

  adquisicionId: any;

  constructor(private gService:GenericService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private dialog: MatDialog // Add this
  ) {
    this.initForm();
  }

  

  ngOnInit(){
    this.adquisicionId = this.route.snapshot.paramMap.get('id');
    console.log(this.adquisicionId)
    this.cargarDatos();
  }

  initForm(){
    this.myForm = this.formBuilder.group({
      descripcion: ['', [Validators.required, Validators.maxLength(256)]]
    });
  }
  
    cargarDatos() {
      this.gService.list(`modo-adquisicion/${this.adquisicionId}/`)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data:any)=>{
          console.log(data);
          this.myForm.setValue({
            descripcion: data.descripcion
          })
        });
    }

  async onSubmit() {
      if (this.myForm.valid) {
        
        let datas = {
          descripcion: this.myForm.value.descripcion
        };
  
  
        this.gService.patch(`update/modo-adquisicion/${this.adquisicionId}/`, datas)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: 'Activo actualizado correctamente',
            });
            // this.router.navigate(['/activos']);
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un error al actualizar el activo, por favor intente de nuevo.',
            });
          }
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `La contraseña debe tener menos de 128 carácteres.`,
        });
      }
    }
}