import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  messageText: string;
  isRead: boolean;
  createdAt: Date; // from timestamps
}

const MessageSchema: Schema<IMessage> = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messageText: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, {
  timestamps: true
});

const MessageModel = (mongoose.models.Message as Model<IMessage>) || mongoose.model<IMessage>('Message', MessageSchema);
export default MessageModel;
