import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import type { IVirtualToursService, PropertyTour, TourProvider } from './contract';

function mapRow(row: any): PropertyTour {
  return {
    id: row.id,
    propertyId: row.property_id,
    provider: row.provider,
    modelId: row.model_id,
    thumbnailUrl: row.thumbnail_url,
    embedUrl: row.embed_url,
    status: row.status,
    order: row.display_order || 0,
    createdAt: row.created_at,
  };
}

const MATTERPORT_ACCESS_TOKEN = process.env.MATTERPORT_ACCESS_TOKEN || '';

export function createVirtualToursService(): IVirtualToursService {
  const db = () => getSupabaseAdmin();

  return {
    async registerTour(propertyId, provider, modelId, embedUrl, thumbnailUrl) {
      const admin = db();
      if (!admin) return { ok: false, error: 'Admin no configurado' };

      const { data, error } = await admin.from('property_tours').insert({
        property_id: propertyId,
        provider,
        model_id: modelId,
        embed_url: embedUrl,
        thumbnail_url: thumbnailUrl || null,
        status: 'active',
      }).select().single();

      if (error) return { ok: false, error: error.message };
      return { ok: true, data: mapRow(data) };
    },

    async getToursByProperty(propertyId) {
      const admin = db();
      if (!admin) return [];
      const { data } = await admin
        .from('property_tours')
        .select('*')
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .order('display_order', { ascending: true });
      return (data || []).map(mapRow);
    },

    async deleteTour(tourId) {
      const admin = db();
      if (!admin) return { ok: false, error: 'Admin no configurado' };
      const { error } = await admin.from('property_tours').delete().eq('id', tourId);
      return error ? { ok: false, error: error.message } : { ok: true };
    },

    async generateEmbedToken(modelId) {
      if (!MATTERPORT_ACCESS_TOKEN || !modelId) return null;
      try {
        const res = await fetch(`https://api.matterport.com/api/models/public/${modelId}/token`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${MATTERPORT_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ expires_in_seconds: 3600 }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.token || null;
      } catch {
        return null;
      }
    },
  };
}
