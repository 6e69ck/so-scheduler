import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ['cash', 'cheque', 'e-transfer', 'credit'], required: true },
  category: { type: String, enum: ['revenue', 'reimbursement'], required: true },
  account: { type: String, enum: ['Bank', 'Member Reimbursements', 'Fees', 'Tips'], required: true },
  intent: { type: String, enum: ['payment', 'tip', 'fee', 'reimbursement'], required: true },
  date: { type: Date, required: true },
  notes: { type: String, default: '' },
  receiptUrl: { type: String, default: '' },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
}, {
  timestamps: true,
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
