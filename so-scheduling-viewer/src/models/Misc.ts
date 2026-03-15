import mongoose from 'mongoose';

export interface IMisc extends mongoose.Document<string> {
  _id: string;
  value?: any;
  seq?: number;
  type: 'config' | 'counter';
}

const MiscSchema = new mongoose.Schema<IMisc>({
  _id: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
  seq: { type: Number },
  type: { type: String, enum: ['config', 'counter'], required: true },
}, {
  timestamps: true,
  collection: 'misc',
  _id: false
});

if (mongoose.models.Misc) {
  delete mongoose.models.Misc;
}

export default mongoose.model<IMisc>('Misc', MiscSchema);
