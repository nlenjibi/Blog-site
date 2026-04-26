import mongoose, { Document, Schema } from 'mongoose';
import { IPost } from './Post.model';

export interface IPostView extends Document {
  _id: mongoose.Types.ObjectId;
  post: IPost | mongoose.Types.ObjectId;
  user?: IUser | mongoose.Types.ObjectId;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  timestamp: Date;
}

const viewSchema = new Schema<IPostView>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    sessionId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'timestamp' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for aggregations
viewSchema.index({ post: 1, timestamp: -1 });

// TTL index to automatically delete old views after 90 days
viewSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const PostView = mongoose.model<IPostView>('PostView', viewSchema);
