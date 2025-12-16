

export interface Transaction {
  transactionTypeDescription: string;
  accountId: number;
  amount: number;
  transactionType: number;
  balanceAfter: number;
  description: string;
  // Algunas respuestas vienen con `date`, otras con `createdAt`
  date?: string;
  createdAt?: string;
}