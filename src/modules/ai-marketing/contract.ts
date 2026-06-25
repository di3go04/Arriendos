export interface MarketingContent {
  title: string;
  description: string;
  seoDescription: string;
  highlights: string[];
  socialCopy: string;
  metaTags: string[];
  suggestedAmenities: string[];
}

export interface IMarketingService {
  generatePropertyContent(propertyId: string): Promise<{ ok: true; data: MarketingContent } | { ok: false; error: string }>;
  generateSocialPost(propertyId: string, platform: 'instagram' | 'tiktok' | 'linkedin'): Promise<{ ok: true; data: { post: string; hashtags: string[] } } | { ok: false; error: string }>;
}
