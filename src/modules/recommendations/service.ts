import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import type { IRecommendationsService, PropertyRecommendation } from './contract';

function mapRec(row: any): PropertyRecommendation {
  return {
    propertyId: row.id || row.property_id,
    title: row.title,
    monthlyRent: Number(row.monthly_rent),
    city: row.city || '',
    type: row.type || '',
    similarity: row.similarity || row.similarity_score || 0,
    thumbnailUrl: row.thumbnail_url || row.images?.[0],
  };
}

export function createRecommendationsService(): IRecommendationsService {
  const db = () => getSupabaseAdmin();

  return {
    async getSimilarProperties(propertyId, limit = 6) {
      const admin = db();
      if (!admin) return [];
      try {
        const { data } = await admin.rpc('find_similar_properties', {
          target_property_id: propertyId,
          match_limit: limit,
        });
        return (data || []).map(mapRec);
      } catch {
        const { data: current } = await admin.from('properties').select('type, city, monthly_rent').eq('id', propertyId).single();
        if (!current) return [];
        const { data: similar } = await admin
          .from('properties')
          .select('*')
          .eq('type', current.type)
          .eq('status', 'disponible')
          .neq('id', propertyId)
          .limit(limit);
        return (similar || []).map((s: any) => ({
          ...mapRec(s),
          similarity: 0.5,
        }));
      }
    },

    async getPersonalizedRecommendations(userId, limit = 6) {
      const admin = db();
      if (!admin) return [];
      const { data: views } = await admin
        .from('property_views')
        .select('property_id, properties!inner(type, city, monthly_rent, status)')
        .eq('user_id', userId);

      if (!views?.length) return [];

      const preferredTypes = [...new Set(views.map((v: any) => v.properties?.type).filter(Boolean))];
      const preferredCities = [...new Set(views.map((v: any) => v.properties?.city).filter(Boolean))];

      if (!preferredTypes.length) return [];

      let query = admin.from('properties').select('*').eq('status', 'disponible').in('type', preferredTypes);
      if (preferredCities.length) {
        query = query.in('city', preferredCities);
      }

      const { data } = await query.limit(limit);
      return (data || []).map(mapRec);
    },
  };
}
