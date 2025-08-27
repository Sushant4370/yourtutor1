
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IInquiry extends Document {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

const InquirySchema: Schema<IInquiry> = new Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required.'],
    trim: true,
  },
  email: { 
    type: String, 
    required: [true, 'Email is required.'],
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
  },
  subject: { 
    type: String,
    trim: true,
  },
  message: { 
    type: String, 
    required: [true, 'Message is required.'],
  },
}, {
  timestamps: true // This will add `createdAt` and `updatedAt` fields
});

const InquiryModel = (mongoose.models.Inquiry as Model<IInquiry>) || mongoose.model<IInquiry>('Inquiry', InquirySchema);

export default InquiryModel;
