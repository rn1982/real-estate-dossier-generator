import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastProvider, ToastViewport } from '@/components/ui/Toast';

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: ToastVariant;
}

interface ToastContextType {
  toast: (options: {
    title?: string;
    description?: string;
    action?: React.ReactNode;
    variant?: ToastVariant;
    duration?: number;
  }) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback(
    ({
      title,
      description,
      action,
      variant = 'default',
      duration = 5000,
    }: {
      title?: string;
      description?: string;
      action?: React.ReactNode;
      variant?: ToastVariant;
      duration?: number;
    }) => {
      const id = Math.random().toString(36);
      setToasts((prev) => [...prev, { id, title, description, action, variant }]);

      if (duration !== Infinity) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }

      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      <ToastProvider duration={5000}>
        {children}
        {toasts.map(({ id, title, description, action, variant }) => (
          <Toast
            key={id}
            title={title}
            description={description}
            action={action}
            variant={variant}
            onOpenChange={(open) => {
              if (!open) dismiss(id);
            }}
          />
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
};