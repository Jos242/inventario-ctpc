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
  selector: 'app-usuario-edit',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatRippleModule, MatTabsModule, MatGridListModule, MatCardModule,
    ReactiveFormsModule,MatButtonModule,MatSelectModule,CommonModule,MatCheckboxModule
  ],
  templateUrl: './usuario-edit.component.html',
  styleUrl: './usuario-edit.component.scss'
})
export class UsuarioEditComponent {
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
    this.initForm();
  }

  

  ngOnInit(){
    this.usuarioId = this.route.snapshot.paramMap.get('id');
    console.log(this.usuarioId)
    this.cargarDatos();
  }

  initForm(){
    this.myForm = this.formBuilder.group({
      usuario: ['', [Validators.required, Validators.maxLength(128)]],
      password: ['', Validators.required],
      nombreCompleto: ['', [Validators.required, Validators.maxLength(100)]],
      departamento: ['', Validators.required],
      puesto: ['',  Validators.required],
    });
  }
  
    cargarDatos() {
      this.gService.list(`funcionario/${this.usuarioId}/`)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data:any)=>{
          console.log(data);
          this.myForm.setValue({
            usuario: data.id,
            nombreCompleto: data.identificacion,
            departamento: data.correo,
            puesto: '********',
          })
        });
    }

  async onSubmit() {
  }
}
