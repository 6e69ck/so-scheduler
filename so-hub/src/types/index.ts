export interface EventType {
  _id?: string;
  show: string;
  clientName?: string;
  companyName?: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  location?: string;
  billingAddress?: string;
  notes?: string;
  status?: 'None' | 'Planning' | 'Confirmed' | 'Completed';
  salesAssoc?: string;
  clientPhone?: string;
  clientEmail?: string;
  totalPrice?: number;
  gear?: string[];
  staff: string[];
  neededPeople: number;
  eventNumber?: number;
}
