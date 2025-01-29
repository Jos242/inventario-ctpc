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
  selector: 'app-ubicacion-create',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatRippleModule, MatTabsModule, MatGridListModule, MatCardModule,
    ReactiveFormsModule,MatButtonModule,MatSelectModule,CommonModule,MatCheckboxModule
  ],
  templateUrl: './ubicacion-create.component.html',
  styleUrl: './ubicacion-create.component.scss'
})
export class UbicacionCreateComponent {
  myForm: FormGroup;
  destroy$:Subject<boolean>=new Subject<boolean>();

  tipoUsuarios: { id: string, descripcion: string }[] = [
    { id: 'FUNCIONARIO', descripcion: 'Funcionario' },
    { id: 'ADMINISTRADOR', descripcion: 'Administrador' },
    { id: 'OBSERVADOR', descripcion: 'Observador' }
  ];

  constructor(private gService:GenericService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private dialog: MatDialog // Add this
  ) {
  }

  

  ngOnInit(){
    this.initForm();
  }

  initForm(){
    this.myForm = this.formBuilder.group({
      nombreOficial: ['', [Validators.required, Validators.maxLength(128)]],
      alias: ['', [Validators.required, Validators.maxLength(128)]],
      funcionario: ['']
    });
  }

  async onSubmit() {
    if (this.myForm.valid) {
      
      let datas = {
        nombre_oficial: this.myForm.value.nombreOficial,
        alias: this.myForm.value.alias,
        funcionario_id: this.myForm.value.funcionario
      };


      this.gService.create('nueva-ubicacion/', datas)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data:any)=>{
        console.log(data)
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `El nombre debe tener menos de 128 carácteres.`,
      });
    }
  }
}
