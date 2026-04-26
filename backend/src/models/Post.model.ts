import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User.model';
import { ICategory } from './Category.model';
import { ITag } from './Tag.model';

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  featured: boolean;
  published: boolean;
  publishedAt?: Date;
  author: IUser | mongoose.Types.ObjectId;
  category: ICategory | mongoose.Types.ObjectId;
  tags: (ITag | mongoose.Types.ObjectId)[];
  views: number;
  readingTime: number; // Estimated reading time in minutes
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Post slug is required'],
      unique: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    excerpt: {
      type: String,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      minlength: [100, 'Content must be at least 100 characters'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    readingTime: {
      type: Number,
      default: 5,
      min: 1,
    },
    seoTitle: {
      type: String,
      maxlength: [60, 'SEO title cannot exceed 60 characters'],
    },
    seoDescription: {
      type: String,
      maxlength: [160, 'SEO description cannot exceed 160 characters'],
    },
    metaKeywords: {
      type: String,
      maxlength: [255, 'Meta keywords cannot exceed 255 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
postSchema.index({ slug: 1 });
postSchema.index({ author: 1 });
postSchema.index({ category: 1 });
postSchema.index({ published: 1 });
postSchema.index({ publishedAt: -1 });
postSchema.index({ featured: 1 });
postSchema.index({ isActive: 1 });
postSchema.index({ views: -1 });
postSchema.index({ 'tags': 1 });

// Compound indexes
postSchema.index({ published: 1, publishedAt: -1 });
postSchema.index({ category: 1, published: 1, publishedAt: -1 });
postSchema.index({ featured: 1, published: 1 });

// Virtual for comments count
postSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  count: true,
});

// Virtual for likes count
postSchema.virtual('likesCount', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'post',
  count: true,
});

// Pre-save middleware: set publishedAt when publishing
postSchema.pre('save', function (next) {
  if (this.isModified('published') && this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Generate slug from title before saving
postSchema.pre('validate', async function (next) {
  if (this.isModified('title') || this.isNew) {
    const slugify = require('slugify');
    const baseSlug = slugify(this.title, { lower: true, strict: true });
    this.slug = await this.ensureUniqueSlug(baseSlug);
  }
  next();
});

/**
 * Ensure slug uniqueness by appending counter if needed
 */
postSchema.methods.ensureUniqueSlug = async function (baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await this.constructor.findOne({ slug, _id: { $ne: this._id } });
    if (!existing) break;
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};

export const Post = mongoose.model<IPost>('Post', postSchema);
