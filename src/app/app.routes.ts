import { Routes } from '@angular/router';
import { AuthGuard } from './auth/services/auth.guard';

export const routes: Routes = [
  // 1. Redirección inicial:  Al entrar a la app, ir al Login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // 2. Ruta del Login
  {
    path: 'login',
    loadComponent:  () => import('./presentation/auth/login-page/login-page.page').then(m => m.LoginPagePage)
  },

  // 3. Ruta de Registro
  {
    path: 'registro',
    loadComponent: () => import('./auth/registro/registro.page').then(m => m.RegistroPage)
  },

  // 4. Ruta de Verificación OTP
  {
    path: 'verificacion-otp',
    loadComponent:  () => import('./auth/verificacion-otp/verificacion-otp.page').then(m => m.VerificacionOtpPage)
  },

  // 5. Rutas de Tabs (PROTEGIDAS con AuthGuard)
  {
    path: 'tabs',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/tabs/tabs.routes').then(m => m.tabsRoutes)
  },

  // 6. Ruta antigua del home - redirigir a tabs/home
  {
    path: 'home',
    redirectTo: 'tabs/home',
    pathMatch: 'full'
  },

  // 7. Cualquier ruta no encontrada, ir al login
  {
    path: '**',
    redirectTo: 'login'
  }
];