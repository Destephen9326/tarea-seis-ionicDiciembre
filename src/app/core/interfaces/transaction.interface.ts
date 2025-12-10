

export interface Transaction {
  transactionTypeDescription: string;
  accountId: number;
  amount: number;
  transactionType: number;
  balanceAfter: number;
  description: string;
  date?: string; 
}