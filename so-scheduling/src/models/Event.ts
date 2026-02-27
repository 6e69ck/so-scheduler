import mongoose from 'mongoose';

export interface IEvent extends mongoose.Document {
  show: string;
  clientName: string;
  companyName: string;
  date: Date;
  startTime: string; // 24h format like 10:00
  endTime: string;   // 24h format like 10:15
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
}

const EventSchema = new mongoose.Schema<IEvent>({
  show: { type: String, required: true },
  clientName: { type: String, default: '' },
  companyName: { type: String, default: '' },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
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
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
