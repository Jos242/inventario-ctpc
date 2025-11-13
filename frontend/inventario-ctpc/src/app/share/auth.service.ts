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
  private currentUserName = 'userName';
  private currentUserType = 'userType';
  private currentAdminType = 'adminType';

  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private currentUserSubject = new BehaviorSubject<any>(this.getCurrentUser());
  private userNameSubject = new BehaviorSubject<string | null>(this.getUserName());
  private userTypeSubject = new BehaviorSubject<string | null>(this.getUserType());
  private adminTypeSubject = new BehaviorSubject<string | null>(this.getAdminType());

  constructor(private http: HttpClient, private router: Router) { 

  }

  login(credentials: { username: string; password: string }): Observable<any> {
    // return this.http.post(`${this.baseURL}iniciar-sesion/`, credentials, { withCredentials: true })
    return this.http.post<any>(`${this.baseURL}login/`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem('authToken', response.access);

          this.setUserName(response.user)
          this.setUserType(response.user_type)
          this.setAdminType(response.admin_type)

          this.setCurrentUser(response.user_id);
          this.loggedInSubject.next(true);

          if (this.getUserType() == "Administrador") {
            this.router.navigate(['/index']);
          } else {
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
    localStorage.removeItem('userName');
    localStorage.removeItem('userType');
    localStorage.removeItem('adminType');
    this.loggedInSubject.next(false);
    this.currentUserSubject.next(null);
    this.userNameSubject.next(null);
    this.userTypeSubject.next(null);
    this.adminTypeSubject.next(null);
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

  setUserName(userName: string): void {
    localStorage.setItem(this.currentUserName, userName);
    this.userNameSubject.next(userName);  // Notify subscribers about user Name update
  }

   // Manage user Name
   getUserName(): string | null {
    return localStorage.getItem(this.currentUserName);
  }

  // Observable for user Name
  getUserName$(): Observable<string | null> {
    return this.userNameSubject.asObservable();
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

  setAdminType(adminType: string): void {
    localStorage.setItem(this.currentAdminType, adminType);
    this.adminTypeSubject.next(adminType);  // Notify subscribers about user type update
  }

   // Manage user type
   getAdminType(): string | null {
    return localStorage.getItem(this.currentAdminType);
  }

  // Observable for user type
  getAdminType$(): Observable<string | null> {
    return this.adminTypeSubject.asObservable();
  }





  private hasToken(): boolean {
    return !!localStorage.getItem("authToken");
  }

  

  
}
