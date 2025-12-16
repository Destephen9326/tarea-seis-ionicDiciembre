import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Balance } from '../interfaces/balance.interface';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {

  constructor(private httpService: HttpService) {}

  getBalance(): Observable<Balance> {
    return from(this.httpService.get<Balance>('/balance'));
  }
}