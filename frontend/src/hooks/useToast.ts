import { useState, useEffect, useCallback } from 'react';
import { ToastItem, ToastOptions } from '@/types/toast';

type ToastListener = (toasts: ToastItem[]) => void;

let toastsState: ToastItem[] = [];
const listeners = new Set<ToastListener>();

function notify() {
  listeners.forEach((listener) => listener([...toastsState]));
}

let counter = 0;
function generateId(): string {
  counter += 1;
  return `toast-${Date.now()}-${counter}`;
}

export function dispatchToast(options: ToastOptions): string {
  const id = generateId();
  const newToast: ToastItem = {
    id,
    createdAt: Date.now(),
    duration: 4000,
    ...options,
  };

  // Limit max simultaneous toasts to 5
  toastsState = [newToast, ...toastsState].slice(0, 5);
  notify();

  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, newToast.duration);
  }

  return id;
}

export function dismissToast(id: string) {
  toastsState = toastsState.filter((t) => t.id !== id);
  notify();
}

export function dismissAllToasts() {
  toastsState = [];
  notify();
}

// Convenient global helper object
export const toast = Object.assign(
  (options: ToastOptions) => dispatchToast(options),
  {
    success: (title: string, description?: React.ReactNode, options?: Partial<ToastOptions>) =>
      dispatchToast({ title, description, variant: 'success', ...options }),
    error: (title: string, description?: React.ReactNode, options?: Partial<ToastOptions>) =>
      dispatchToast({ title, description, variant: 'error', duration: 6000, ...options }),
    warning: (title: string, description?: React.ReactNode, options?: Partial<ToastOptions>) =>
      dispatchToast({ title, description, variant: 'warning', ...options }),
    info: (title: string, description?: React.ReactNode, options?: Partial<ToastOptions>) =>
      dispatchToast({ title, description, variant: 'info', ...options }),
    ai: (title: string, description?: React.ReactNode, options?: Partial<ToastOptions>) =>
      dispatchToast({ title, description, variant: 'ai', duration: 5000, ...options }),
    dismiss: dismissToast,
    dismissAll: dismissAllToasts,
  }
);

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(toastsState);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  const triggerToast = useCallback((options: ToastOptions) => dispatchToast(options), []);
  const dismiss = useCallback((id: string) => dismissToast(id), []);

  return {
    toasts,
    toast,
    triggerToast,
    dismiss,
    dismissAll: dismissAllToasts,
  };
}
