import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';
import { UserService } from '../../core/services/user.service';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationsService {
  private listenersRegistered = false;

  constructor(private userService: UserService) {}

  /**
   * Inicializa listeners, pide permisos y registra el dispositivo.
   * No hace nada en web.
   */
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    if (!this.listenersRegistered) {
      this.registerListeners();
      this.listenersRegistered = true;
    }

    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive !== 'granted') return;

    await PushNotifications.register();
  }

  /**
   * Sincroniza el token guardado localmente (si existe) contra el API.
   * Útil al iniciar sesión.
   */
  async syncCachedTokenToApi(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const { value } = await Preferences.get({ key: 'fcm_token' });
    if (!value) return;

    this.userService.updateFcmToken(value).subscribe({
      next: () => {
        // ok
      },
      error: (err) => {
        console.error('Error actualizando fcmToken en API:', err);
      },
    });
  }

  private registerListeners(): void {
    PushNotifications.addListener('registration', async (token: Token) => {
      await Preferences.set({ key: 'fcm_token', value: token.value });

      this.userService.updateFcmToken(token.value).subscribe({
        next: () => {
          // ok
        },
        error: (err) => {
          console.error('Error actualizando fcmToken en API:', err);
        },
      });
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err);
    });

    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push received:', notification);
      },
    );

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('Push action performed:', notification);
      },
    );
  }
}
