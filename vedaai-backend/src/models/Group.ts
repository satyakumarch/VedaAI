// ============================================================
// VedaAI Backend - Group Model
// ============================================================
import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  subject: string;
  grade: string;
  studentCount: number;
  description?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:         { type: String, required: true, trim: true, maxlength: 100 },
    subject:      { type: String, required: true, trim: true, maxlength: 100 },
    grade:        { type: String, required: true, trim: true, maxlength: 50 },
    studentCount: { type: Number, required: true, min: 0, max: 1000, default: 0 },
    description:  { type: String, maxlength: 500 },
    color:        { type: String, default: 'blue' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

GroupSchema.index({ userId: 1, createdAt: -1 });

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
