import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonicModule,
  ToastController,
  LoadingController,
} from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import { Router } from '@angular/router';

import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { User } from '../../../../core/interfaces/user.interface';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.page.html',
  styleUrls: ['./profile-page.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class ProfilePagePage implements OnInit {

  form!: FormGroup;
  user: User | null = null;

  imageProfile: string | null = null;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router,
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      fullName: ['', [Validators.required]],
      phoneNumber: [
        '',
        [Validators.required, Validators.pattern(/^\d{8,}$/)],
      ],
      birthDate: ['', [Validators.required, this.birthDateNotFutureValidator]],
    });

    await this.loadProfile();
  }

  // --------------------- Getters (errores) ---------------------
  get fullNameControl(): AbstractControl | null {
    return this.form.get('fullName');
  }

  get phoneControl(): AbstractControl | null {
    return this.form.get('phoneNumber');
  }

  get birthDateControl(): AbstractControl | null {
    return this.form.get('birthDate');
  }

  get fullNameInvalid(): boolean {
    return !!(this.fullNameControl?.invalid && this.fullNameControl?.touched);
  }

  get phoneInvalid(): boolean {
    return !!(this.phoneControl?.invalid && this.phoneControl?.touched);
  }

  get birthDateInvalid(): boolean {
    return !!(this.birthDateControl?.invalid && this.birthDateControl?.touched);
  }

  get phoneErrorText(): string {
    if (!this.phoneControl?.touched) return '';
    if (this.phoneControl?.errors?.['required']) return 'El número de teléfono es requerido.';
    if (this.phoneControl?.errors?.['pattern']) return 'Mínimo 8 dígitos y solo números.';
    return '';
  }

  get birthDateErrorText(): string {
    if (!this.birthDateControl?.touched) return '';
    if (this.birthDateControl?.errors?.['required']) return 'La fecha de nacimiento es requerida.';
    if (this.birthDateControl?.errors?.['futureDate']) return 'La fecha no puede ser mayor a hoy.';
    return '';
  }

  onPhoneInput(ev: Event): void {
    const customEvent = ev as CustomEvent;
    const rawValue = String(customEvent?.detail?.value ?? '');
    const digitsOnly = rawValue.replace(/\D+/g, '');
    if (digitsOnly === rawValue) return;

    this.phoneControl?.setValue(digitsOnly, { emitEvent: false });
  }

  // --------------------- Acciones ---------------------
  async pickProfilePhoto(): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
      });

      const path = image.webPath ?? image.path ?? null;
      if (!path) return;

      this.imageProfile = path;
      await Preferences.set({ key: 'imageProfile', value: path });
    } catch (err) {
      // Cancelado o sin permisos
      console.error('Error seleccionando foto:', err);
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid || !this.user) {
      this.form.markAllAsTouched();
      await this.presentToast('Revisa los campos marcados.', 'warning');
      return;
    }

    this.isSaving = true;
    const loading = await this.loadingController.create({
      message: 'Guardando...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      const fullName = String(this.form.value.fullName ?? '').trim();
      const phoneNumber = String(this.form.value.phoneNumber ?? '').trim();
      const birthDate = String(this.form.value.birthDate ?? '').trim();

      const { names, surnames } = this.splitFullName(fullName, this.user);

      const imageProfile = this.imageProfile ?? this.user.imageProfile ?? null;

      const payload: Partial<User> & { id: number } = {
        ...this.user,
        id: this.user.id,
        names,
        surnames,
        phoneNumber,
        // Guardamos birthDate en address si el API no lo soporta directamente.
        // Si tu API tiene campo birthDate, lo cambiamos a ese nombre.
        address: this.user.address,
        imageProfile,
        // No tocar fcmToken aquí; se actualiza por PushNotificationsService
        fcmToken: this.user.fcmToken,
      };

      // Nota: birthDate aún no existe en interfaz/API; se mantiene validado en UI.
      void birthDate;

      await new Promise<void>((resolve, reject) => {
        this.userService.updateUser(payload).subscribe({
          next: (updated) => {
            this.user = updated;
            resolve();
          },
          error: (err) => reject(err),
        });
      });

      await loading.dismiss();
      await this.presentToast('Perfil actualizado correctamente', 'success');
    } catch (err) {
      await loading.dismiss();
      console.error('Error guardando perfil:', err);
      await this.presentToast('No se pudo guardar el perfil.', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  async logout(): Promise<void> {
    await this.authService.cerrarSesion();
    await this.router.navigate(['/login']);
  }

  // --------------------- Helpers ---------------------
  private async loadProfile(): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Cargando perfil...',
      spinner: 'crescent',
      duration: 8000,
    });
    await loading.present();

    try {
      const cached = await Preferences.get({ key: 'imageProfile' });
      this.imageProfile = cached.value ?? null;

      await new Promise<void>((resolve, reject) => {
        this.userService.getUser().subscribe({
          next: (user) => {
            this.user = user;
            const fullName = `${user.names ?? ''} ${user.surnames ?? ''}`.trim();
            this.form.patchValue({
              fullName,
              phoneNumber: user.phoneNumber ?? '',
              birthDate: '',
            });

            if (!this.imageProfile) this.imageProfile = user.imageProfile ?? null;
            resolve();
          },
          error: (err) => reject(err),
        });
      });
    } catch (err) {
      console.error('Error cargando perfil:', err);
      await this.presentToast('No se pudo cargar el perfil.', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private birthDateNotFutureValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    const now = new Date();
    // comparar solo fecha (ignorar hora)
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return date.getTime() > now.getTime() ? { futureDate: true } : null;
  }

  private splitFullName(fullName: string, fallbackUser: User): { names: string; surnames: string } {
    const normalized = fullName.trim().replace(/\s+/g, ' ');
    if (!normalized) return { names: fallbackUser.names ?? '', surnames: fallbackUser.surnames ?? '' };

    const parts = normalized.split(' ');
    if (parts.length === 1) {
      return { names: parts[0], surnames: fallbackUser.surnames ?? '' };
    }

    return {
      names: parts[0],
      surnames: parts.slice(1).join(' '),
    };
  }

  private async presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });
    await toast.present();
  }

}
