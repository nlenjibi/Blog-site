import { useState } from 'react';
import { format } from 'date-fns';
import { Avatar, Button, Textarea, Card, CardContent } from '@/components/ui';
import type { Comment } from '@/types';

export interface CommentSectionProps {
  postId: string;
  comments?: Comment[];
  onCommentSubmit?: (comment: { content: string; parentId?: string }) => Promise<void>;
}

export const CommentSection = React.forwardRef<HTMLDivElement, CommentSectionProps>(
  ({ postId, comments = [], onCommentSubmit }, ref) => {
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim() || !onCommentSubmit) return;

      setIsSubmitting(true);
      try {
        await onCommentSubmit({ content: newComment });
        setNewComment('');
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleSubmitReply = async (parentId: string) => {
      if (!replyContent.trim() || !onCommentSubmit) return;

      setIsSubmitting(true);
      try {
        await onCommentSubmit({ content: replyContent, parentId });
        setReplyContent('');
        setReplyingTo(null);
      } finally {
        setIsSubmitting(false);
      }
    };

    const renderComment = (comment: Comment, depth = 0) => {
      const maxDepth = 3;
      const canReply = depth < maxDepth;

      return (
        <div key={comment._id} className="flex gap-3" style={{ marginLeft: depth > 0 ? '2rem' : 0 }}>
          <Avatar
            src={comment.author.avatar}
            alt={comment.author.name}
            fallback={comment.author.name.charAt(0)}
            size="sm"
          />
          <div className="flex-1">
            <Card className="mb-2">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{comment.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(
                      replyingTo === comment._id ? null : comment._id
                    )}
                    disabled={!canReply}
                  >
                    Reply
                  </Button>
                </div>
                {canReply && replyingTo === comment._id && (
                  <div className="mt-3">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write your reply..."
                      className="mb-2"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSubmitReply(comment._id)}
                        disabled={isSubmitting || !replyContent.trim()}
                      >
                        {isSubmitting ? 'Posting...' : 'Reply'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2 border-l-2 border-muted ml-4">
                {comment.replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div ref={ref} className="space-y-6">
        <h3 className="text-xl font-semibold">
          Comments ({comments.length})
        </h3>

        {/* New Comment Form */}
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your comment..."
                className="min-h-[80px]"
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                >
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => renderComment(comment))
          )}
        </div>
      </div>
    );
  }
);

CommentSection.displayName = 'CommentSection';

export { CommentSection };
