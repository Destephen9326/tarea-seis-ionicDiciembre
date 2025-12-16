import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'https://wallet-ceutec-api.azurewebsites.net/api';

  constructor(private http: HttpClient) {}

  getUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user`);
  }

  updateUser(payload: Partial<User> & { id: number }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/user`, payload);
  }

  /**
   * Actualiza el token FCM del usuario logueado.
   * Obtiene primero el usuario actual para no perder campos.
   */
  updateFcmToken(fcmToken: string): Observable<User> {
    return new Observable<User>((subscriber) => {
      const sub = this.getUser().subscribe({
        next: (user) => {
          this.updateUser({
            ...user,
            fcmToken,
          }).subscribe({
            next: (updated) => {
              subscriber.next(updated);
              subscriber.complete();
            },
            error: (err) => subscriber.error(err),
          });
        },
        error: (err) => subscriber.error(err),
      });

      return () => sub.unsubscribe();
    });
  }
}