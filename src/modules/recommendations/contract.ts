export interface PropertyRecommendation {
  propertyId: string;
  title: string;
  monthlyRent: number;
  city: string;
  type: string;
  similarity: number;
  thumbnailUrl?: string;
}

export interface UserRecommendationProfile {
  preferredTypes: string[];
  maxPrice: number;
  preferredCities: string[];
  recentViews: string[];
}

export interface IRecommendationsService {
  getSimilarProperties(propertyId: string, limit?: number): Promise<PropertyRecommendation[]>;
  getPersonalizedRecommendations(userId: string, limit?: number): Promise<PropertyRecommendation[]>;
}
