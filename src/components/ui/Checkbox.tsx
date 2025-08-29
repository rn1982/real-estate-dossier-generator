import React from 'react';

interface CheckboxProps {
  id: string;
  label: string;
  checked?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  checked = false,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
    </div>
  );
};