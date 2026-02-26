import mongoose from 'mongoose';

export interface ICounter extends mongoose.Document<string> {
  _id: string;
  seq: number;
}

const CounterSchema = new mongoose.Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
}, { collection: 'misc' });

export default mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);
