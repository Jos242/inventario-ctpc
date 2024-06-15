import {Component} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {FormsModule} from '@angular/forms';
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, filter, takeUntil, forkJoin, from, concatMap } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient} from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login-index',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, FormsModule, RouterLink,CommonModule],
  templateUrl: './login-index.component.html',
  styleUrl: './login-index.component.scss'
})
export class LoginIndexComponent {
  myForm: FormGroup;

  destroy$:Subject<boolean>=new Subject<boolean>();
  baseUrl: string = environment.apiURL;


  constructor(private gService:GenericService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    ){

      this.myForm = this.formBuilder.group({
        usuario: ['', Validators.required],
        password: ['', Validators.required]

      });
      
      
    }

}
