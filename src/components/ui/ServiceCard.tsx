import React from 'react';
import { Button } from '@/components/ui/Button';
import { Star } from 'lucide-react';

export interface ServiceProvider {
  id: string;
  business_name: string;
  category: string;
  service_cities: string; // comma‑separated list
  rating: number;
  description?: string;
}

export const ServiceCard: React.FC<{ provider: ServiceProvider; onRequest: (id: string) => void }> = ({ provider, onRequest }) => {
  return (
    <div className="bg-card border border-border/30 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      <div>
        <h3 className="font-bold text-lg text-foreground mb-1">{provider.business_name}</h3>
        <p className="text-sm text-muted-foreground mb-2">{provider.description || 'Servicio profesional'}</p>
        <div className="flex items-center text-xs text-ink-muted mb-2">
          <span className="mr-2 capitalize">{provider.category}</span>
          <span>·</span>
          <span className="ml-2">{provider.service_cities}</span>
        </div>
        <div className="flex items-center space-x-1 text-sm text-warning">
          <Star className="w-4 h-4 fill-current" />
          <span>{provider.rating?.toFixed(1) || '0.0'}</span>
        </div>
      </div>
      <Button className="mt-4 w-full" onClick={() => onRequest(provider.id)}>
        Solicitar Servicio
      </Button>
    </div>
  );
};
