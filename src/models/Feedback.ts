import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IFeedback extends Document {
  studentId: mongoose.Types.ObjectId;
  tutorId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  subject: string;
}

const FeedbackSchema: Schema<IFeedback> = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  subject: { type: String, required: true },
}, {
  timestamps: true
});

const FeedbackModel = (mongoose.models.Feedback as Model<IFeedback>) || mongoose.model<IFeedback>('Feedback', FeedbackSchema);
export default FeedbackModel;
