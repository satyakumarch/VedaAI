// ============================================================
// VedaAI Backend - Generated Paper Model
// ============================================================
import mongoose, { Document, Schema } from 'mongoose';
import { ISection, Difficulty } from '../types';

export interface IGeneratedPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sections: ISection[];
  totalMarks: number;
  totalQuestions: number;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  generatedAt: Date;
  regenerationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema(
  {
    question: { type: String, required: true },
    type: {
      type: String,
      enum: ['mcq', 'short_answer', 'long_answer', 'true_false', 'diagram', 'numerical', 'fill_blanks'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    marks: { type: Number, required: true, min: 1 },
    options: [{ type: String }],
    answer: { type: String },
  },
  { _id: true }
);

const SectionSchema = new Schema(
  {
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: [QuestionSchema],
    totalMarks: { type: Number, required: true },
  },
  { _id: true }
);

const GeneratedPaperSchema = new Schema<IGeneratedPaper>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sections: [SectionSchema],
    totalMarks: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    difficultyBreakdown: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },
    generatedAt: { type: Date, default: Date.now },
    regenerationCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const GeneratedPaper = mongoose.model<IGeneratedPaper>(
  'GeneratedPaper',
  GeneratedPaperSchema
);
