
import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  isAdmin: boolean;
  provider?: string;
  providerAccountId?: string;
  role: 'student' | 'tutor';
  tutorStatus: 'unverified' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, select: false },
  isAdmin: { type: Boolean, default: false },
  provider: { type: String },
  providerAccountId: { type: String },
  role: { type: String, enum: ['student', 'tutor'], required: true },
  tutorStatus: { 
    type: String, 
    enum: ['unverified', 'pending', 'approved', 'rejected'], 
    default: 'unverified' 
  },
  rejectionReason: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  avatar: { type: String },
}, {
  timestamps: true,
});

// Password hashing middleware
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    // Ensure error is passed to next if it's an instance of Error
    if (error instanceof Error) {
      return next(error);
    }
    // Otherwise, create a new Error instance
    return next(new Error('Password hashing failed'));
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false; // Should not happen if password was required for credentials provider
  return bcrypt.compare(candidatePassword, this.password);
};


const UserModel = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default UserModel;
