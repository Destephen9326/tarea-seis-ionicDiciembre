import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wallet.app',
  appName: 'auth-app',
  webDir: 'www',
  server: {
    // Permite requests HTTP a cualquier dominio en Android/iOS
    allowNavigation: ['*'],
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
