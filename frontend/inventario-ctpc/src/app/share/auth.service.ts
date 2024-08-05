import { getNgModuleById, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseURL = environment.apiURL; 
  private currentUserKey = 'currentUser';

  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());


  constructor(private http: HttpClient, private router: Router) { 

  }

  login(credentials: { username: string; password: string }): Observable<any> {
    // return this.http.post(`${this.baseURL}iniciar-sesion/`, credentials, { withCredentials: true })
    return this.http.post<any>(`${this.baseURL}login/`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem('authToken', response.access);
          this.loggedInSubject.next(true);
          console.log("login")
          this.router.navigate(['/index']);
        }),
        catchError(error => {

          console.error('Login error:', error);
          return of(null);
        })
      );
  }

 
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isLoggedIn$(): Observable<boolean> {
    return this.loggedInSubject.asObservable();
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.loggedInSubject.next(false);
    this.router.navigate(['/login']);
  }
  

  setCurrentUser(user: any): void {
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
  }

  getCurrentUser(): any {
    const userString = localStorage.getItem(this.currentUserKey);
    return userString ? JSON.parse(userString) : null;
  }

  private hasToken(): boolean {
    return !!localStorage.getItem("authToken");
  }

  
}
