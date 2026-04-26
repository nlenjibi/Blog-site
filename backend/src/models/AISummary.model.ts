import mongoose, { Document, Schema } from 'mongoose';
import { IPost } from './Post.model';

export interface IAISummary extends Document {
  _id: mongoose.Types.ObjectId;
  post: IPost | mongoose.Types.ObjectId;
  content: string;
  modelUsed: string;
  tokensUsed: number;
  cachedAt: Date;
  expiresAt: Date;
}

const aiSummarySchema = new Schema<IAISummary>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: [true, 'Summary content is required'],
      maxlength: [2000, 'Summary cannot exceed 2000 characters'],
    },
    modelUsed: {
      type: String,
      default: 'gpt-4-turbo-preview',
    },
    tokensUsed: {
      type: Number,
      required: true,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false, // We only need cachedAt (will set manually)
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Set cachedAt when document is created
aiSummarySchema.pre('save', function (next) {
  this.cachedAt = new Date();
  next();
});

// TTL index for automatic expiration
aiSummarySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AISummary = mongoose.model<IAISummary>('AISummary', aiSummarySchema);
