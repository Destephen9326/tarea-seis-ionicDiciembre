import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { User } from '../interfaces/user.interface';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private httpService: HttpService) {}

  getUser(): Observable<User> {
    return from(this.httpService.get<User>('/user'));
  }

  updateUser(payload: Partial<User> & { id: number }): Observable<User> {
    return from(this.httpService.put<User>('/user', payload));
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