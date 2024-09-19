import { getNgModuleById, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseURL = environment.apiURL; 
  private currentUserKey = 'currentUser';
  private currentUserType = 'userType';

  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private currentUserSubject = new BehaviorSubject<any>(this.getCurrentUser());
  private userTypeSubject = new BehaviorSubject<string | null>(this.getUserType());

  constructor(private http: HttpClient, private router: Router) { 

  }

  login(credentials: { username: string; password: string }): Observable<any> {
    // return this.http.post(`${this.baseURL}iniciar-sesion/`, credentials, { withCredentials: true })
    return this.http.post<any>(`${this.baseURL}login/`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem('authToken', response.access);
          localStorage.setItem('userType', response.user_type);
          this.setCurrentUser(response.user);

          this.loggedInSubject.next(true);
          this.userTypeSubject.next(response.user_type);
          console.log("login");
          if(this.getUserType()=="Administrador"){
            this.router.navigate(['/index']);
          }else{
            this.router.navigate(['/revision']);
          }

          
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
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userType');
    this.loggedInSubject.next(false);
    this.currentUserSubject.next(null);
    this.userTypeSubject.next(null);
    this.router.navigate(['/login']);
  }
  

  setCurrentUser(user: any): void {
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
    this.currentUserSubject.next(user); // Notify subscribers about current user update
  }

  getCurrentUser(): any {
    const userString = localStorage.getItem(this.currentUserKey);
    return userString ? JSON.parse(userString) : null;
  }

  // Observable for current user
  getCurrentUser$(): Observable<any> {
    return this.currentUserSubject.asObservable();
  }

  setUserType(userType: string): void {
    localStorage.setItem(this.currentUserType, userType);
    this.userTypeSubject.next(userType);  // Notify subscribers about user type update
  }

   // Manage user type
   getUserType(): string | null {
    return localStorage.getItem(this.currentUserType);
  }

  // Observable for user type
  getUserType$(): Observable<string | null> {
    return this.userTypeSubject.asObservable();
  }





  private hasToken(): boolean {
    return !!localStorage.getItem("authToken");
  }

  

  
}
