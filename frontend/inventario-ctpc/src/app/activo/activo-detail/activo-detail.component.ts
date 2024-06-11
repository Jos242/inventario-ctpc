import { Component , OnInit} from '@angular/core';
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
import { Subject, filter, takeUntil } from 'rxjs';
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



@Component({
  selector: 'app-activo-detail',
  standalone: true,
  imports: [MatGridListModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule,MatDividerModule,
    MatCheckboxModule,
    MatSliderModule,
    MatMenuModule,
    RouterLink, 
    CommonModule,
    MatTableModule, MatSortModule, MatPaginatorModule, MatProgressSpinnerModule, MatTooltip
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

  constructor(private gService:GenericService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer
    ){
      
    }

    ngOnInit(): void {
      const activoId = this.route.snapshot.paramMap.get('id');
      this.loadActivosDetails(activoId);
    }


    loadActivosDetails(activoId: string): void {
      this.gService.list(`activo/${activoId}/`)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data:any)=>{
          this.datos = data;
          console.log(this.datos);
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
