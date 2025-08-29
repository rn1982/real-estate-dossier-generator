import { useEffect, useCallback } from 'react';
import type { UseFormReturn, Path } from 'react-hook-form';

const STORAGE_KEY = 'dossier_form_draft';
const STORAGE_EXPIRY_KEY = 'dossier_form_draft_expiry';
const EXPIRY_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface StoredFormData<T = Record<string, unknown>> {
  data: T;
  timestamp: number;
}

export const useFormPersistence = <T extends Record<string, any> = Record<string, any>>(
  form: UseFormReturn<T>,
  isSubmitting: boolean,
  submitSuccess: boolean
) => {
  const { watch, reset, setValue } = form;

  // Save form data to localStorage with debouncing
  useEffect(() => {
    if (isSubmitting || submitSuccess) {
      return; // Don't save while submitting or after success
    }

    const subscription = watch((data) => {
      // Don't save photos to localStorage (too large and not necessary)
      const dataToStore = { ...data };
      if ('photos' in dataToStore) {
        delete dataToStore.photos;
      }

      const storageData: StoredFormData<typeof dataToStore> = {
        data: dataToStore,
        timestamp: Date.now(),
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
        localStorage.setItem(STORAGE_EXPIRY_KEY, String(Date.now() + EXPIRY_DURATION));
      } catch (error) {
        console.warn('Failed to save form data to localStorage:', error);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, isSubmitting, submitSuccess]);

  // Clear storage function needs to be defined before use
  const clearFormStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
    } catch (error) {
      console.warn('Failed to clear form storage:', error);
    }
  }, []);

  // Restore form data on mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
      
      if (storedData && expiry) {
        const expiryTime = parseInt(expiry, 10);
        
        // Check if data has expired
        if (Date.now() > expiryTime) {
          clearFormStorage();
          return;
        }

        const { data }: StoredFormData<T> = JSON.parse(storedData);
        
        // Restore each field individually
        Object.keys(data).forEach((key) => {
          if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
            setValue(key as Path<T>, data[key]);
          }
        });
        
        console.log('Form data restored from localStorage');
      }
    } catch (error) {
      console.warn('Failed to restore form data from localStorage:', error);
      clearFormStorage();
    }
  }, [setValue, clearFormStorage]);

  // Clear storage after successful submission
  useEffect(() => {
    if (submitSuccess) {
      clearFormStorage();
    }
  }, [submitSuccess, clearFormStorage]);

  const clearFormAndStorage = useCallback(() => {
    reset();
    clearFormStorage();
  }, [reset, clearFormStorage]);

  return {
    clearFormAndStorage,
  };
};