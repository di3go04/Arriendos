'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Property } from '@/types';
import {
  Building2, Plus, Search, MapPin, Home, CheckCircle2,
  AlertTriangle, Wrench, X, Loader2, BedDouble, Bath,
  Maximize2, DollarSign, Calendar, Layers, Image as ImageIcon,
  ArrowRight, EyeOff, TrendingUp, Grid3X3, List,
  Camera, Sparkles, SlidersHorizontal, AppWindow,
  Warehouse, Store, Briefcase, TreePine
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

const AMENITIES_LIST = [
  'Wifi', 'Parqueadero', 'Piscina', 'Gimnasio',
  'Aire Acondicionado', 'Ascensor', 'Seguridad 24/7',
  'Mascotas Permitidas', 'Balcón', 'Zona de Lavandería',
  'Cocina Integral', 'Calentador de Agua', 'Solar',
  'Circuito Cerrado', 'Citófono', 'Vigilancia'
];

const TYPE_ICONS = {
  casa: Home,
  apartamento: Building2,
  local: Store,
  oficina: Briefcase,
  terreno: TreePine
};

export default function PropertiesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [animateCards, setAnimateCards] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => setAnimateCards(true), 100);
    }
  }, [isLoading]);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setTitle(''); setType('apartamento'); setAddress(''); setCity('');
    setAreaSqm(''); setBedrooms(''); setBathrooms(''); setMonthlyRent('');
    setDeposit(''); setAvailableFrom(''); setStatus('disponible');
    setDescription(''); setSelectedAmenities([]); setCustomAmenityInput('');
    setSelectedFiles([]); setPreviewUrls([]); setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
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

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
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
      if (uploadErr) throw new Error(`Error subiendo la imagen ${file.name}`);
      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(filePath);
      urls.push(publicUrl);
    }
    setUploadingImages(false);
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const uploadedImageUrls = await uploadImagesToStorage();
      const payload = {
        owner_id: user.id, title, type,
        address: address || null, city: city || null,
        area_sqm: areaSqm ? Number(areaSqm) : null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        monthly_rent: monthlyRent ? Number(monthlyRent) : 0,
        deposit: deposit ? Number(deposit) : 0,
        available_from: availableFrom || null, status,
        description: description || null,
        amenities: selectedAmenities, image_urls: uploadedImageUrls
      };
      const { error } = await supabase.from('properties').insert(payload);
      if (error) throw error;
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setIsModalOpen(false);
      fetchProperties();
    } catch (err: any) {
      console.error('Error saving property:', err);
      setErrorMsg(err.message || 'Hubo un problema al guardar la propiedad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProperties = properties.filter(prop => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = prop.title.toLowerCase().includes(q) ||
      (prop.address && prop.address.toLowerCase().includes(q)) ||
      (prop.city && prop.city.toLowerCase().includes(q));
    return matchesSearch &&
      (filterType === 'all' || prop.type === filterType) &&
      (filterStatus === 'all' || prop.status === filterStatus);
  });

  const stats = {
    total: properties.length,
    available: properties.filter(p => p.status === 'disponible').length,
    occupied: properties.filter(p => p.status === 'ocupado').length,
    maintenance: properties.filter(p => p.status === 'mantenimiento').length,
  };

  const TypeIcon = type ? TYPE_ICONS[type] || Building2 : Building2;

  return (
    <div className="space-y-6 pb-24 animate-fade-in">

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-card border-none shadow-card p-6 md:p-8">
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-ink-secondary uppercase tracking-widest">
              <AppWindow className="w-3.5 h-3.5 text-primary" />
              Panel de Inmuebles
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              Mis Propiedades
              <span className="text-sm font-bold text-foreground bg-muted border-none px-3 py-1 rounded-full tabular-nums">
                {properties.length}
              </span>
            </h1>
            <p className="text-sm text-ink-muted max-w-xl">
              Gestiona tu portafolio de inmuebles. Añade, edita y supervisa cada propiedad desde un solo lugar.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="group relative inline-flex items-center gap-2.5 px-6 py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl shadow-btn hover:shadow-card-hover transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5 transition-transform group-hover:rotate-90" />
            <span>Nueva Propiedad</span>
          </button>
        </div>

        {/* Mini Stats Row */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-3 mt-6 pt-6 border-t border-border/50">
          {[
            { label: 'Disponibles', value: stats.available, color: 'text-success', bg: 'bg-success/10 border-success/20' },
            { label: 'Alquiladas', value: stats.occupied, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
            { label: 'Mantenimiento', value: stats.maintenance, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-border/40 backdrop-blur-sm">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <div className={`w-2 h-2 rounded-full ${s.color} bg-current`} />
              </div>
              <div>
                <span className="block text-lg font-black text-foreground">{s.value}</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</span>
              </div>
            </div>
          ))}
          <div className="hidden md:flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-border/40 backdrop-blur-sm md:col-span-1">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
            <div>
              <span className="block text-lg font-black text-foreground">{stats.total}</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border-none rounded-2xl p-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por título, dirección o ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border-none text-foreground text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-ink-muted shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
            />
          </div>
          <div className="flex flex-col md:flex-row gap-3 overflow-hidden">
            {/* Filter Type Segmented Control */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 md:pb-0">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'casa', label: 'Casa' },
                { id: 'apartamento', label: 'Apto' },
                { id: 'local', label: 'Local' },
                { id: 'oficina', label: 'Oficina' },
                { id: 'terreno', label: 'Terreno' }
              ].map(ft => (
                <button
                  key={ft.id}
                  onClick={() => setFilterType(ft.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border-none ${
                    filterType === ft.id
                      ? 'bg-foreground text-background shadow-btn'
                      : 'bg-background text-ink-muted hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {ft.label}
                </button>
              ))}
            </div>
            
            {/* Filter Status Segmented Control */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 md:pb-0">
              {[
                { id: 'all', label: 'Estados' },
                { id: 'disponible', label: 'Disponible' },
                { id: 'ocupado', label: 'Alquilada' },
                { id: 'mantenimiento', label: 'Mantenimiento' },
                { id: 'inactivo', label: 'Inactiva' }
              ].map(fs => (
                <button
                  key={fs.id}
                  onClick={() => setFilterStatus(fs.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border-none ${
                    filterStatus === fs.id
                      ? 'bg-primary text-primary-foreground shadow-btn'
                      : 'bg-background text-ink-muted hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {fs.label}
                </button>
              ))}
            </div>

            <div className="flex bg-background rounded-xl border-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-ink-muted hover:text-foreground'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-ink-muted hover:text-foreground'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
              <div className="h-48 bg-muted" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-8 bg-muted rounded" />
                  <div className="h-8 bg-muted rounded" />
                  <div className="h-8 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        /* Empty State */
        <div className="py-20 text-center max-w-lg mx-auto space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl" />
            <div className="relative p-5 bg-card border border-border rounded-full">
              <Home className="w-14 h-14 text-muted-foreground/60" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-foreground">No hay propiedades aún</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                ? 'Ninguna propiedad coincide con los filtros aplicados. Intenta con otros criterios.'
                : 'Comienza añadiendo tu primera propiedad para empezar a gestionar tus alquileres.'}
            </p>
          </div>
          {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              Añadir Primera Propiedad
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((prop, index) => {
            const Icon = TYPE_ICONS[prop.type] || Building2;
            return (
              <div
                key={prop.id}
                onClick={() => router.push(`/properties/${prop.id}`)}
                className={`group bg-card border-none rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col relative cursor-pointer ${animateCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden bg-muted">
                  {prop.image_urls?.[0] ? (
                    <>
                      <img
                        src={prop.image_urls[0]}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted/40 gap-2 bg-muted/50 border-none">
                      <Camera className="w-10 h-10" />
                      <span className="text-[9px] uppercase font-bold tracking-widest">Sin foto</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {statusBadge(prop.status)}
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 border-none text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Icon className="w-3 h-3" />
                    {typeLabel(prop.type)}
                  </div>

                  {/* Image count */}
                  {prop.image_urls && prop.image_urls.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 border-none shadow-sm">
                      <ImageIcon className="w-3 h-3" />
                      {prop.image_urls.length}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {prop.title}
                    </h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-primary tabular-nums">
                        ${prop.monthly_rent?.toLocaleString('es-CO')}
                      </span>
                      <span className="text-[10px] font-semibold text-ink-muted">/mes</span>
                    </div>
                    <p className="text-xs text-ink-muted flex items-start gap-1.5 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                      <span className="line-clamp-1">{prop.address}{prop.city ? `, ${prop.city}` : ''}</span>
                    </p>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-border/40 text-[10px] font-bold text-muted-foreground">
                    <div className="flex items-center gap-1.5 bg-muted/30 rounded-lg p-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{prop.bedrooms || 0} Hab</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted/30 rounded-lg p-1.5">
                      <Bath className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{prop.bathrooms || 0} Baños</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted/30 rounded-lg p-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{prop.area_sqm || 0} m²</span>
                    </div>
                  </div>

                  {prop.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 font-medium">
                      {prop.description}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 pb-4 flex items-center justify-between text-[11px] text-primary font-bold">
                  <span>Ver detalle</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredProperties.map((prop, index) => (
              <div
              key={prop.id}
              onClick={() => router.push(`/properties/${prop.id}`)}
              className={`group bg-card border-none rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-all duration-300 flex items-center gap-4 cursor-pointer ${animateCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-muted">
                {prop.image_urls?.[0] ? (
                  <img src={prop.image_urls[0]} alt={prop.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-muted/30 border-none bg-muted/50">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-extrabold text-sm text-foreground truncate group-hover:text-primary transition-colors">{prop.title}</h3>
                  {statusBadge(prop.status)}
                </div>
                <p className="text-xs text-ink-muted truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0 text-primary" />
                  {prop.address}{prop.city ? `, ${prop.city}` : ''}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-ink-muted tabular-nums">
                  <span className="text-primary font-black text-sm">${prop.monthly_rent?.toLocaleString('es-CO')}/mes</span>
                  <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{prop.bedrooms || 0}</span>
                  <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{prop.bathrooms || 0}</span>
                  <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{prop.area_sqm || 0}m²</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-ink-muted group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div onClick={() => setIsModalOpen(false)} className="absolute inset-0" />
          <div className="relative bg-card border-none rounded-3xl w-full max-w-2xl shadow-modal overflow-hidden animate-scale-up my-8">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <TypeIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-foreground">Nueva Propiedad</h3>
                  <p className="text-[11px] text-muted-foreground font-medium">Completa los datos del inmueble</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mx-6 mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2.5 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  <div className="w-1 h-4 rounded-full bg-primary" />
                  Información General
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Título *</label>
                    <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Apartamento Penthouse con Terraza"
                      className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Tipo *</label>
                    <div className="relative">
                      <select value={type} onChange={(e: any) => setType(e.target.value)}
                        className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none appearance-none cursor-pointer font-semibold">
                        <option value="apartamento">Apartamento</option>
                        <option value="casa">Casa</option>
                        <option value="local">Local Comercial</option>
                        <option value="oficina">Oficina</option>
                        <option value="terreno">Terreno</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Estado</label>
                    <select value={status} onChange={(e: any) => setStatus(e.target.value)}
                      className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none appearance-none cursor-pointer font-semibold">
                      <option value="disponible">Disponible</option>
                      <option value="ocupado">Alquilada</option>
                      <option value="mantenimiento">Mantenimiento</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Dirección *</label>
                    <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)}
                      placeholder="Calle 10 # 34-12"
                      className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Ciudad *</label>
                    <input type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                      placeholder="Envigado"
                      className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Pricing & Dates */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  <div className="w-1 h-4 rounded-full bg-accent" />
                  Renta y Fechas
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Renta Mensual ($) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">$</span>
                      <input type="number" required min="0" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)}
                        placeholder="1,200,000"
                        className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary pl-8 pr-3 py-3 outline-none transition-all font-bold" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Depósito ($) *</label>
                    <input type="number" required min="0" value={deposit} onChange={(e) => setDeposit(e.target.value)}
                      placeholder="1,200,000"
                      className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Disponible Desde *</label>
                    <input type="date" required value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)}
                      className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* Distribution */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  <div className="w-1 h-4 rounded-full bg-success" />
                  Distribución
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-primary" /> Habitaciones
                    </label>
                    <input type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}
                      placeholder="3"
                      className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Bath className="w-3.5 h-3.5 text-primary" /> Baños
                    </label>
                    <input type="number" min="0" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)}
                      placeholder="2"
                      className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-primary" /> Área (m²)
                    </label>
                    <input type="number" min="0" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)}
                      placeholder="85"
                      className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">Descripción</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Excelente iluminación, balcón amplio y acabados de lujo..."
                    rows={3}
                    className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all resize-none" />
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  <div className="w-1 h-4 rounded-full bg-accent" />
                  Amenities
                </div>
                <div>
                  <input
                    type="text" value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    onKeyDown={handleAddCustomAmenity}
                    placeholder="Escribe una comodidad y presiona Enter..."
                    className="w-full bg-muted border border-border text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none transition-all mb-3"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {AMENITIES_LIST.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity);
                      return (
                        <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)}
                          className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                              : 'bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:border-primary/30'
                          }`}>
                          {isSelected ? '✓ ' : '+ '}{amenity}
                        </button>
                      );
                    })}
                  </div>
                  {selectedAmenities.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap gap-1.5">
                      {selectedAmenities.map((amenity, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold px-3 py-1 rounded-xl">
                          {amenity}
                          <button type="button" onClick={() => toggleAmenity(amenity)} className="text-primary hover:text-destructive cursor-pointer">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  <div className="w-1 h-4 rounded-full bg-primary" />
                  Fotos del Inmueble
                </div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-border hover:border-primary/40 rounded-2xl p-8 text-center transition-all cursor-pointer group bg-muted/20 hover:bg-muted/30"
                >
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                  <div className="space-y-2">
                    <div className="p-3 rounded-full bg-muted inline-flex text-muted-foreground group-hover:text-primary transition-colors">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Subir fotos</p>
                    <p className="text-[11px] text-muted-foreground">PNG, JPG, WEBP — hasta 10 imágenes</p>
                  </div>
                </div>
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="aspect-square rounded-xl relative overflow-hidden border border-border group/image bg-muted">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => handleRemoveSelectedFile(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-destructive rounded-lg text-white opacity-0 group-hover/image:opacity-100 transition-all cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting || uploadingImages}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer">
                  {isSubmitting || uploadingImages ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" />{uploadingImages ? 'Subiendo fotos...' : 'Guardando...'}</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" /> Guardar Propiedad</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB for mobile */}
      <button
        onClick={handleOpenCreateModal}
        className="fixed bottom-6 right-6 md:hidden bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all active:scale-90 z-40 cursor-pointer"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

function statusBadge(s: Property['status']) {
  switch (s) {
    case 'disponible':
      return <span className="inline-flex items-center gap-1 bg-success/10 border-none text-success text-[9px] font-bold px-2 py-0.5 rounded shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"><CheckCircle2 className="w-3 h-3" /> Disponible</span>;
    case 'ocupado':
      return <span className="inline-flex items-center gap-1 bg-primary/10 border-none text-primary text-[9px] font-bold px-2 py-0.5 rounded shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"><Building2 className="w-3 h-3" /> Alquilada</span>;
    case 'mantenimiento':
      return <span className="inline-flex items-center gap-1 bg-warning/10 border-none text-warning text-[9px] font-bold px-2 py-0.5 rounded shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"><Wrench className="w-3 h-3" /> Mantenimiento</span>;
    case 'inactivo':
      return <span className="inline-flex items-center gap-1 bg-destructive/10 border-none text-destructive text-[9px] font-bold px-2 py-0.5 rounded shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"><EyeOff className="w-3 h-3" /> Inactivo</span>;
    default:
      return null;
  }
}

function typeLabel(t: Property['type']) {
  const labels = { casa: 'Casa', apartamento: 'Apartamento', local: 'Local', oficina: 'Oficina', terreno: 'Terreno' };
  return labels[t] || t;
}
