import { Injectable } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.getUserType();  // Assuming getCurrentUser() returns the current user's details

  if (currentUser && currentUser == 'Administrador') {
    console.log('permitio admin')
    return true;  // Allow access if the user is an admin
  } else {
    router.navigate(['/revision']);  // Redirect to unauthorized page
    console.log('NO es admin')
    return false;
  }
};