import React from 'react';
import { Controller } from 'react-hook-form';
import { FormSection } from './FormSection';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { FileUpload } from '@/components/ui/FileUpload';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Checkbox } from '@/components/ui/Checkbox';
import { TemplatePreview } from './TemplatePreview';
import { useDossierForm } from '@/hooks/useDossierForm';
import { 
  propertyTypeOptions, 
  targetBuyerOptions,
  pdfTemplateOptions,
  pdfPhotoLayoutOptions 
} from '@/types/dossierForm';

export const DossierForm: React.FC = () => {
  const { form, handleSubmit, handleGeneratePDF, isSubmitting, clearFormAndStorage } = useDossierForm();
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = form;
  
  // Watch PDF customization values for preview
  const pdfTemplate = watch('pdfTemplate');
  const pdfColors = {
    primary: watch('pdfPrimaryColor'),
    secondary: watch('pdfSecondaryColor'),
    accent: watch('pdfAccentColor'),
  };
  const pdfPhotoLayout = watch('pdfPhotoLayout');
  const pdfPhotoColumns = watch('pdfPhotoColumns');
  const pdfShowAgent = watch('pdfShowAgent');
  const pdfShowSocial = watch('pdfShowSocial');
  const pdfShowAI = watch('pdfShowAI');

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Formulaire de Soumission de Propriété
      </h1>
      
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Section 1: Agent Information */}
        <FormSection
          title="1. Informations de l'Agent"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="agentEmail" required>
                Adresse e-mail de l'agent
              </Label>
              <Input
                id="agentEmail"
                type="email"
                placeholder="agent@example.com"
                error={errors.agentEmail?.message}
                disabled={isSubmitting}
                {...register('agentEmail')}
              />
            </div>
          </div>
        </FormSection>

        {/* Section 2: Property Information */}
        <FormSection
          title="2. Informations sur la Propriété"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="propertyType" required>
                Type de propriété
              </Label>
              <Controller
                name="propertyType"
                control={control}
                render={({ field }) => (
                  <Select
                    id="propertyType"
                    options={propertyTypeOptions}
                    error={errors.propertyType?.message}
                    disabled={isSubmitting}
                    {...field}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="address" required>
                Adresse
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="123 Rue Example, Genève"
                error={errors.address?.message}
                disabled={isSubmitting}
                {...register('address')}
              />
            </div>
            
            <div>
              <Label htmlFor="price" required>
                Prix (CHF)
              </Label>
              <Input
                id="price"
                type="text"
                placeholder="500000"
                error={errors.price?.message}
                disabled={isSubmitting}
                {...register('price')}
              />
            </div>
            
            <div>
              <Label htmlFor="roomCount">
                Nombre de pièces
              </Label>
              <Controller
                name="roomCount"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Input
                    id="roomCount"
                    type="number"
                    placeholder="3.5"
                    step="0.5"
                    min="0"
                    error={errors.roomCount?.message}
                    disabled={isSubmitting}
                    onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    value={value ?? ''}
                    {...field}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="livingArea">
                Surface habitable (m²)
              </Label>
              <Controller
                name="livingArea"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Input
                    id="livingArea"
                    type="number"
                    placeholder="85"
                    min="0"
                    error={errors.livingArea?.message}
                    disabled={isSubmitting}
                    onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    value={value ?? ''}
                    {...field}
                  />
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="constructionYear">
                Année de construction
              </Label>
              <Controller
                name="constructionYear"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Input
                    id="constructionYear"
                    type="number"
                    placeholder="2000"
                    min="1800"
                    max={new Date().getFullYear()}
                    error={errors.constructionYear?.message}
                    disabled={isSubmitting}
                    onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    value={value ?? ''}
                    {...field}
                  />
                )}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="keyPoints">
                Points de vente clés
              </Label>
              <textarea
                id="keyPoints"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="• Vue imprenable sur le lac&#10;• Proche des transports publics&#10;• Récemment rénové"
                rows={4}
                maxLength={500}
                disabled={isSubmitting}
                {...register('keyPoints')}
              />
              {errors.keyPoints && (
                <p className="mt-1 text-sm text-red-600">{errors.keyPoints.message}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="propertyDescription">
                Description de la propriété
              </Label>
              <textarea
                id="propertyDescription"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Description détaillée de la propriété..."
                rows={6}
                maxLength={2000}
                disabled={isSubmitting}
                {...register('propertyDescription')}
              />
              {errors.propertyDescription && (
                <p className="mt-1 text-sm text-red-600">{errors.propertyDescription.message}</p>
              )}
            </div>
          </div>
        </FormSection>

        {/* Section 3: AI & Marketing */}
        <FormSection
          title="3. AI & Marketing"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="targetBuyer" required>
                Acheteur cible
              </Label>
              <Controller
                name="targetBuyer"
                control={control}
                render={({ field }) => (
                  <Select
                    id="targetBuyer"
                    options={targetBuyerOptions}
                    error={errors.targetBuyer?.message}
                    disabled={isSubmitting}
                    {...field}
                  />
                )}
              />
            </div>
          </div>
        </FormSection>

        {/* Section 4: Media */}
        <FormSection
          title="4. Médias"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="photos">
                Télécharger des photos
              </Label>
              <Controller
                name="photos"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <FileUpload
                    onFilesChange={onChange}
                    value={value}
                    error={errors.photos?.message}
                    maxFiles={20}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>
          </div>
        </FormSection>

        {/* Section 5: PDF Customization */}
        <FormSection
          title="5. Personnalisation du PDF"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pdfTemplate" required>
                  Modèle de PDF
                </Label>
                <Controller
                  name="pdfTemplate"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="pdfTemplate"
                      options={pdfTemplateOptions}
                      error={errors.pdfTemplate?.message}
                      disabled={isSubmitting}
                      {...field}
                    />
                  )}
                />
              </div>
              
              <div>
                <Label htmlFor="pdfPhotoLayout">
                  Disposition des photos
                </Label>
                <Controller
                  name="pdfPhotoLayout"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="pdfPhotoLayout"
                      options={pdfPhotoLayoutOptions}
                      error={errors.pdfPhotoLayout?.message}
                      disabled={isSubmitting}
                      {...field}
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Controller
                name="pdfPrimaryColor"
                control={control}
                render={({ field }) => (
                  <ColorPicker
                    id="pdfPrimaryColor"
                    label="Couleur principale"
                    error={errors.pdfPrimaryColor?.message}
                    disabled={isSubmitting}
                    {...field}
                  />
                )}
              />
              
              <Controller
                name="pdfSecondaryColor"
                control={control}
                render={({ field }) => (
                  <ColorPicker
                    id="pdfSecondaryColor"
                    label="Couleur secondaire"
                    error={errors.pdfSecondaryColor?.message}
                    disabled={isSubmitting}
                    {...field}
                  />
                )}
              />
              
              <Controller
                name="pdfAccentColor"
                control={control}
                render={({ field }) => (
                  <ColorPicker
                    id="pdfAccentColor"
                    label="Couleur d'accent"
                    error={errors.pdfAccentColor?.message}
                    disabled={isSubmitting}
                    {...field}
                  />
                )}
              />
            </div>

            <div>
              <Label htmlFor="pdfLogo">
                Logo de l'agence
              </Label>
              <Controller
                name="pdfLogo"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <FileUpload
                    onFilesChange={(files) => onChange(files?.[0])}
                    value={value ? [value] : undefined}
                    error={errors.pdfLogo?.message}
                    maxFiles={1}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>

            <div>
              <Label htmlFor="pdfPhotoColumns">
                Nombre de colonnes pour les photos (2-4)
              </Label>
              <Controller
                name="pdfPhotoColumns"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <Input
                    id="pdfPhotoColumns"
                    type="number"
                    min="2"
                    max="4"
                    error={errors.pdfPhotoColumns?.message}
                    disabled={isSubmitting}
                    onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : 2)}
                    value={value ?? 2}
                    {...field}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Sections à afficher</Label>
              <div className="space-y-2">
                <Controller
                  name="pdfShowAgent"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Checkbox
                      id="pdfShowAgent"
                      label="Afficher les informations de l'agent"
                      checked={value}
                      onChange={onChange}
                      disabled={isSubmitting}
                    />
                  )}
                />
                
                <Controller
                  name="pdfShowSocial"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Checkbox
                      id="pdfShowSocial"
                      label="Afficher le contenu réseaux sociaux"
                      checked={value}
                      onChange={onChange}
                      disabled={isSubmitting}
                    />
                  )}
                />
                
                <Controller
                  name="pdfShowAI"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Checkbox
                      id="pdfShowAI"
                      label="Afficher le récit généré par l'IA"
                      checked={value}
                      onChange={onChange}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </div>
            </div>
            
            <div className="pt-4">
              <TemplatePreview
                template={pdfTemplate}
                colors={pdfColors}
                photoLayout={pdfPhotoLayout}
                photoColumns={pdfPhotoColumns}
                showAgent={pdfShowAgent}
                showSocial={pdfShowSocial}
                showAI={pdfShowAI}
              />
            </div>
          </div>
        </FormSection>

        {/* Submit and Clear Buttons */}
        <div className="flex justify-center gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isSubmitting}
            onClick={clearFormAndStorage}
            className="min-w-[150px]"
          >
            Effacer le formulaire
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={isSubmitting}
            onClick={() => form.handleSubmit(handleGeneratePDF)()}
            className="min-w-[250px] relative bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Génération en cours...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Générer le Dossier PDF
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};