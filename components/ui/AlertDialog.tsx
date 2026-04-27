import React from 'react';
import { cn } from '@/lib/utils';

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export const AlertDialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: AlertDialogProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <h3 className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </div>
        {footer && (
          <div className="mt-6 flex justify-end space-x-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
