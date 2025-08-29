import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dossierFormSchema, type DossierFormValues } from '@/types/dossierForm';
import { useState } from 'react';
import { submitDossierWithRetry, DossierServiceError } from '@/services/dossierService';
import { generatePDF, downloadPDF, PDFServiceError } from '@/services/pdfService';
import { useToast } from '@/contexts/ToastContext';
import { useFormPersistence } from './useFormPersistence';

export const useDossierForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const form = useForm<DossierFormValues>({
    resolver: zodResolver(dossierFormSchema) as any,
    mode: 'onChange', // Enable real-time validation
    reValidateMode: 'onChange', // Revalidate on every change
    delayError: 500, // Debounce validation errors by 500ms
    defaultValues: {
      agentEmail: '',
      propertyType: 'appartement',
      address: '',
      price: '',
      targetBuyer: 'jeune_famille',
      photos: [],
      pdfTemplate: 'modern',
      pdfPhotoLayout: 'grid',
      pdfPhotoColumns: 2,
      pdfShowAgent: true,
      pdfShowSocial: true,
      pdfShowAI: true,
    },
  });

  // Add form persistence
  const { clearFormAndStorage } = useFormPersistence(form as any, isSubmitting, submitSuccess);

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
      toast({
        title: 'Dossier soumis avec succès!',
        description: `${response.data.photoCount} photo(s) reçue(s). Votre propriété a été enregistrée.`,
        variant: 'success',
        duration: 5000,
      });
      
      // Reset form after successful submission
      form.reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la soumission du formulaire.';
      let errorTitle = 'Erreur de soumission';
      
      if (error instanceof DossierServiceError) {
        errorMessage = error.message;
        
        // Map specific error codes to user-friendly messages
        if (error.status === 400) {
          errorTitle = 'Données invalides';
          errorMessage = 'Veuillez vérifier les informations saisies et réessayer.';
        } else if (error.status === 413) {
          errorTitle = 'Fichier trop volumineux';
          errorMessage = 'Un ou plusieurs fichiers dépassent la limite de taille (10 MB par fichier).';
        } else if (error.status === 415) {
          errorTitle = 'Type de fichier non supporté';
          errorMessage = 'Seuls les fichiers image (JPG, PNG, WEBP) sont acceptés.';
        } else if (error.status === 429) {
          errorTitle = 'Limite de requêtes atteinte';
          errorMessage = 'Trop de soumissions. Veuillez patienter quelques minutes avant de réessayer.';
        } else if (error.status === 500 || error.status === 503) {
          errorTitle = 'Erreur serveur';
          errorMessage = 'Le serveur rencontre des difficultés. Veuillez réessayer dans quelques instants.';
        } else if (error.code === 'NETWORK_ERROR') {
          errorTitle = 'Erreur réseau';
          errorMessage = 'Vérifiez votre connexion internet et réessayez.';
        } else if (error.code === 'TIMEOUT') {
          errorTitle = 'Délai dépassé';
          errorMessage = 'La requête a pris trop de temps. Veuillez vérifier votre connexion et réessayer.';
        }
      }
      
      setSubmitError(errorMessage);
      
      // Create retry action for network errors
      const shouldShowRetry = error instanceof DossierServiceError && 
        (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT' || (error.status && error.status >= 500));
      
      toast({
        title: errorTitle,
        description: shouldShowRetry ? `${errorMessage} Cliquez pour réessayer.` : errorMessage,
        variant: 'error',
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePDF = async (data: DossierFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Show loading toast
      toast({
        title: 'Génération du PDF en cours...',
        description: 'Veuillez patienter pendant la création de votre dossier.',
        variant: 'info',
        duration: 0, // Keep showing until dismissed
      });
      
      // Generate PDF
      const pdfBlob = await generatePDF(data);
      
      // Download the PDF
      downloadPDF(pdfBlob, `dossier-${data.address?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'property'}.pdf`);
      
      // Show success message
      toast({
        title: 'PDF généré avec succès!',
        description: 'Le dossier a été téléchargé dans votre dossier de téléchargements.',
        variant: 'success',
        duration: 5000,
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la génération du PDF.';
      
      if (error instanceof PDFServiceError) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
      toast({
        title: 'Erreur de génération PDF',
        description: errorMessage,
        variant: 'error',
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    handleSubmit,
    handleGeneratePDF,
    isSubmitting,
    submitError,
    submitSuccess,
    clearFormAndStorage,
  };
};