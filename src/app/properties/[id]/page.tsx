'use client';

import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Property } from '@/types';
import confetti from 'canvas-confetti';
import {
AlertTriangle,
ArrowLeft,
Bath,
BedDouble,
Building2,
Calendar,
CheckCircle2,
ChevronLeft,
ChevronRight,
DollarSign,
Edit2,
EyeOff,
Home,
Image as ImageIcon,
Layers,
Loader2,
MapPin,
Maximize2,
Trash2,
Wrench,
X
} from 'lucide-react';
import { useParams,useRouter } from 'next/navigation';
import { useEffect,useState } from 'react';

const AMENITIES_LIST = [
  'Wifi',
  'Parqueadero',
  'Piscina',
  'Gimnasio',
  'Aire Acondicionado',
  'Ascensor',
  'Seguridad 24/7',
  'Mascotas Permitidas',
  'Balcón',
  'Zona de Lavandería',
  'Cocina Integral',
  'Calentador de Agua'
];

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Property['type']>('apartamento');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [areaSqm, setAreaSqm] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [status, setStatus] = useState<Property['status']>('disponible');
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenityInput, setCustomAmenityInput] = useState('');

  // Image Uploading States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
    }
  }, [id]);

  const fetchPropertyDetails = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProperty(data);
      setExistingImages(data.image_urls || []);
    } catch (err) {
      console.error('Error fetching property details:', err);
      toast({ type: 'error', message: 'Error al cargar los datos de la propiedad.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!property) return;
    setTitle(property.title);
    setType(property.type);
    setAddress(property.address || '');
    setCity(property.city || '');
    setAreaSqm(property.area_sqm?.toString() || '');
    setBedrooms(property.bedrooms?.toString() || '');
    setBathrooms(property.bathrooms?.toString() || '');
    setMonthlyRent(property.monthly_rent?.toString() || '');
    setDeposit(property.deposit?.toString() || '');
    setAvailableFrom(property.available_from || '');
    setStatus(property.status);
    setDescription(property.description || '');
    setSelectedAmenities(property.amenities || []);
    setExistingImages(property.image_urls || []);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setErrorMsg('');
    setIsEditModalOpen(true);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleAddCustomAmenity = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && customAmenityInput.trim()) {
      e.preventDefault();
      const newAmenity = customAmenityInput.trim();
      if (!selectedAmenities.includes(newAmenity)) {
        setSelectedAmenities(prev => [...prev, newAmenity]);
      }
      setCustomAmenityInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const handleRemovePreviewUrl = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveExistingImage = (idx: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadImagesToStorage = async (): Promise<string[]> => {
    const urls: string[] = [];
    if (selectedFiles.length === 0) return urls;

    setUploadingImages(true);
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      let { error: uploadErr } = await supabase.storage
        .from('property-photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadErr && uploadErr.message.includes('bucket not found')) {
        await supabase.storage.createBucket('property-photos', { public: true });
        const retry = await supabase.storage
          .from('property-photos')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });
        uploadErr = retry.error;
      }

      if (uploadErr) {
        throw new Error(`Error subiendo la imagen ${file.name}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(filePath);

      urls.push(publicUrl);
    }
    setUploadingImages(false);
    return urls;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property || !user) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const newlyUploadedUrls = await uploadImagesToStorage();
      const finalImageUrls = [...existingImages, ...newlyUploadedUrls];

      const propertyPayload = {
        title,
        type,
        address: address || null,
        city: city || null,
        area_sqm: areaSqm ? Number(areaSqm) : null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        monthly_rent: monthlyRent ? Number(monthlyRent) : 0,
        deposit: deposit ? Number(deposit) : 0,
        available_from: availableFrom || null,
        status,
        description: description || null,
        amenities: selectedAmenities,
        image_urls: finalImageUrls
      };

      const { error } = await supabase
        .from('properties')
        .update(propertyPayload)
        .eq('id', property.id);

      if (error) throw error;

      confetti({ particleCount: 50, spread: 60 });
      setIsEditModalOpen(false);
      fetchPropertyDetails();
      setActiveImageIndex(0);
    } catch (err: unknown) {
      console.error('Error updating property:', err);
      setErrorMsg((err as { message?: string }).message || 'Hubo un error al actualizar la propiedad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!property) return;
    const confirmDelete = window.confirm(
      '¿Estás seguro de que deseas eliminar esta propiedad? Selecciona Cancelar si prefieres cambiar su estado a "Inactivo" para conservar el historial de contratos.'
    );
    if (!confirmDelete) return;

    try {
      // Perform borrado lógico: change status to 'inactivo'
      const { error } = await supabase
        .from('properties')
        .update({ status: 'inactivo' })
        .eq('id', property.id);

      if (error) throw error;

      toast({ type: 'success', message: 'Propiedad dada de baja (estado inactivo).' });
      router.push('/properties');
    } catch (err) {
      console.error('Error archiving property:', err);
      toast({ type: 'error', message: 'Error al archivar la propiedad.' });
    }
  };

  const getStatusBadge = (s: Property['status']) => {
    switch (s) {
      case 'disponible':
        return (
          <span className="inline-flex items-center gap-1 bg-success/15 border border-success/30 text-success text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4" /> Disponible
          </span>
        );
      case 'ocupado':
        return (
          <span className="inline-flex items-center gap-1 bg-primary/15 border border-primary/30 text-primary text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
            <Building2 className="w-4 h-4" /> Alquilada
          </span>
        );
      case 'mantenimiento':
        return (
          <span className="inline-flex items-center gap-1 bg-warning/15 border border-warning/30 text-warning text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
            <Wrench className="w-4 h-4" /> En Mantenimiento
          </span>
        );
      case 'inactivo':
        return (
          <span className="inline-flex items-center gap-1 bg-destructive/15 border border-destructive/30 text-destructive text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
            <EyeOff className="w-4 h-4" /> Inactiva (Baja)
          </span>
        );
      default:
        return null;
    }
  };

  const getPropertyTypeLabel = (t: Property['type']) => {
    const labels = {
      casa: 'Casa',
      apartamento: 'Apartamento',
      local: 'Local Comercial',
      oficina: 'Oficina',
      terreno: 'Terreno'
    };
    return labels[t] || t;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground">Cargando detalles...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="py-20 text-center bg-card border border-border rounded-3xl max-w-xl mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto" />
        <h3 className="font-extrabold text-lg text-foreground">Inmueble no encontrado</h3>
        <button
          onClick={() => router.push('/properties')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </button>
      </div>
    );
  }

  const images = property.image_urls || [];

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-5xl mx-auto">
      
      {/* Return button */}
      <div>
        <button
          onClick={() => router.push('/properties')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-card border border-border hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </button>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Images Carousel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-card border border-border rounded-3xl overflow-hidden relative shadow-sm h-[400px] bg-muted">
            {images.length > 0 ? (
              <>
                <img
                  src={images[activeImageIndex]}
                  alt={property.title}
                  className="w-full h-full object-cover animate-fade-in"
                />

                {/* Left/Right Buttons */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveImageIndex(prev =>
                          prev === 0 ? images.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/10 text-white cursor-pointer active:scale-95 transition-all z-10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveImageIndex(prev =>
                          prev === images.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/10 text-white cursor-pointer active:scale-95 transition-all z-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Dotted indicator bar */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
                    {images.map((_, idx) => (
                      <button
                        key={`image-indicator-${idx}`}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                          idx === activeImageIndex
                            ? 'bg-primary scale-110 w-4'
                            : 'bg-white/40 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-3 bg-gradient-to-br from-primary/5 to-slate-900/10">
                <Building2 className="w-16 h-16" />
                <span className="text-xs uppercase font-bold tracking-widest">Sin Imágenes Adjuntas</span>
              </div>
            )}

            {/* Floating Info */}
            <div className="absolute top-4 left-4 z-10">
              {getStatusBadge(property.status)}
            </div>
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm border border-white/10 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl z-10">
              {getPropertyTypeLabel(property.type)}
            </div>
          </div>

          {/* Image thumbnails row */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-16 rounded-xl border overflow-hidden shrink-0 transition-all ${
                    idx === activeImageIndex
                      ? 'border-primary ring-2 ring-primary/20 scale-95'
                      : 'border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="Miniatura" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Information details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-6">
            
            {/* Main Info Header */}
            <div className="space-y-2">
              <h1 className="text-xl md:text-2xl font-black text-foreground">
                {property.title}
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 leading-relaxed font-semibold">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>{property.address}, {property.city}</span>
              </p>
            </div>

            {/* Pricing Section */}
            <div className="grid grid-cols-2 gap-4 bg-muted/40 border border-border p-4 rounded-2xl">
              <div>
                <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                  Canon de Renta
                </span>
                <span className="text-lg font-black text-primary">
                  ${property.monthly_rent?.toLocaleString('es-CO')}{' '}
                  <span className="text-xs font-bold text-muted-foreground">/mes</span>
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                  Depósito Garantía
                </span>
                <span className="text-lg font-black text-foreground">
                  ${property.deposit?.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {/* Specs list */}
            <div className="grid grid-cols-3 gap-2 border-y border-border py-4 text-center">
              <div>
                <BedDouble className="w-5 h-5 text-primary mx-auto mb-1" />
                <span className="block text-sm font-black text-foreground">
                  {property.bedrooms || 0}
                </span>
                <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  Alcobas
                </span>
              </div>
              <div>
                <Bath className="w-5 h-5 text-primary mx-auto mb-1" />
                <span className="block text-sm font-black text-foreground">
                  {property.bathrooms || 0}
                </span>
                <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  Baños
                </span>
              </div>
              <div>
                <Maximize2 className="w-5 h-5 text-primary mx-auto mb-1" />
                <span className="block text-sm font-black text-foreground">
                  {property.area_sqm || 0}
                </span>
                <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  Metros²
                </span>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Descripción
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                  {property.description}
                </p>
              </div>
            )}

            {/* Available From */}
            {property.available_from && (
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/20 border border-border/50 p-3 rounded-xl">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span>Disponible desde: <strong className="text-foreground">{property.available_from}</strong></span>
              </div>
            )}

            {/* Amenities Pills list */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Comodidades / Servicios
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {property.amenities.map((amenity, idx) => (
                    <span
                      key={`${amenity}-${idx}`}
                      className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold px-2.5 py-1 rounded-lg"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modify/Delete Buttons Row */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border mt-6">
              <button
                onClick={handleOpenEditModal}
                className="inline-flex items-center justify-center gap-2 py-3 bg-card hover:bg-muted border border-border text-foreground hover:text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-98"
              >
                <Edit2 className="w-4 h-4 text-primary" />
                <span>Editar Inmueble</span>
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center justify-center gap-2 py-3 bg-destructive/5 hover:bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-98"
              >
                <Trash2 className="w-4 h-4" />
                <span>Baja / Eliminar</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Edit Form Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-up my-8">
            
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary animate-pulse" />
                Modificar Inmueble
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="m-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleUpdate} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* general info */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 border-b border-border pb-1">
                  <Home className="w-3.5 h-3.5" /> Ficha Técnica
                </h4>
                
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Título Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Apartamento Penthouse con Terraza"
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Tipo de Inmueble *
                    </label>
                    <select
                      value={type}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as Property['type'])}
                      className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none font-semibold cursor-pointer"
                    >
                      <option value="apartamento">Apartamento</option>
                      <option value="casa">Casa</option>
                      <option value="local">Local Comercial</option>
                      <option value="oficina">Oficina</option>
                      <option value="terreno">Terreno</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Estado Operativo
                    </label>
                    <select
                      value={status}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as Property['status'])}
                      className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none font-semibold cursor-pointer"
                    >
                      <option value="disponible">Disponible</option>
                      <option value="ocupado">Alquilada</option>
                      <option value="mantenimiento">Mantenimiento</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Dirección Completa *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Calle 10 # 34-12"
                      className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Envigado"
                      className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* pricing */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 border-b border-border pb-1">
                  <DollarSign className="w-3.5 h-3.5" /> Renta & Fechas
                </h4>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Renta Mensual ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      placeholder="1200000"
                      className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Depósito ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                      placeholder="1200000"
                      className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Disponible Desde *
                    </label>
                    <input
                      type="date"
                      required
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none cursor-pointer font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Distribute */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 border-b border-border pb-1">
                  <Layers className="w-3.5 h-3.5" /> Distribución
                </h4>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5 text-primary shrink-0" /> Alcobas
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      placeholder="3"
                      className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5 text-primary shrink-0" /> Baños
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      placeholder="2"
                      className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-primary shrink-0" /> Área (m²)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={areaSqm}
                      onChange={(e) => setAreaSqm(e.target.value)}
                      placeholder="85"
                      className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Descripción del Inmueble
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Excelente iluminación, balcón amplio y acabados de lujo..."
                    rows={3}
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none resize-none font-semibold"
                  />
                </div>

                {/* Tag edit input */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Comodidades / Amenities (Escribe y presiona Enter o coma)
                  </label>
                  <input
                    type="text"
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    onKeyDown={handleAddCustomAmenity}
                    placeholder="Añadir comodidad..."
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-xl focus:ring-1 focus:ring-primary focus:border-primary p-3 outline-none font-semibold mb-3.5"
                  />
                  
                  {/* Selectable pre-pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {AMENITIES_LIST.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer truncate ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {amenity}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tag Pills List */}
                  {selectedAmenities.length > 0 && (
                    <div className="pt-3 border-t border-border/40 mt-3">
                      <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Amenities Seleccionados:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAmenities.map((amenity, idx) => (
                          <span
                            key={`${amenity}-${idx}`}
                            className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-lg"
                          >
                            {amenity}
                            <button
                              type="button"
                              onClick={() => toggleAmenity(amenity)}
                              className="text-primary hover:text-destructive shrink-0 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* existing and new images manager */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 border-b border-border pb-1">
                  🖼️ Fotos Subidas & Nuevas
                </h4>
                
                {existingImages.length > 0 && (
                  <div className="space-y-2">
                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Imágenes Actuales (Presiona X para eliminar):</span>
                    <div className="grid grid-cols-4 gap-2">
                      {existingImages.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="h-16 rounded-lg relative overflow-hidden border border-border bg-muted">
                          <img src={url} alt="Inmueble" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(idx)}
                            className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-destructive rounded text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/10 transition-colors relative cursor-pointer group mt-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2 group-hover:scale-105 transition-transform" />
                  <span className="block text-xs font-bold text-foreground">
                    Añadir Nuevas Fotos
                  </span>
                  <span className="block text-[10px] text-muted-foreground mt-1">
                    Sube fotos del inmueble a Supabase Storage.
                  </span>
                </div>

                {previewUrls.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="block text-[9px] font-bold text-primary uppercase tracking-wider">Nuevas imágenes a subir:</span>
                    <div className="grid grid-cols-4 gap-2">
                      {previewUrls.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="h-16 rounded-lg relative overflow-hidden border border-border group bg-muted">
                          <img src={url} alt="Vista previa" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemovePreviewUrl(idx)}
                            className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-destructive rounded text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingImages}
                  className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/10 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting || uploadingImages ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{uploadingImages ? 'Subiendo Fotos...' : 'Guardando...'}</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
