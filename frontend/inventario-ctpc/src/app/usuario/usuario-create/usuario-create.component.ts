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
  selector: 'app-usuario-create',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatRippleModule, MatTabsModule, MatGridListModule, MatCardModule,
    ReactiveFormsModule,MatButtonModule,MatSelectModule,CommonModule,MatCheckboxModule
  ],
  templateUrl: './usuario-create.component.html',
  styleUrl: './usuario-create.component.scss'
})
export class UsuarioCreateComponent {
  myForm: FormGroup;
  destroy$:Subject<boolean>=new Subject<boolean>();

  usuarioId: any;

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
      tipoUsuario: ['FUNCIONARIO', Validators.required],
      usuario: ['', [Validators.required, Validators.maxLength(128)]],
      password: ['', Validators.required],
      nombreCompleto: ['', [Validators.required, Validators.maxLength(100)]],
      departamento: ['', Validators.required],
      puesto: ['',  Validators.required],
    });

    this.myForm.get('tipoUsuario')?.valueChanges.subscribe((tipoUsuario) => {
      if (tipoUsuario === 'FUNCIONARIO') {
        this.myForm.get('nombreCompleto')?.setValidators(Validators.required);
        this.myForm.get('departamento')?.setValidators(Validators.required);
        this.myForm.get('puesto')?.setValidators(Validators.required);
      } else {
        this.myForm.get('nombreCompleto')?.clearValidators();
        this.myForm.get('departamento')?.clearValidators();
        this.myForm.get('puesto')?.clearValidators();
      }
  
      // Update the validation status for the fields
      this.myForm.get('nombreCompleto')?.updateValueAndValidity();
      this.myForm.get('departamento')?.updateValueAndValidity();
      this.myForm.get('puesto')?.updateValueAndValidity();
    });
  }

  tipoUsuarioChange() {
    if (this.myForm.get('tipoUsuario').value == 'ADMINISTRADOR') {
      Swal.fire({
        icon: 'warning',
        title: 'Administrador',
        text: 'Esta apunto de crear un usuario administrador, este usuario tiene acceso a toda la funcionalidad del sistema y no puede ser borrado.',
      });
    }
  }

  async onSubmit() {
    if (this.myForm.valid) {
      
      let datas = {
        username: this.myForm.value.usuario,
        password: this.myForm.value.password,
        user_type: this.myForm.value.tipoUsuario,
        nombre_completo: this.myForm.value.nombreCompleto,
        departamento: this.myForm.value.departamento,
        puesto: this.myForm.value.puesto
      };


      this.gService.create('crear-usuario/', datas)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data:any)=>{
        console.log(data)
        if (data.username && data.username[0]) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `${data.username[0]}`,
          });
        } else if (data.password && data.password[0]){
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `${data.password[0]}`,
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'El usuario se ha creado correctamente',
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
