# 5. State Management

State will be managed by separating UI Form State from Server State.

- **UI Form State**: Handled exclusively by react-hook-form for performance and robust validation.
- **Server State (API Calls)**: Handled exclusively by TanStack Query (@tanstack/react-query) to manage loading, error, and success states declaratively.

This logic will be orchestrated within a custom hook, as shown in the template below.

## State Management Template

```typescript
// src/hooks/useDossierForm.ts

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { submitDossier } from '../services/dossierService';
import { dossierFormSchema } from '../types';

type DossierFormValues = z.infer<typeof dossierFormSchema>;

export const useDossierForm = () => {
  const form = useForm<DossierFormValues>({
    resolver: zodResolver(dossierFormSchema),
    defaultValues: {
      agentEmail: '',
      propertyDetails: '',
      photos: undefined,
    },
  });

  const { mutate: performSubmit, status } = useMutation({
    mutationFn: submitDossier,
    onSuccess: () => form.reset(),
    onError: (error) => console.error("Submission failed:", error),
  });

  const handleSubmit = form.handleSubmit((data) => {
    const formData = new FormData();
    // Logic to convert validated 'data' object to FormData
    performSubmit(formData);
  });

  return {
    form,
    handleSubmit,
    status, // 'idle' | 'loading' | 'success' | 'error'
  };
};
```
