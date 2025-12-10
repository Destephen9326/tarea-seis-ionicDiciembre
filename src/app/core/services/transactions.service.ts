import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction } from '../interfaces/transaction.interface';

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {

  private apiUrl = 'https://wallet-ceutec-api.azurewebsites. net/api';

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<Transaction[]> {
    return this. http.get<Transaction[]>(`${this.apiUrl}/transactions`);
  }
}