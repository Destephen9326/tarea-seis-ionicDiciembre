import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { Preferences } from '@capacitor/preferences';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  // Rutas que NO requieren token
  private excludedUrls:  string[] = [
    '/auth/login',
    '/accounts',
    '/phoneverifications',
    '/auth/forgot-password',
    '/auth/reset-password'
  ];

  constructor() {}

  intercept(request:  HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isExcluded = this.excludedUrls.some(url => request.url.includes(url));
    
    if (isExcluded) {
      return next.handle(request);
    }

    return from(this.getToken()).pipe(
      switchMap(token => {
        if (token) {
          const clonedRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log('🔑 Token añadido a la petición:', request.url);
          return next. handle(clonedRequest);
        }
        return next.handle(request);
      })
    );
  }

  private async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'auth_token' });
    if (value) {
      return atob(value); // Decodificar base64
    }
    return null;
  }
}