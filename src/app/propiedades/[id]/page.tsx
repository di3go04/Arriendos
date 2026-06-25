import { createServerClient } from '@supabase/ssr';
import { Bath,Calendar,Check,Home,MapPin,Maximize,Phone,User } from 'lucide-react';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LeadForm from './LeadForm';

async function getProperty(id: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data } = await supabase
    .from('properties')
    .select('*, profiles!properties_owner_id_fkey(full_name, phone, email)')
    .eq('id', id)
    .single();

  return data;
}

export default async function PropiedadDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) notFound();

  const prop = property as LooseRecord;

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Back nav */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-4">
        <Link href="/propiedades" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          ← Todas las propiedades
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galería de imágenes */}
            <div className="bg-card rounded-3xl overflow-hidden border border-border/50 shadow-card">
              <div className="relative h-[300px] md:h-[400px] bg-muted">
                {prop.image_urls?.[0] ? (
                  <Image src={prop.image_urls[0]} alt={prop.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand/10 to-primary/10">
                    <Home className="w-20 h-20 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-success text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                  Disponible
                </div>
              </div>
              {prop.image_urls && prop.image_urls.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {prop.image_urls.slice(1, 5).map((url: string, i: number) => (
                    <div key={i} className="relative w-24 h-20 rounded-xl overflow-hidden shrink-0 bg-muted">
                      <Image src={url} alt={`Foto ${i + 2}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detalles */}
            <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-card space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground">{prop.title}</h1>
                {prop.address && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" /> {prop.address}
                  </p>
                )}
              </div>

              {/* Características */}
              <div className="flex flex-wrap gap-4">
                {prop.bedrooms && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 rounded-xl">
                    <Home className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">{prop.bedrooms} Habitaciones</span>
                  </div>
                )}
                {prop.bathrooms && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 rounded-xl">
                    <Bath className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">{prop.bathrooms} Baños</span>
                  </div>
                )}
                {prop.area_sqm && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 rounded-xl">
                    <Maximize className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">{prop.area_sqm} m²</span>
                  </div>
                )}
              </div>

              {/* Descripción */}
              {prop.description && (
                <div>
                  <h2 className="font-bold text-foreground mb-2">Descripción</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{prop.description}</p>
                </div>
              )}

              {/* Amenidades */}
              {prop.amenities?.length > 0 && (
                <div>
                  <h2 className="font-bold text-foreground mb-3">Amenidades</h2>
                  <div className="flex flex-wrap gap-2">
                    {prop.amenities.map((a: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-subtle text-primary text-xs font-semibold rounded-lg">
                        <Check className="w-3 h-3" /> {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Precio y CTA */}
            <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-card sticky top-24 space-y-6">
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Canon de arrendamiento</p>
                <p className="text-3xl font-black text-foreground">
                  ${prop.monthly_rent.toLocaleString('es-CO')}
                  <span className="text-sm font-semibold text-muted-foreground">/mes</span>
                </p>
                {prop.deposit > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Depósito: ${prop.deposit.toLocaleString('es-CO')}
                  </p>
                )}
              </div>

              <LeadForm propertyId={prop.id} propertyTitle={prop.title} ownerId={prop.owner_id} />

              {/* Info del arrendador */}
              {prop.profiles && (
                <div className="pt-4 border-t border-border/50 space-y-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Arrendador</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{prop.profiles.full_name || 'Propietario'}</p>
                      {prop.profiles.phone && (
                        <a href={`tel:${prop.profiles.phone}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {prop.profiles.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Características adicionales */}
              {prop.available_from && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Disponible desde: {new Date(prop.available_from).toLocaleDateString('es-CO')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}