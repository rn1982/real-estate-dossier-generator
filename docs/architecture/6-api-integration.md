# 6. API Integration

All API communication will be consolidated into service functions. To align with the YAGNI principle for this MVP, we will use a direct, simple fetch pattern within each service.

## API Service Template

```typescript
// src/services/dossierService.ts

import { DossierPostResponse } from '../types';

export const submitDossier = async (formData: FormData): Promise<DossierPostResponse> => {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    console.error("VITE_API_URL is not defined.");
    throw new Error("Application is not configured correctly.");
  }

  const response = await fetch(`${apiUrl}/dossier`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
};
```
