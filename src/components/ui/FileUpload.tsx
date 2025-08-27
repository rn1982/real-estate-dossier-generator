import * as React from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  value?: File[];
  error?: string;
  maxFiles?: number;
  accept?: DropzoneOptions['accept'];
  className?: string;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  value = [],
  error,
  maxFiles = 20,
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  },
  className,
  disabled = false,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled,
    onDrop: (acceptedFiles) => {
      if (!disabled) {
        onFilesChange([...value, ...acceptedFiles].slice(0, maxFiles));
      }
    },
  });

  const removeFile = (index: number) => {
    if (!disabled) {
      const newFiles = [...value];
      newFiles.splice(index, 1);
      onFilesChange(newFiles);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400',
          error && 'border-red-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Déposez les fichiers ici...'
            : 'Glissez-déposez des photos ici, ou cliquez pour sélectionner'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          JPG, PNG, WEBP jusqu'à 10MB (max {maxFiles} fichiers)
        </p>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {value.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Fichiers sélectionnés ({value.length}):</p>
          <ul className="space-y-1">
            {value.map((file, index) => (
              <li key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                <span className="truncate flex-1">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={disabled}
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export { FileUpload };