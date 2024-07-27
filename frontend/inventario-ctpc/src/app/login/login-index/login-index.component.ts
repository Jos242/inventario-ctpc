import { Component , OnInit} from '@angular/core';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { RouterLink } from '@angular/router';
import { Subject, filter, takeUntil, forkJoin, from, concatMap } from 'rxjs';
import { GenericService } from '../../share/generic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient} from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../share/auth.service';

@Component({
  selector: 'app-login-index',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, FormsModule, RouterLink,CommonModule, ReactiveFormsModule, MatFormFieldModule,
    MatGridListModule, MatIconModule,  MatInputModule
  ],
  templateUrl: './login-index.component.html',
  styleUrl: './login-index.component.scss'
})
export class LoginIndexComponent implements OnInit{
  myForm: FormGroup;

  destroy$:Subject<boolean>=new Subject<boolean>();
  baseUrl: string = environment.apiURL;


  constructor(private gService:GenericService,
    private router:Router,
    private route:ActivatedRoute,
    private httpClient:HttpClient,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    ){

      this.myForm = this.formBuilder.group({
        usuario: ['', Validators.required],
        password: ['', Validators.required]

      });
      
      
    }

    ngOnInit(): void {
      if(this.authService.isAuthenticated){
        // this.router.navigate(['/index']);
        console.log("hay usaurio")
      }
      
    }

    onSubmit(){
      this.authService.login({ username: this.myForm.get('usuario').value, password: this.myForm.get('password').value }).subscribe(response => {
        if (response) {
          this.authService.setCurrentUser(response.username);
          this.router.navigate(['/index']);
        } else {
          console.error('Login failed');
          
        }
      });
      
    }

}
