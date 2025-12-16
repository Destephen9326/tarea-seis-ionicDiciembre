// src/app/modules/home/pages/home-page/home-page.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, 
  IonCard,
  IonCardContent,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonText,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowUpOutline, arrowDownOutline, swapHorizontalOutline, chevronForwardOutline, logOutOutline } from 'ionicons/icons';


import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../../../../shared/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { BalanceService } from '../../../../core/services/balance.service';
import { TransactionsService } from '../../../../core/services/transactions.service';
import { User } from '../../../../core/interfaces/user.interface';
import { Balance } from '../../../../core/interfaces/balance.interface';
import { Transaction } from '../../../../core/interfaces/transaction.interface';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.page.html',
  styleUrls:  ['./home-page.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonText,
    IonSpinner
  ]
})
export class HomePagePage implements OnInit {

  user: User | null = null;
  balance: Balance | null = null;
  transactions: Transaction[] = [];
  
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private userService: UserService,
    private balanceService: BalanceService,
    private transactionsService: TransactionsService,
     private authService: AuthService,
     private router: Router,
     private toastController: ToastController
  ) {
    addIcons({ arrowUpOutline, arrowDownOutline, swapHorizontalOutline, chevronForwardOutline, logOutOutline });
  }

  ngOnInit() {
  this.loadData();

  // Datos de prueba en caso de que la API no responda
  setTimeout(() => {
    if (this.transactions.length === 0) {
      this.transactions = [
        {
          transactionTypeDescription: "Débito",
          accountId: 19,
          amount: 35.23,
          transactionType: 0,
          balanceAfter: 964.77,
          description: "Walmart",
          createdAt: "2025-12-10T12:32:00"
        },
        {
          transactionTypeDescription: "Crédito",
          accountId: 19,
          amount: 430,
          transactionType: 1,
          balanceAfter: 1000,
          description: "Depósito",
          createdAt: "2025-12-09T02:12:00"
        },
        {
          transactionTypeDescription: "Débito",
          accountId: 19,
          amount: 13,
          transactionType: 0,
          balanceAfter: 987,
          description: "Netflix",
          createdAt: "2025-08-24T13:53:00"
        }
      ];
    }
  }, 1500);
}

  // Formatea la fecha de la transacción a 'dd/MM/yyyy HH:mm'
  formatTransactionDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  async loadData() {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('🏠 [HomePage] Iniciando carga de datos...');

    try {
      
      this.userService.getUser().subscribe({
        next: (data) => {
          this.user = data;
          console.log('✅ [HomePage] Usuario cargado:', data);
        },
        error: (err) => {
          console.error('❌ [HomePage] Error cargando usuario:', err);
          this.errorMessage = 'Error cargando usuario: ' + (err?.message || JSON.stringify(err));
        }
      });

      this.balanceService.getBalance().subscribe({
        next: (data) => {
          this.balance = data;
          console.log('✅ [HomePage] Balance cargado:', data);
        },
        error: (err) => {
          console.error('❌ [HomePage] Error cargando balance:', err);
          // Mostrar balance por defecto si hay error
          this.balance = { balance: 0, currency: 'USD' } as any;
        }
      });

      this.transactionsService.getTransactions().subscribe({
        next: (data) => {
          this.transactions = data;
          console.log('✅ [HomePage] Transacciones cargadas:', data);
        },
        error: (err) => {
          console.error('❌ [HomePage] Error cargando transacciones:', err);
        }
      });

    } catch (error) {
      console.error('Error general:', error);
      this.errorMessage = 'Error al cargar los datos';
    } finally {
      setTimeout(() => {
        this.isLoading = false;
      }, 1000);
    }
  }

  // Formatear el saldo con separadores de miles
  formatBalance(amount: number): string {
    const parts = amount.toFixed(2).split('.');
    parts[0] = parts[0]. replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  
  getUserName(): string {
  if (this.user?.names && this.user.names.trim() !== "") {
    return this.user.names.split(' ')[0];
  }
  return this.user?.email || "Usuario";
}
  async cerrarSesion() {
  try {
    await this.authService.cerrarSesion();
    const toast = await this.toastController.create({
      message: 'Sesión cerrada correctamente',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
    this.router.navigate(['/login']);
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
}

}