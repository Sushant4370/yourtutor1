import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPayment extends Document {
  studentId: mongoose.Types.ObjectId;
  tutorId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  paymentMethod: 'stripe' | 'paypal' | 'other';
  transactionTime: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success', 'failed', 'pending'], required: true },
  paymentMethod: { type: String, enum: ['stripe', 'paypal', 'other'], required: true },
  transactionTime: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const PaymentModel = (mongoose.models.Payment as Model<IPayment>) || mongoose.model<IPayment>('Payment', PaymentSchema);
export default PaymentModel;
