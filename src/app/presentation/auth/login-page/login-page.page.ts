// src/app/presentation/auth/login-page/login-page.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { IonicModule, NavController, ModalController, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';

import { AuthService } from '../../../shared/services/auth.service';
import { PushNotificationsService } from '../../../shared/services/push-notifications.service';
import { RecuperarPasswordComponent } from '../recuperar-password/recuperar-password.component';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.page.html',
  styleUrls: ['./login-page.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class LoginPagePage implements OnInit {
  
  public formularioLogin!: FormGroup;
  public isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private router: Router,
    private modalCtrl: ModalController,
    private authService: AuthService,
    private pushNotificationsService: PushNotificationsService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.formularioLogin = this.fb.group({
      correoElectronico: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required]]
    });
  }

  // 
  
  get correoControl(): AbstractControl | null {
    return this.formularioLogin.get('correoElectronico');
  }

  get contrasenaControl(): AbstractControl | null {
    return this.formularioLogin.get('contrasena');
  }

  get correoInvalido(): boolean {
    return !!(this.correoControl?.invalid && this.correoControl?.touched);
  }

  get contrasenaInvalida(): boolean {
    return !!(this.contrasenaControl?.invalid && this.contrasenaControl?.touched);
  }

  // --- ACCIONES ---

  async ingresar() {
    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      await this.mostrarToast('Por favor, completa todos los campos correctamente.', 'warning');
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Normalizar email: eliminar espacios y convertir a minúsculas
      const email = this.formularioLogin.value.correoElectronico.trim().toLowerCase();
      // Normalizar contraseña: eliminar espacios al inicio y final
      const password = this.formularioLogin.value.contrasena.trim();

      console.log('🔐 Intentando login con:');
      console.log('  Email:', email);
      console.log('  Contraseña (longitud):', password.length);

      const exito = await this.authService.login(email, password);

      if (exito) {
        // Inicializar push y sincronizar token en segundo plano
        this.pushNotificationsService
          .init()
          .then(() => this.pushNotificationsService.syncCachedTokenToApi())
          .catch((err) => console.error('Error inicializando push:', err));

        await this.mostrarToast('¡Sesión iniciada correctamente!', 'success');
        setTimeout(() => {
          this.router.navigate(['/tabs/home']);
        }, 1000);
      } else {
        await this.mostrarToast('Credenciales incorrectas. Por favor, verifica tus datos.', 'danger');
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      
      let mensajeError = 'Error al iniciar sesión. Por favor, intenta nuevamente.';
      
      if (error?.error?.message) {
        mensajeError = error.error.message;
      } else if (error?.message) {
        mensajeError = error.message;
      } else if (error?.status === 0) {
        mensajeError = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else if (error?.status === 401) {
        mensajeError = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      } else if (error?.status >= 500) {
        mensajeError = 'Error del servidor. Por favor, intenta más tarde.';
      }
      
      await this.mostrarToast(mensajeError, 'danger');
    } finally {
      this.isLoading = false;
      // Evita que una excepción al cerrar el loading deje la UI bloqueada
      await loading.dismiss().catch(() => undefined);
    }
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  async abrirModalRecuperar() {
    const modal = await this.modalCtrl.create({
      component: RecuperarPasswordComponent
    });
    await modal.present();
  }

  irARegistro() {
    this.navCtrl.navigateForward('/registro');
  }
}