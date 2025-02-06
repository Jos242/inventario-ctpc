import { Component } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient} from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule} from '@angular/material/paginator';
import { MatSortModule} from '@angular/material/sort';
import { MatTableModule} from '@angular/material/table';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { HotToastService } from '@ngxpert/hot-toast';

import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationService } from '../../share/confirmation.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-adquisicion-detail',
  standalone: true,
  imports: [MatGridListModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,MatDividerModule,
    MatCheckboxModule,
    MatSliderModule,
    MatMenuModule,
    RouterLink, MatSelectModule, MatDialogModule,
    CommonModule,ReactiveFormsModule, 
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule
  ],
  templateUrl: './adquisicion-detail.component.html',
  styleUrl: './adquisicion-detail.component.scss'
})
export class AdquisicionDetailComponent {
  datos:any;
  destroy$:Subject<boolean>=new Subject<boolean>();
  adquisicionId: any;

  constructor(private gService:GenericService,
    private toast: HotToastService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    public dialog: MatDialog,
    public confirmationService: ConfirmationService
    ){
      
    }
    

    ngOnInit(): void {
      this.adquisicionId = this.route.snapshot.paramMap.get('id');
      this.loadAdquisicionDetails(this.adquisicionId);
    }

    loadAdquisicionDetails(adquisicionId: string): void {
      this.gService.list(`modo-adquisicion/${adquisicionId}/`)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data:any)=>{
          this.datos = data;
        });
    }

    onEdit(): void {
      this.router.navigate([`/adquisiciones/${this.adquisicionId}/edit`]);
    }
        
    borrarAdquisicion() {
      this.confirmationService.confirm()
      .subscribe(result => {
        if (result) {
          this.gService.delete(`delete/modo-adquisicion/${this.adquisicionId}/`)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                Swal.fire({
                  icon: 'success',
                  title: 'Borrado',
                  text: `Modo de adquisición borrado correctamente`,
                });

                this.router.navigate([`/adquisiciones`]);
              },
              error: () => {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'Hubo un problema al borrar el modo de adquisición',
                });
              }
            });
        }
      });
    }
}