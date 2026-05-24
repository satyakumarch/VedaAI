// ============================================================
// VedaAI Backend - Assignment Model
// ============================================================
import mongoose, { Document, Schema } from 'mongoose';
import { QuestionType, AssignmentStatus, DifficultyDistribution } from '../types';

export interface IAssignment extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  topic: string;
  dueDate: Date;
  questionTypes: QuestionType[];
  numberOfQuestions: number;
  totalMarks: number;
  difficultyDistribution: DifficultyDistribution;
  instructions?: string;
  uploadedContent?: string;   // extracted text from PDF/TXT
  uploadedFileName?: string;
  status: AssignmentStatus;
  jobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 100,
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
      maxlength: 200,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    questionTypes: {
      type: [String],
      enum: ['mcq', 'short_answer', 'long_answer', 'true_false', 'diagram', 'numerical', 'fill_blanks'],
      required: true,
    },
    numberOfQuestions: {
      type: Number,
      required: true,
      min: 1,
      max: 500,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
      max: 2000,
    },
    difficultyDistribution: {
      easy: { type: Number, default: 33 },
      medium: { type: Number, default: 34 },
      hard: { type: Number, default: 33 },
    },
    instructions: {
      type: String,
      maxlength: 1000,
    },
    uploadedContent: {
      type: String,
    },
    uploadedFileName: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'queued', 'processing', 'completed', 'failed'],
      default: 'draft',
      index: true,
    },
    jobId: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient user-based queries
AssignmentSchema.index({ userId: 1, createdAt: -1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
