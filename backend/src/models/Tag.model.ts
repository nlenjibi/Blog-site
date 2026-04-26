import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      trim: true,
      unique: true,
      maxlength: [50, 'Tag name cannot exceed 50 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Tag slug is required'],
      unique: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
tagSchema.index({ slug: 1 });
tagSchema.index({ name: 1 });
tagSchema.index({ usageCount: -1 });

export const Tag = mongoose.model<ITag>('Tag', tagSchema);
