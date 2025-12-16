import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Transaction } from '../interfaces/transaction.interface';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {

  constructor(private httpService: HttpService) {}

  getTransactions(): Observable<Transaction[]> {
    return from(this.httpService.get<Transaction[]>('/transactions'));
  }
}