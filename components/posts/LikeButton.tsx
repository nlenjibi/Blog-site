import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  onLike: () => Promise<void>;
  disabled?: boolean;
}

export const LikeButton = React.forwardRef<HTMLButtonElement, LikeButtonProps>(
  ({ isLiked, likeCount, onLike, disabled }, ref) => {
    const [isAnimating, setIsAnimating] = React.useState(false);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const handleClick = async () => {
      if (disabled || isProcessing) return;
      
      setIsAnimating(true);
      setIsProcessing(true);
      
      try {
        await onLike();
      } finally {
        setIsProcessing(false);
        setTimeout(() => setIsAnimating(false), 300);
      }
    };

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={cn(
          'gap-1 transition-colors',
          isLiked
            ? 'text-red-500 hover:text-red-600 hover:bg-red-50/80 dark:hover:bg-red-900/30'
            : 'text-muted-foreground hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20'
        )}
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-transform',
            isAnimating && 'animate-ping',
            isLiked && 'fill-current'
          )}
        />
        <span className="text-sm font-medium">{likeCount}</span>
      </Button>
    );
  }
);

LikeButton.displayName = 'LikeButton';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
