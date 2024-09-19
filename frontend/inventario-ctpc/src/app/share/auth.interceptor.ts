import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authToken = authService.getToken();
  const router = inject(Router);

  // Clonar la solicitud y agregar el encabezado de autorización
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${authToken}`
     // Authorization: `Token ${authToken}`      
    }
  });

  // Proceed with the request and handle errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If the error is a 401 Unauthorized error, handle the logout
      if (error.status === 401) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Token invalida, por favor inicie sesion nuevamente. ${error.type}`,
        });
        authService.logout();
        router.navigate(['/login']);
      }

      // Rethrow the error so that it can be handled further down if necessary
      return throwError(() => new Error(error.message || 'An error occurred'));
    })
  );

  // Pasar la solicitud clonada con el encabezado actualizado al siguiente manejador
  return next(authReq);
};
