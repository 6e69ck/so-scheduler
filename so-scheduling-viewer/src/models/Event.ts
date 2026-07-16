import mongoose from 'mongoose';

export interface IEvent extends mongoose.Document {
  show: string;
  clientName: string;
  companyName: string;
  date: Date;
  startTime: string; // 24h format like 10:00
  endTime: string;   // 24h format like 10:15
  location: string;
  billingAddress?: string;
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
  surcharges?: { name: string, value: string }[];
  billingName?: string;
  billingPhone?: string;
}

const EventSchema = new mongoose.Schema<IEvent>({
  show: { type: String, required: true },
  clientName: { type: String, default: '' },
  companyName: { type: String, default: '' },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  billingAddress: { type: String, default: '' },
  billingName: { type: String, default: '' },
  billingPhone: { type: String, default: '' },
  location: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['None', 'Planning', 'Confirmed', 'Completed'], default: 'None' },
  salesAssoc: { type: String, default: '' },
  clientPhone: { type: String, default: '' },
  clientEmail: { type: String, default: '' },
  totalPrice: { type: Number, default: 0 },
  gear: { type: [String], default: [] },
  staff: { type: [String], default: [] },
  neededPeople: { type: Number, default: 0 },
  eventNumber: { type: Number },
  surcharges: { type: [{ name: String, value: String }], default: [] },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

if (mongoose.models.Event) {
  delete mongoose.models.Event;
}

export default mongoose.model<IEvent>('Event', EventSchema);
