export interface DossierFormData {
  propertyAddress: string
  propertyType: 'house' | 'apartment' | 'condo' | 'townhouse' | 'other'
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  photos: File[]
  description?: string
  yearBuilt?: number
  squareFeet?: number
  bedrooms?: number
  bathrooms?: number
  lotSize?: number
  features?: string[]
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
