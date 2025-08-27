import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

describe('Select Component', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  it('renders a select field with options', () => {
    render(<Select options={options} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    options.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('allows user to select an option', async () => {
    const user = userEvent.setup();
    render(<Select options={options} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    
    await user.selectOptions(select, 'option2');
    expect(select.value).toBe('option2');
  });

  it('displays placeholder when provided', () => {
    render(<Select options={options} placeholder="Choose an option" />);
    expect(screen.getByText('Choose an option')).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    render(<Select options={options} error="Please select an option" />);
    const errorMessage = screen.getByText('Please select an option');
    expect(errorMessage).toBeInTheDocument();
  });

  it('applies error styles when error is present', () => {
    render(<Select options={options} error="Error" />);
    const select = screen.getByRole('combobox');
    expect(select.className).toContain('border-red-500');
  });

  it('can be disabled', () => {
    render(<Select options={options} disabled />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });
});