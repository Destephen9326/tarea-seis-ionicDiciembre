import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'auth_token' });
    
    if (value) {
      console.log('✅ Usuario autenticado, acceso permitido');
      return true;
    } else {
      console. log('❌ Usuario no autenticado, redirigiendo al login');
      this.router.navigate(['/login']);
      return false;
    }
  }
}