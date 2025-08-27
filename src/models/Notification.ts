import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'booking' | 'reminder' | 'cancellation' | 'feedback';
  content: string;
  sentAt: Date;
}

const NotificationSchema: Schema<INotification> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['booking', 'reminder', 'cancellation', 'feedback'], required: true },
  content: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

const NotificationModel = (mongoose.models.Notification as Model<INotification>) || mongoose.model<INotification>('Notification', NotificationSchema);
export default NotificationModel;
