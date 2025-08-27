import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dossierFormSchema, type DossierFormValues } from '@/types/dossierForm';
import { useState } from 'react';

export const useDossierForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    
    try {
      // For now, just log the data and prepare for API integration (Story 1.3)
      console.log('Form submitted with data:', data);
      
      // Convert to FormData for future API integration
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
      
      console.log('FormData prepared for API:', formData);
      
      // Show success message
      alert('Formulaire soumis avec succès!');
      
      // Reset form after successful submission
      form.reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Une erreur est survenue lors de la soumission du formulaire.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    handleSubmit,
    isSubmitting,
  };
};