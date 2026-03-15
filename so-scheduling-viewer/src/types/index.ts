export interface EventType {
  _id?: string;
  show: string;
  clientName: string;
  companyName?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  status: 'None' | 'Planning' | 'Confirmed' | 'Completed';
  salesAssoc: string;
  clientPhone: string;
  clientEmail: string;
  totalPrice: number;
  gear: string[];
  staff: string[];
  neededPeople: number;
  eventNumber?: number;
  transactions?: TransactionType[];
  linkedId?: string;
}

export type TransactionAccount = 'Bank' | 'Member Reimbursements' | 'Fees' | 'Tips';
export type TransactionIntent = 'payment' | 'tip' | 'fee' | 'reimbursement';

export interface TransactionType {
  _id?: string;
  amount: number;
  type: 'cash' | 'cheque' | 'e-transfer' | 'credit';
  category: 'revenue' | 'reimbursement';
  account: TransactionAccount;
  intent: TransactionIntent;
  date: string;
  notes?: string;
  receiptUrl?: string;
  eventId?: string;
  createdAt?: string;
}
