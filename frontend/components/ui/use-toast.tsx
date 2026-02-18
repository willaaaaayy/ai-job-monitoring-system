'use client';

import * as React from 'react';
import { toast as sonnerToast } from 'sonner';

export type ToastActionElement = React.ReactElement;

export interface ToastProps {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = ({ title, description, variant }: Omit<ToastProps, 'id'>) => {
    if (variant === 'destructive') {
      sonnerToast.error(title as string, {
        description: description as string,
      });
    } else {
      sonnerToast.success(title as string, {
        description: description as string,
      });
    }
  };

  return {
    toast,
  };
}
