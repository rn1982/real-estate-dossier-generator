import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:3000'),
  VITE_APP_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
})
