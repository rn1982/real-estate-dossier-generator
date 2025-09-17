import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle, AlertTriangle } from 'react-feather';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        success: 'border-green-200 bg-green-50 text-green-900',
        error: 'border-red-200 bg-red-50 text-red-900',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
        info: 'border-blue-200 bg-blue-50 text-blue-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const iconMap = {
  default: AlertCircle,
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', title, description, action, children, ...props }, ref) => {
    const Icon = iconMap[variant || 'default'];
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div className="flex">
          <Icon className="h-5 w-5 flex-shrink-0 mr-3 mt-0.5" />
          <div className="flex-1">
            {title && (
              <h3 className="text-sm font-semibold mb-1">{title}</h3>
            )}
            {description && (
              <div className="text-sm opacity-90">{description}</div>
            )}
            {children}
            {action && (
              <div className="mt-3">{action}</div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert };
