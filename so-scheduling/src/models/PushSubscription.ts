import mongoose from 'mongoose';

export interface IPushSubscription extends mongoose.Document {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userName: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new mongoose.Schema<IPushSubscription>({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userName: { type: String, default: '', index: true },
  userAgent: { type: String, default: '' },
}, {
  timestamps: true,
});

if (mongoose.models.PushSubscription) {
  delete mongoose.models.PushSubscription;
}

export default mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
