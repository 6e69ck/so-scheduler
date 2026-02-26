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
  paidBalance: number;
  remainingBalance?: number;
  gear: string[];
  staff: string[];
  neededPeople: number;
  eventNumber?: number;
  tips?: number;
}
