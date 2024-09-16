import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHotToastConfig } from '@ngxpert/hot-toast';
import { registerLocaleData } from '@angular/common';
import localeCR from '@angular/common/locales/es-CR'
registerLocaleData(localeCR, "es")


import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './share/auth.interceptor';
  
export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),provideHotToastConfig(), provideAnimationsAsync(), provideHttpClient(withInterceptors([authInterceptor])), [{ provide: LOCALE_ID, useValue: 'es-CR' }]]
};
