# 10. Environment Configuration

We will use a type-safe environment configuration strategy using Zod to validate variables at startup.

## Type-Safe Configuration Module

```typescript
// src/config/env.ts

import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables.');
}

export const env = parsedEnv.data;
```
