
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBooking extends Document {
  studentId: mongoose.Types.ObjectId;
  tutorId: mongoose.Types.ObjectId;
  subject: string;
  sessionDate: Date;
  status: 'pending_payment' | 'scheduled' | 'completed' | 'cancelled' | 'reschedule_requested';
  rescheduleRequesterRole?: 'student' | 'tutor';
  stripeSessionId?: string;
  feedbackSubmitted: boolean;
  meetingUrl?: string;
  meetingStartUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  _id: mongoose.Types.ObjectId;
}

const BookingSchema: Schema<IBooking> = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  sessionDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending_payment', 'scheduled', 'completed', 'cancelled', 'reschedule_requested'], 
    default: 'pending_payment' 
  },
  rescheduleRequesterRole: {
    type: String,
    enum: ['student', 'tutor'],
  },
  stripeSessionId: { type: String, index: true },
  feedbackSubmitted: { type: Boolean, default: false },
  meetingUrl: { type: String },
  meetingStartUrl: { type: String },
  meetingId: { type: String },
  meetingPassword: { type: String },
}, {
  timestamps: true
});

const BookingModel = (mongoose.models.Booking as Model<IBooking>) || mongoose.model<IBooking>('Booking', BookingSchema);
export default BookingModel;
