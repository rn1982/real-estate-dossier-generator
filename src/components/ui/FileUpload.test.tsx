import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload } from './FileUpload';

describe('FileUpload Component', () => {
  it('renders upload area with instructions', () => {
    const onFilesChange = vi.fn();
    render(<FileUpload onFilesChange={onFilesChange} />);
    
    expect(screen.getByText(/Glissez-déposez des photos ici/)).toBeInTheDocument();
    expect(screen.getByText(/JPG, PNG, WEBP/)).toBeInTheDocument();
  });

  it('calls onFilesChange when files are dropped', async () => {
    const onFilesChange = vi.fn();
    render(<FileUpload onFilesChange={onFilesChange} />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const dropzone = screen.getByText(/Glissez-déposez des photos ici/).closest('div');
    
    if (dropzone) {
      const dataTransfer = {
        files: [file],
        items: [{ kind: 'file', type: 'image/jpeg', getAsFile: () => file }],
        types: ['Files'],
      };
      
      fireEvent.drop(dropzone, { dataTransfer });
      
      await waitFor(() => {
        expect(onFilesChange).toHaveBeenCalled();
      });
    }
  });

  it('displays selected files', () => {
    const onFilesChange = vi.fn();
    const files = [
      new File(['test1'], 'photo1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'photo2.png', { type: 'image/png' }),
    ];
    
    render(<FileUpload onFilesChange={onFilesChange} value={files} />);
    
    expect(screen.getByText('photo1.jpg')).toBeInTheDocument();
    expect(screen.getByText('photo2.png')).toBeInTheDocument();
    expect(screen.getByText('Fichiers sélectionnés (2):')).toBeInTheDocument();
  });

  it('allows removing files', async () => {
    const onFilesChange = vi.fn();
    const files = [
      new File(['test1'], 'photo1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'photo2.png', { type: 'image/png' }),
    ];
    
    render(<FileUpload onFilesChange={onFilesChange} value={files} />);
    
    const removeButtons = screen.getAllByText('Supprimer');
    fireEvent.click(removeButtons[0]);
    
    expect(onFilesChange).toHaveBeenCalledWith([files[1]]);
  });

  it('displays error message when error prop is provided', () => {
    const onFilesChange = vi.fn();
    render(<FileUpload onFilesChange={onFilesChange} error="Maximum 20 photos" />);
    
    expect(screen.getByText('Maximum 20 photos')).toBeInTheDocument();
  });

  it('respects maxFiles limit', () => {
    const onFilesChange = vi.fn();
    render(<FileUpload onFilesChange={onFilesChange} maxFiles={5} />);
    
    expect(screen.getByText(/max 5 fichiers/)).toBeInTheDocument();
  });
});