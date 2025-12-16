import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom, TimeoutError, timeout } from 'rxjs';
import { CreateAccountRequest, LoginRequest, PhoneVerificationRequest, PhoneVerifyRequest } from '../../core/interfaces/auth.interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

 
  private apiUrl = 'https://wallet-ceutec-api.azurewebsites.net/api';
  
  // Memoria temporal: Aquí guardamos los datos del formulario de registro
  // mientras el usuario avanza a la pantalla de verificación OTP.
  private datosRegistroTemporal: CreateAccountRequest | null = null;

  constructor(private http: HttpClient) { }

 
  async login(email: string, pass: string): Promise<boolean> {

    const body: LoginRequest = {
      identifier: email,
      password: pass,
      method: 0
    };

    try {
      console.log('========================================');
      console.log('🔐 INICIANDO SESIÓN');
      console.log('========================================');
      console.log('Email:', email);
      console.log('URL:', `${this.apiUrl}/auth/login`);
      console.log('Body:', body);
      console.log('========================================');
      
      const url = `${this.apiUrl}/auth/login`;

      // En Android/iOS (WebView), el Origin suele ser capacitor://localhost y puede fallar por CORS.
      // CapacitorHttp hace el request nativo y evita CORS; en web seguimos con HttpClient.
      let response: any;
      if (Capacitor.isNativePlatform()) {
        const nativeRequest = CapacitorHttp.post({
          url,
          headers: { 'Content-Type': 'application/json' },
          data: body,
        });

        const nativeResponse = await Promise.race([
          nativeRequest,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Tiempo de espera agotado al iniciar sesión. Verifica tu conexión e intenta nuevamente.')),
              20000
            )
          ),
        ]);

        // CapacitorHttp devuelve { data, status, headers }
        response = (nativeResponse as any)?.data ?? nativeResponse;
      } else {
        // Petición POST real a la API (con timeout para evitar quedarse colgado)
        response = await firstValueFrom(this.http.post(url, body).pipe(timeout(20000)));
      }
      
      console.log('Respuesta del login:', response);
      
      // La API devuelve accessToken, no token
      const token = response.accessToken || response.token || response.data?.accessToken || response.data?.token;
      const userId = response.userId || response.data?.userId;

      console.log('Token encontrado:', token ? 'Sí' : 'No');
      console.log('UserId encontrado:', userId || 'No');

      if (token) {
        await this.guardarSesion(token, userId);
        console.log('Sesión guardada correctamente');
        return true;
      }
      console.warn('No se encontró token en la respuesta');
      return false;
    } catch (error: any) {
      if (error instanceof TimeoutError) {
        throw new Error('Tiempo de espera agotado al iniciar sesión. Verifica tu conexión e intenta nuevamente.');
      }
      console.error('Error Login:', error);
      console.error('Detalles del error:', {
        status: error?.status,
        statusText: error?.statusText,
        message: error?.message,
        error: error?.error
      });
      throw error;
    }
  }

  // ==========================================
  // 2. GESTIÓN DE DATOS DE REGISTRO
  // ==========================================
  
  // Guardar datos temporalmente
  setDatosRegistro(datos: CreateAccountRequest) {
    this.datosRegistroTemporal = datos;
  }

  // Recuperar datos (OTP)
  getDatosRegistro(): CreateAccountRequest | null {
    return this.datosRegistroTemporal;
  }

  // ==========================================
  // 3. VERIFICACIÓN DE TELÉFONO (OTP)
  // ==========================================
  
  // Paso 1: Solicitar envío de SMS
  async enviarTokenTelefono(telefono: string): Promise<void> {
    const body: PhoneVerificationRequest = { phoneNumber: telefono };
    try {
      console.log('Enviando solicitud OTP:', { url: `${this.apiUrl}/phoneverifications`, body });
      // POST a /api/phoneverifications
      // { observe: 'response' } para manejar respuestas vacías o no-JSON
      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}/phoneverifications`, body, { 
          observe: 'response',
          responseType: 'json'
        }).pipe(
         
        )
      );
      console.log('Respuesta OTP exitosa:', response.status, response.body);
      
    } catch (error: any) {
      console.error('Error al enviar token telefónico:', error);
      console.error('Detalles del error:', {
        status: error?.status,
        statusText: error?.statusText,
        message: error?.message,
        error: error?.error
      });
      
      
      if (error?.status === 200 || error?.status === 201) {
        console.log('Respuesta exitosa (posible respuesta vacía o no-JSON)');
        return; // Éxito aunque no haya body o haya error de parsing
      }
      
      
      if (error?.message?.includes('parsing') && !error?.status) {
        throw new Error('Error al procesar la respuesta del servidor. Verifica tu conexión.');
      }
      
      throw error; 
    }
  }

 
  async verificarTokenTelefono(telefono: string, token: string): Promise<boolean> {
    const body: PhoneVerifyRequest = { phoneNumber: telefono, token: token };
    try {
      console.log('Verificando OTP:', { 
        url: `${this.apiUrl}/phoneverifications/verify`, 
        body,
        telefono,
        token 
      });
      
     
      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}/phoneverifications/verify`, body, {
          observe: 'response',
          responseType: 'json'
        })
      );
      
      console.log('Respuesta verificación OTP exitosa:', response.status, response.body);
      
      
      if (response.status === 200 || response.status === 201) {
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Error al verificar token telefónico:', error);
      console.error('Detalles del error:', {
        status: error?.status,
        statusText: error?.statusText,
        message: error?.message,
        error: error?.error,
        body: error?.error
      });
      
     
      if (error?.status === 200 || error?.status === 201) {
        console.log('Respuesta exitosa (posible respuesta vacía o no-JSON)');
        return true; 
      }
      

      if (error?.status === 400) {
        console.log('Código incorrecto (400 Bad Request)');
        return false;
      }
      
      
      return false;
    }
  }

  // ==========================================
  // 4. CREAR CUENTA FINAL (Registro Real)
  // ==========================================
  async crearCuentaReal(): Promise<boolean> {
    if (!this.datosRegistroTemporal) throw new Error("No hay datos para registrar.");

    try {
      console.log('========================================');
      console.log('📝 CREANDO CUENTA REAL');
      console.log('========================================');
      console.log('URL:', `${this.apiUrl}/accounts`);
      console.log('Datos a enviar:', {
        ...this.datosRegistroTemporal,
        password: '***' // No mostrar la contraseña en logs
      });
      console.log('Email que se registrará:', this.datosRegistroTemporal.email);
      console.log('========================================');
      
     
      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/accounts`, this.datosRegistroTemporal, {
          observe: 'response',
          responseType: 'json'
        })
      );
      
      console.log('Respuesta crear cuenta:', {
        status: response.status,
        body: response.body
      });
      
      
      const token = response.body?.token || response.body?.data?.token;
      const userId = response.body?.userId || response.body?.data?.userId;
      
      console.log('Token encontrado:', token ? 'Sí' : 'No');
      console.log('UserId encontrado:', userId || 'No');
      
      if (token) {
        await this.guardarSesion(token, userId);
        console.log('Sesión guardada después de crear cuenta');
      } else {
        console.warn('No se recibió token al crear la cuenta. El usuario deberá iniciar sesión manualmente.');
      }
      
     
      this.datosRegistroTemporal = null;
      return true;
    } catch (error: any) {
      console.error('Error creando cuenta:', error);
      console.error('Detalles del error:', {
        status: error?.status,
        statusText: error?.statusText,
        message: error?.message,
        error: error?.error
      });
      
      
      if (error?.status === 200 || error?.status === 201) {
        console.log('Cuenta creada (posible respuesta vacía o no-JSON)');
        this.datosRegistroTemporal = null;
        return true;
      }
      
      throw error;
    }
  }

  // ==========================================
  // 5. CERRAR SESIÓN (LOGOUT)
  // ==========================================
  async cerrarSesion(): Promise<void> {
    try {
      
      await Preferences.remove({ key: 'auth_token' });
      await Preferences.remove({ key: 'auth_user_id' });
      
     
      this.datosRegistroTemporal = null;
      
      console.log('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  // ==========================================
  // UTILIDADES (Seguridad)
  // ==========================================
  private async guardarSesion(token: string, userId: string) {

    const tokenEnc = btoa(token);
    const userEnc = userId ? btoa(userId) : '';

    await Preferences.set({ key: 'auth_token', value: tokenEnc });
    await Preferences.set({ key: 'auth_user_id', value: userEnc });
  }
}