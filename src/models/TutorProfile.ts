
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IQualification {
  url: string;
  publicId: string;
  originalFilename: string;
  fileType: string;
  uploadedAt: Date;
}

export interface ITutorProfile extends Document {
  tutorId: mongoose.Types.ObjectId;
  bio: string;
  hourlyRate: number;
  experience?: number;
  subjects: string[];
  teachingStyle?: string;
  aiSummary?: string;
  isOnline: boolean;
  isInPerson: boolean;
  availability: {
    date: Date;
    startTime: string;
    endTime: string;
  }[];
  qualifications: IQualification[];
}

const TutorProfileSchema: Schema<ITutorProfile> = new Schema({
  tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bio: { type: String, required: true },
  hourlyRate: { type: Number, required: true },
  experience: { type: Number },
  subjects: [{ type: String, required: true }],
  teachingStyle: { type: String },
  aiSummary: { type: String },
  isOnline: { type: Boolean, default: false },
  isInPerson: { type: Boolean, default: false },
  availability: [{
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  }],
  qualifications: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    originalFilename: { type: String, required: true },
    fileType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
}, {
  timestamps: true
});

const TutorProfileModel = (mongoose.models.TutorProfile as Model<ITutorProfile>) || mongoose.model<ITutorProfile>('TutorProfile', TutorProfileSchema);
export default TutorProfileModel;
