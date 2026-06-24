export type TourProvider = 'matterport' | 'kuula' | 'threejs';

export interface PropertyTour {
  id: string;
  propertyId: string;
  provider: TourProvider;
  modelId: string;
  thumbnailUrl: string | null;
  embedUrl: string;
  status: 'active' | 'processing' | 'error';
  order: number;
  createdAt: string;
}

export interface IVirtualToursService {
  registerTour(propertyId: string, provider: TourProvider, modelId: string, embedUrl: string, thumbnailUrl?: string): Promise<{ ok: true; data: PropertyTour } | { ok: false; error: string }>;
  getToursByProperty(propertyId: string): Promise<PropertyTour[]>;
  deleteTour(tourId: string): Promise<{ ok: boolean; error?: string }>;
  generateEmbedToken(modelId: string): Promise<string | null>;
}
