import { z } from 'zod';

export const dossierFormSchema = z.object({
  // Section 1: Agent Information
  agentEmail: z.string()
    .min(1, 'Adresse e-mail requise')
    .email('Adresse e-mail invalide'),
  
  // Section 2: Property Information
  propertyType: z.enum(['appartement', 'maison'], {
    required_error: 'Type de propriété requis',
  }),
  address: z.string().min(1, 'Adresse requise'),
  price: z.string()
    .min(1, 'Prix requis')
    .regex(/^\d+(\.\d{1,2})?$/, 'Format de prix invalide'),
  roomCount: z.number()
    .min(0, 'Le nombre de pièces doit être positif')
    .optional(),
  livingArea: z.number()
    .min(0, 'La surface doit être positive')
    .optional(),
  constructionYear: z.number()
    .min(1800, 'Année de construction invalide')
    .max(new Date().getFullYear(), 'L\'année de construction ne peut pas être dans le futur')
    .optional(),
  keyPoints: z.string()
    .max(500, 'Maximum 500 caractères')
    .optional(),
  propertyDescription: z.string()
    .max(2000, 'Maximum 2000 caractères')
    .optional(),
  
  // Section 3: AI & Marketing
  targetBuyer: z.enum([
    'jeune_famille',
    'professionnel',
    'retraite',
    'investisseur',
    'premier_acheteur',
    'famille_multigenerationnelle',
  ], {
    required_error: 'Acheteur cible requis',
  }),
  
  // Section 4: Media
  photos: z.array(z.instanceof(File))
    .max(20, 'Maximum 20 photos')
    .optional(),
});

export type DossierFormValues = z.infer<typeof dossierFormSchema>;

export const propertyTypeOptions = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
] as const;

export const targetBuyerOptions = [
  { value: 'jeune_famille', label: 'Jeune famille' },
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'retraite', label: 'Retraité' },
  { value: 'investisseur', label: 'Investisseur' },
  { value: 'premier_acheteur', label: 'Premier acheteur' },
  { value: 'famille_multigenerationnelle', label: 'Famille multigénérationnelle' },
] as const;