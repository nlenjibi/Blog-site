import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circle' | 'rounded';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'h-4 w-full',
      circle: 'h-10 w-10 rounded-full',
      rounded: 'h-4 w-full rounded-md',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse-slow rounded bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 bg-[length:200%_100%] shadow-inner',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };
