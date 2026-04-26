import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User.model';
import { IPost } from './Post.model';

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  content: string;
  post: IPost | mongoose.Types.ObjectId;
  author: IUser | mongoose.Types.ObjectId;
  parent?: IComment | mongoose.Types.ObjectId;
  isApproved: boolean;
  isDeleted: boolean;
  likes: number;
  depth: number; // Nesting depth (max 3)
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    depth: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parent: 1 });
commentSchema.index({ isApproved: 1 });

// Virtual for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parent',
});

// Prevent deep nesting
commentSchema.pre('save', function (next) {
  if (this.parent) {
    const MAX_DEPTH = 3;
    if (this.depth >= MAX_DEPTH) {
      return next(new Error('Maximum nesting depth exceeded'));
    }
    this.depth = this.depth + 1;
  }
  next();
});

export const Comment = mongoose.model<IComment>('Comment', commentSchema);
