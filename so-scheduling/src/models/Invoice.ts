import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  type: { type: String, enum: ['deposit', 'remaining'], required: true },
  snapshot: { type: Object, required: true },
}, {
  timestamps: true,
});

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
