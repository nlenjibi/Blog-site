import React, { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

export const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    if (!src || imageError) {
      return (
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium overflow-hidden',
            sizeClasses[size],
            className
          )}
        >
          {fallback || (alt ? alt.charAt(0).toUpperCase() : '?')}
        </div>
      );
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn(
          'aspect-square h-full w-full rounded-full object-cover',
          className
        )}
        onError={() => setImageError(true)}
        {...props}
      />
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
