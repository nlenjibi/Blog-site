import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User.model';
import { IPost } from './Post.model';

export interface ILike extends Document {
  _id: mongoose.Types.ObjectId;
  post: IPost | mongoose.Types.ObjectId;
  user: IUser | mongoose.Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index (one like per user per post)
likeSchema.index({ post: 1, user: 1 }, { unique: true });

export const Like = mongoose.model<ILike>('Like', likeSchema);
