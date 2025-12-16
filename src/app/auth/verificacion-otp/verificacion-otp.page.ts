import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { shieldCheckmark } from 'ionicons/icons';

import { numericMinLengthValidator } from '../../shared/validators/custom.validators';
import { AuthService } from '../../shared/services/auth.service';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonButtons, IonBackButton, IonIcon, IonItem, IonSpinner, ToastController, LoadingController } from "@ionic/angular/standalone";

@Component({
  selector: 'app-verificacion-otp',
  templateUrl: './verificacion-otp.page.html',
  styleUrls: ['./verificacion-otp.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonButton,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonItem,
    IonSpinner
  ]
})
export class VerificacionOtpPage implements OnInit {

  public formularioOtp: FormGroup;
  public readonly MIN_LENGTH_TOKEN = 6; 
  public numeroTelefono: string = '';
  public isLoading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ shieldCheckmark });
    this.formularioOtp = this.formBuilder.group({
    
      tokenVerificacion: ['', [
        Validators.required, 
        numericMinLengthValidator(this.MIN_LENGTH_TOKEN),
   
        Validators.maxLength(this.MIN_LENGTH_TOKEN) 
      ]],
    });
  }

  ngOnInit() {
    const datosRegistro = this.authService.getDatosRegistro();
    if (datosRegistro) {
      this.numeroTelefono = datosRegistro.phoneNumber;
      
      console.log('========================================');
      console.log('📱 VERIFICACIÓN OTP');
      console.log('========================================');
      console.log(`Teléfono: ${this.numeroTelefono}`);
      console.log('========================================');
    } else {
   
      console.warn('No hay usuario registrado. Redirigiendo al registro...');
      this.router.navigate(['/registro']);
    }
  }


  get tokenInvalido(): boolean {
    const control = this.formularioOtp.get('tokenVerificacion');
    return control ? control.invalid && control.touched : false;
  }



  get tokenErrores(): string | null {
    const control = this.formularioOtp.get('tokenVerificacion');
    const errors = control?.errors;
    if (!errors) return null;

    if (errors['required'] && control?.touched) {
      return 'El código de verificación es obligatorio.';
    }
    if (errors['notNumeric']) {
      return 'Solo se permiten valores numéricos.';
    }

    if (errors['minLengthNumeric'] || errors['maxlength']) {
      return `Debe ingresar exactamente ${this.MIN_LENGTH_TOKEN} dígitos.`;
    }
    return null;
  }

  
  public async verificarToken(): Promise<void> {
    if (this.formularioOtp.invalid) {
      this.formularioOtp.markAllAsTouched();
      await this.mostrarToast('Por favor, ingresa un código válido de 6 dígitos.', 'warning');
      return;
    }
    
 
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Verificando código...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Limpiar el código ingresado (eliminar espacios y caracteres no numéricos)
      const codigoIngresado = this.formularioOtp.value.tokenVerificacion?.toString().trim().replace(/\s+/g, '') || '';
      
      if (!codigoIngresado || codigoIngresado.length !== this.MIN_LENGTH_TOKEN) {
        await loading.dismiss();
        this.isLoading = false;
        await this.mostrarToast('Por favor, ingresa un código válido de 6 dígitos.', 'warning');
        return;
      }
      
      console.log('========================================');
      console.log('🔐 VERIFICANDO CÓDIGO OTP');
      console.log('========================================');
      console.log(`Teléfono usado: ${this.numeroTelefono}`);
      console.log(`Código ingresado (original): ${this.formularioOtp.value.tokenVerificacion}`);
      console.log(`Código ingresado (limpio): ${codigoIngresado}`);
      console.log('========================================');
  
      const esValido = await this.authService.verificarTokenTelefono(this.numeroTelefono, codigoIngresado);
      
      console.log(`Resultado de verificación: ${esValido ? 'VÁLIDO' : 'INVÁLIDO'}`);
      

      if (esValido) {
        // Actualizar mensaje de loading
        loading.message = 'Creando cuenta...';
        
        // Crear la cuenta real después de verificar el código
        const cuentaCreada = await this.authService.crearCuentaReal();
        
        await loading.dismiss();
        this.isLoading = false;

        if (cuentaCreada) {
          await this.mostrarToast('¡Cuenta creada exitosamente!', 'success');
          
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 1500);
        } else {
          await this.mostrarToast('Error al crear la cuenta. Por favor, intenta nuevamente.', 'danger');
        }
      } else {
        await loading.dismiss();
        this.isLoading = false;
        await this.mostrarToast('Código incorrecto. Por favor, verifica e intenta nuevamente.', 'danger');
        this.formularioOtp.patchValue({ tokenVerificacion: '' });
      }
    } catch (error: any) {
      await loading.dismiss();
      this.isLoading = false;
      console.error('Error al verificar OTP:', error);
      console.error('Detalles completos del error:', {
        status: error?.status,
        statusText: error?.statusText,
        message: error?.message,
        error: error?.error,
        body: error?.error
      });
      
      let mensajeError = 'Error al verificar el código. Por favor, intenta nuevamente.';
      
      if (error?.error?.message) {
        mensajeError = error.error.message;
      } else if (error?.message) {
        mensajeError = error.message;
      }
      
      await this.mostrarToast(mensajeError, 'danger');
    }
  }

  public async reenviarCodigo(): Promise<void> {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Reenviando código...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await this.authService.enviarTokenTelefono(this.numeroTelefono);
      await loading.dismiss();
      this.isLoading = false;
      
      await this.mostrarToast('Código reenviado correctamente.', 'success');
    } catch (error) {
      await loading.dismiss();
      this.isLoading = false;
      console.error('Error al reenviar OTP:', error);
      await this.mostrarToast('Error al reenviar el código. Por favor, intenta nuevamente.', 'danger');
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
}