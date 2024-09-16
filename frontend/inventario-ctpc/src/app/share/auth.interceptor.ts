import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authToken = authService.getToken();

  // Clonar la solicitud y agregar el encabezado de autorización
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${authToken}`
      // Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzIwMjQwMjgwLCJpYXQiOjE3MjAyMzMwODAsImp0aSI6ImFkM2MzMWIzYTlmYjQ0ODA4NWU4MDg2OTIzMzBhMTY3IiwidXNlcl9pZCI6M30.Q5Cjba_CJQBu54ZesOn-6aN-sv5vc3dXU9VcKJpBrRQ`
      // Authorization: `Token ${authToken}`      
    }
  });

  // Pasar la solicitud clonada con el encabezado actualizado al siguiente manejador
  return next(authReq);
};
