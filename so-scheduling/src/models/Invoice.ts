import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  shortHash: { type: String, required: true, unique: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  type: { type: String, enum: ['deposit', 'remaining', 'custom'], required: true },
  snapshot: { type: Object, required: true },
  customLineItems: [{
    description: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  customTotal: { type: Number },
}, {
  timestamps: true,
});

// Clear the model from mongoose cache if it exists to ensure schema updates are applied
if (mongoose.models.Invoice) {
  delete mongoose.models.Invoice;
}

export default mongoose.model('Invoice', InvoiceSchema);
