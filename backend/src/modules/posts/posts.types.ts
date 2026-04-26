import { IPost } from '../../models/Post.model';
import { ITag } from '../../models/Tag.model';
import { ICategory } from '../../models/Category.model';
import { IUser } from '../../models/User.model';

export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  author: UserSummary;
  category?: CategorySummary;
  tags: TagSummary[];
  published: boolean;
  publishedAt?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostDetail extends PostListItem {
  content: string;
  isLiked: boolean;
  isBookmarked: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UserSummary {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface TagSummary {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface CreatePostInput {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category?: string;
  tags?: string[];
  published?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdatePostInput extends Partial<CreatePostInput> {}

export interface PostListParams {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
