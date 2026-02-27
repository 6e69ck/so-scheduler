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

export interface InvoiceLineItem {
  description: string;
  amount: number;
}

export interface InvoiceType {
  _id?: string;
  hash: string;
  eventId: string;
  type: 'deposit' | 'remaining' | 'custom';
  snapshot: EventType;
  customLineItems?: InvoiceLineItem[];
  customTotal?: number;
  createdAt: string;
}
