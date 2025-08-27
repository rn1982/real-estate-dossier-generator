import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dossierFormSchema, type DossierFormValues } from '@/types/dossierForm';
import { useState } from 'react';
import { submitDossierWithRetry, DossierServiceError } from '@/services/dossierService';

export const useDossierForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const form = useForm<DossierFormValues>({
    resolver: zodResolver(dossierFormSchema),
    defaultValues: {
      agentEmail: '',
      propertyType: 'appartement',
      address: '',
      price: '',
      targetBuyer: 'jeune_famille',
      photos: [],
    },
  });

  const handleSubmit = async (data: DossierFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      // Convert to FormData for API
      const formData = new FormData();
      
      // Add text fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'photos' && value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // Add photos
      if (data.photos) {
        data.photos.forEach((file) => {
          formData.append('photos', file);
        });
      }
      
      // Submit to API with retry logic
      const response = await submitDossierWithRetry(formData);
      
      console.log('Dossier submitted successfully:', response);
      
      // Show success message
      setSubmitSuccess(true);
      alert(`Dossier soumis avec succès! ${response.data.photoCount} photo(s) reçue(s).`);
      
      // Reset form after successful submission
      form.reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la soumission du formulaire.';
      
      if (error instanceof DossierServiceError) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    handleSubmit,
    isSubmitting,
    submitError,
    submitSuccess,
  };
};