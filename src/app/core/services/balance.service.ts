import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Balance } from '../interfaces/balance.interface';

@Injectable({
  providedIn:  'root'
})
export class BalanceService {

  private apiUrl = 'https://wallet-ceutec-api. azurewebsites.net/api';

  constructor(private http: HttpClient) {}

  getBalance(): Observable<Balance> {
    return this.http.get<Balance>(`${this.apiUrl}/balance`);
  }
}