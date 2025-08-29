import React from 'react';
import { Label } from './Label';

interface ColorPickerProps {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  defaultColor?: string;
}

export const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ id, label, value, onChange, error, disabled = false, defaultColor = '#3498db' }, ref) => {
    return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          id={id}
          type="color"
          value={value || defaultColor}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-10 w-20 rounded border border-input cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        />
        <input
          type="text"
          value={value || defaultColor}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-F]{0,6}$/i.test(val)) {
              onChange(val);
            }
          }}
          disabled={disabled}
          placeholder="#000000"
          className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
  }
);