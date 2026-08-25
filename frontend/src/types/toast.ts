import React from 'react';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'ai';

export interface ToastAction {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  altText?: string;
}

export interface ToastOptions {
  title?: string;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number; // duration in ms (defaults to 4000)
  action?: ToastAction;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ToastItem extends ToastOptions {
  id: string;
  createdAt: number;
}
