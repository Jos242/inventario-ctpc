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
  selector: 'app-usuario-detail',
  standalone: true,
  imports: [MatGridListModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,MatDividerModule,
    MatCheckboxModule,
    MatSliderModule,
    MatMenuModule,
    RouterLink, MatSelectModule, MatDialogModule,
    CommonModule,ReactiveFormsModule, 
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule
  ],
  templateUrl: './usuario-detail.component.html',
  styleUrl: './usuario-detail.component.scss'
})
export class UsuarioDetailComponent {
  datos:any;
  destroy$:Subject<boolean>=new Subject<boolean>();
  usuarioId: any;

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
      this.usuarioId = this.route.snapshot.paramMap.get('id');
      console.log(this.usuarioId)
      this.loadUsuarioDetails(this.usuarioId);
    }

    loadUsuarioDetails(usuarioId: string): void {
      this.gService.list(`funcionario/${usuarioId}/`)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data:any)=>{
          this.datos = data;
          console.log(this.datos);
        });
    }

    onEdit(): void {
      this.router.navigate([`/usuarios/${this.usuarioId}/edit`]);
    }
}
