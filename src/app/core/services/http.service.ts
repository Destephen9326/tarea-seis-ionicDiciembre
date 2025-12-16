import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  
  private apiUrl = 'https://wallet-ceutec-api.azurewebsites.net/api';

  constructor() {}

  private async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'auth_token' });
    if (value) {
      try {
        return atob(value);
      } catch {
        return value;
      }
    }
    return null;
  }

  private isNativePlatform(): boolean {
    const platform = Capacitor.getPlatform();
    return platform === 'android' || platform === 'ios';
  }

  async get<T>(endpoint: string): Promise<T> {
    const token = await this.getToken();
    const url = `${this.apiUrl}${endpoint}`;
    const platform = Capacitor.getPlatform();
    const isNative = this.isNativePlatform();
    
    console.log(`🌐 [HttpService] GET ${endpoint}`);
    console.log(`📱 [HttpService] Platform: ${platform}, isNative: ${isNative}`);
    console.log(`🔗 [HttpService] Full URL: ${url}`);
    console.log(`🔑 [HttpService] Token: ${token ? 'presente (' + token.substring(0, 20) + '...)' : 'ausente'}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      if (isNative) {
        // Usar CapacitorHttp para plataformas nativas (Android/iOS)
        console.log(`🤖 [HttpService] Usando CapacitorHttp para ${platform}`);
        const response = await CapacitorHttp.get({
          url,
          headers,
        });

        console.log(`✅ [HttpService] CapacitorHttp Response status: ${response.status}`);
        console.log(`📦 [HttpService] CapacitorHttp Response data:`, response.data);

        if (response.status >= 400) {
          console.error(`❌ [HttpService] CapacitorHttp Error response:`, response.data);
          throw { status: response.status, message: response.data?.message || `Error: ${response.status}`, error: response.data };
        }

        return response.data as T;
      } else {
        // Usar fetch para web
        console.log(`🌍 [HttpService] Usando fetch para web`);
        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        console.log(`✅ [HttpService] Fetch Response status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`❌ [HttpService] Fetch Error response:`, errorData);
          throw { status: response.status, message: errorData?.message || `Error: ${response.status}`, error: errorData };
        }

        const data = await response.json();
        console.log(`📦 [HttpService] Fetch Success:`, data);
        return data;
      }
    } catch (error: any) {
      console.error(`💥 [HttpService] Error for ${endpoint}:`, error);
      console.error(`💥 [HttpService] Error name: ${error?.name}`);
      console.error(`💥 [HttpService] Error message: ${error?.message}`);
      console.error(`💥 [HttpService] Error stack:`, error?.stack);
      throw error;
    }
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    const token = await this.getToken();
    const url = `${this.apiUrl}${endpoint}`;
    const isNative = this.isNativePlatform();
    
    console.log(`🌐 [HttpService] POST ${endpoint}`);
    console.log(`📱 [HttpService] isNative: ${isNative}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      if (isNative) {
        console.log(`🤖 [HttpService] Usando CapacitorHttp para POST`);
        const response = await CapacitorHttp.post({
          url,
          headers,
          data: body,
        });

        console.log(`✅ [HttpService] POST Response status: ${response.status}`);

        if (response.status >= 400) {
          throw { status: response.status, message: response.data?.message || `Error: ${response.status}`, error: response.data };
        }

        return response.data as T;
      } else {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw { status: response.status, message: errorData?.message || `Error: ${response.status}`, error: errorData };
        }

        return response.json();
      }
    } catch (error: any) {
      console.error(`💥 [HttpService] POST Error:`, error);
      throw error;
    }
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    const token = await this.getToken();
    const url = `${this.apiUrl}${endpoint}`;
    const isNative = this.isNativePlatform();
    
    console.log(`🌐 [HttpService] PUT ${endpoint}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      if (isNative) {
        console.log(`🤖 [HttpService] Usando CapacitorHttp para PUT`);
        const response = await CapacitorHttp.put({
          url,
          headers,
          data: body,
        });

        console.log(`✅ [HttpService] PUT Response status: ${response.status}`);

        if (response.status >= 400) {
          throw { status: response.status, message: response.data?.message || `Error: ${response.status}`, error: response.data };
        }

        return response.data as T;
      } else {
        const response = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw { status: response.status, message: errorData?.message || `Error: ${response.status}`, error: errorData };
        }

        return response.json();
      }
    } catch (error: any) {
      console.error(`💥 [HttpService] PUT Error:`, error);
      throw error;
    }
  }
}
