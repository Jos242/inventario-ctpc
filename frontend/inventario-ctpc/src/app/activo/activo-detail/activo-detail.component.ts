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
import { MatSelectModule } from '@angular/material/select';
import Swal from 'sweetalert2';
import { DialogRef } from '@angular/cdk/dialog';
import { HotToastService } from '@ngxpert/hot-toast';

import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { AddAnnotationDialogComponent } from '../../add-annotation-dialog/add-annotation-dialog.component';



@Component({
  selector: 'app-activo-detail',
  standalone: true,
  imports: [MatGridListModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,MatDividerModule,
    MatCheckboxModule,
    MatSliderModule,
    MatMenuModule,
    RouterLink, MatSelectModule, MatDialogModule,
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
  datosActivos:any;
  myForm: FormGroup;
  agregar: FormGroup;
  filtros: FormGroup;
  public isLoadingResults = false;




  constructor(private gService:GenericService,
    private toast: HotToastService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    public dialog: MatDialog,

    ){
      
    }
    

    ngOnInit(): void {

      this.activoId = this.route.snapshot.paramMap.get('id');
      this.loadActivosDetails(this.activoId);
      

      
      this.myForm = this.formBuilder.group({
        descripcion: ['', Validators.required],
        no_identificacion: [this.activoId, Validators.required],
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

    openDialog(): void {
      const dialogRef = this.dialog.open(AddAnnotationDialogComponent, {
        width: '600px', // Adjust the width as needed
        data: { activoIdRegistro: this.activoIdRegistro, activoId: this.activoId }
      });
    
      dialogRef.afterClosed().subscribe(result => {
        this.loadDetails();
        this.myForm.reset();
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
      this.toast.warning(`Activo se ha marcado para dar de baja, por favor cree el acta de baja`, {
        duration: 4000,
        position: 'top-right',
        style: {
          border: '1px solid #ffc107',
          color: '#856404',
          background: '#fff3cd'
        },
        dismissible: true,
      });
    }

    onEdit(): void {
      this.router.navigate([`/activos/${this.activoId}/edit`]);
    }


}
