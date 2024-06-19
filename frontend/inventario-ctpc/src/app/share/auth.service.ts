import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseURL = environment.apiURL; 
  private currentUserKey = 'currentUser';


  constructor(private http: HttpClient, private router: Router) { 

  }

  login(credentials: { username: string; password: string }): Observable<any> {
    // return this.http.post(`${this.baseURL}iniciar-sesion/`, credentials, { withCredentials: true })
    return this.http.post(`${this.baseURL}iniciar-sesion/`, credentials)
      .pipe(
        tap(response => {

          console.log("login")
          this.router.navigate(['/index']);
        }),
        catchError(error => {

          console.error('Login error:', error);
          return of(null);
        })
      );
  }

  logout(): void {
    this.http.post(`${this.baseURL}salir/`, {})
      .subscribe(
        () => {
          console.log("logout1")
          localStorage.clear(); 
          sessionStorage.clear();

          // Clear cookies
          document.cookie = 'csrftoken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          document.cookie = 'sessionid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

          this.router.navigate(['/login']);
          console.log("logout2")
        }
      );
  }
  

  setCurrentUser(user: any): void {
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
  }

  getCurrentUser(): any {
    const userString = localStorage.getItem(this.currentUserKey);
    return userString ? JSON.parse(userString) : null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}
