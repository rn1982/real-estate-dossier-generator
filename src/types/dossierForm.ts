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
    .refine(
      (files) => files.every((file) => file.size <= 10 * 1024 * 1024),
      'Chaque fichier doit faire moins de 10 MB'
    )
    .refine(
      (files) => files.every((file) => file.type.startsWith('image/')),
      'Seuls les fichiers image sont acceptés'
    )
    .optional(),
  
  // Section 5: PDF Customization
  pdfTemplate: z.enum(['modern', 'classic', 'luxury', 'corporate', 'eco']).optional().default('modern'),
  pdfPrimaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Format de couleur invalide').optional(),
  pdfSecondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Format de couleur invalide').optional(),
  pdfAccentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Format de couleur invalide').optional(),
  pdfLogo: z.instanceof(File)
    .refine(
      (file) => file.size <= 2 * 1024 * 1024,
      'Le logo doit faire moins de 2 MB'
    )
    .refine(
      (file) => file.type.startsWith('image/'),
      'Le logo doit être une image'
    )
    .optional(),
  pdfPhotoLayout: z.enum(['grid', 'list']).optional().default('grid'),
  pdfPhotoColumns: z.number().min(2).max(4).optional().default(2),
  pdfShowAgent: z.boolean().optional().default(true),
  pdfShowSocial: z.boolean().optional().default(true),
  pdfShowAI: z.boolean().optional().default(true),
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

export const pdfTemplateOptions = [
  { value: 'modern', label: 'Moderne - Épuré et minimaliste' },
  { value: 'classic', label: 'Classique - Traditionnel et élégant' },
  { value: 'luxury', label: 'Luxe - Noir et or sophistiqué' },
  { value: 'corporate', label: 'Corporate - Professionnel et neutre' },
  { value: 'eco', label: 'Éco - Vert et durable' },
] as const;

export const pdfPhotoLayoutOptions = [
  { value: 'grid', label: 'Grille' },
  { value: 'list', label: 'Liste' },
] as const;