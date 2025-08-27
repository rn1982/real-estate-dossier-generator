import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input Component', () => {
  it('renders an input field', () => {
    render(<Input placeholder="Test input" />);
    const input = screen.getByPlaceholderText('Test input');
    expect(input).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Test input" />);
    const input = screen.getByPlaceholderText('Test input') as HTMLInputElement;
    
    await user.type(input, 'Hello World');
    expect(input.value).toBe('Hello World');
  });

  it('displays error message when error prop is provided', () => {
    render(<Input error="This field is required" />);
    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toBeInTheDocument();
  });

  it('applies error styles when error is present', () => {
    render(<Input error="Error" placeholder="Test input" />);
    const input = screen.getByPlaceholderText('Test input');
    expect(input.className).toContain('border-red-500');
  });

  it('supports different input types', () => {
    render(<Input type="email" placeholder="Email" />);
    const input = screen.getByPlaceholderText('Email') as HTMLInputElement;
    expect(input.type).toBe('email');
  });

  it('can be disabled', () => {
    render(<Input disabled placeholder="Disabled input" />);
    const input = screen.getByPlaceholderText('Disabled input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});