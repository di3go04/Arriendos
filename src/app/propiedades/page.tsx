import { createServerClient } from '@supabase/ssr';
import { Bath,Home,MapPin,Maximize } from 'lucide-react';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';

async function getPublicProperties() {
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

  const { data: properties } = await supabase
    .from('properties')
    .select('*, profiles!properties_owner_id_fkey(full_name, phone)')
    .eq('status', 'disponible')
    .order('created_at', { ascending: false });

  return properties || [];
}

export default async function PropiedadesPublicasPage() {
  const properties = await getPublicProperties();

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#152e4a] text-white py-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <Link href="/" className="text-white/60 hover:text-white text-sm font-semibold mb-4 inline-block">
            ← Volver a RentNow
          </Link>
          <h1 className="text-4xl md:text-5xl font-black mt-4 leading-tight">
            Propiedades Disponibles
          </h1>
          <p className="text-white/70 text-lg mt-3 max-w-2xl">
            Encuentra la propiedad ideal para arrendar. Todas verificadas por nuestros arrendadores.
          </p>
          
          {/* Filtros rápidos */}
          <div className="mt-8 flex flex-wrap gap-3">
            {['Todos', 'Casas', 'Apartamentos', 'Locales', 'Oficinas'].map((f) => (
              <button
                key={f}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold transition-all border border-white/10"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de propiedades */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-12">
        {properties.length === 0 ? (
          <div className="text-center py-20">
            <Home className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No hay propiedades disponibles</h2>
            <p className="text-muted-foreground">Vuelve pronto, estamos actualizando nuestro inventario.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop: LooseValue) => (
              <Link
                key={prop.id}
                href={`/propiedades/${prop.id}`}
                className="group bg-card rounded-3xl overflow-hidden border border-border/50 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
              >
                {/* Imagen */}
                <div className="relative h-48 bg-muted overflow-hidden">
                  {prop.image_urls?.[0] ? (
                    <Image
                      src={prop.image_urls[0]}
                      alt={prop.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand/10 to-primary/10">
                      <Home className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-success/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    Disponible
                  </div>
                  {prop.type && (
                    <div className="absolute top-3 right-3 bg-white/90 text-foreground text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm capitalize">
                      {prop.type}
                    </div>
                  )}
                </div>

                {/* Información */}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {prop.title}
                  </h3>
                  
                  {prop.address && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span className="line-clamp-1">{prop.address}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {prop.bedrooms && (
                      <span className="flex items-center gap-1">
                        <Home className="w-3.5 h-3.5" /> {prop.bedrooms} hab
                      </span>
                    )}
                    {prop.bathrooms && (
                      <span className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5" /> {prop.bathrooms} baños
                      </span>
                    )}
                    {prop.area_sqm && (
                      <span className="flex items-center gap-1">
                        <Maximize className="w-3.5 h-3.5" /> {prop.area_sqm} m²
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xl font-black text-foreground">
                      ${prop.monthly_rent.toLocaleString('es-CO')}
                      <span className="text-xs font-semibold text-muted-foreground">/mes</span>
                    </span>
                    {prop.profiles?.full_name && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {prop.profiles.full_name}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}