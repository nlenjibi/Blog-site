import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User.model';
import { IPost } from './Post.model';

export interface IBookmark extends Document {
  _id: mongoose.Types.ObjectId;
  post: IPost | mongoose.Types.ObjectId;
  user: IUser | mongoose.Types.ObjectId;
  createdAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>(
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

// Compound unique index (one bookmark per user per post)
bookmarkSchema.index({ post: 1, user: 1 }, { unique: true });

export const Bookmark = mongoose.model<IBookmark>('Bookmark', bookmarkSchema);
