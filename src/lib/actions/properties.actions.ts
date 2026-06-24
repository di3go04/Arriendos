'use server';

import { PropertyInsert } from '@/types';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function createPropertyAction(data: PropertyInsert) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    // Verificar que el usuario es arrendador o admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['arrendador', 'admin'].includes(profile.role)) {
      return { success: false, error: 'No tiene permisos para crear propiedades' };
    }

    const { data: result, error } = await supabase
      .from('properties')
      .insert({
        ...data,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/properties');
    revalidatePath('/dashboard/properties');

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('Error creating property:', error);
    return { success: false, error: (error as { message?: string }).message || 'Error al crear la propiedad' };
  }
}

export async function updatePropertyAction(id: string, data: Partial<PropertyInsert>) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    // Verificar que el usuario es el propietario o admin
    const { data: property } = await supabase
      .from('properties')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!property) {
      return { success: false, error: 'Propiedad no encontrada' };
    }

    if (property.owner_id !== user.id) {
      // Verificar si es admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        return { success: false, error: 'No tiene permisos para modificar esta propiedad' };
      }
    }

    const { data: updatedProperty, error } = await supabase
      .from('properties')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Revalidar las rutas que podrían verse afectadas
    revalidatePath(`/properties/${id}`);
    revalidatePath('/properties');
    revalidatePath('/dashboard/properties');

    return { success: true, data: updatedProperty };
  } catch (error: unknown) {
    console.error('Error updating property:', error);
    return { success: false, error: (error as { message?: string }).message || 'Error al actualizar la propiedad' };
  }
}

export async function deletePropertyAction(id: string) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    // Verificar que el usuario es el propietario o admin
    const { data: property } = await supabase
      .from('properties')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!property) {
      return { success: false, error: 'Propiedad no encontrada' };
    }

    if (property.owner_id !== user.id) {
      // Verificar si es admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        return { success: false, error: 'No tiene permisos para eliminar esta propiedad' };
      }
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Revalidar las rutas que podrían verse afectadas
    revalidatePath(`/properties/${id}`);
    revalidatePath('/properties');
    revalidatePath('/dashboard/properties');

    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting property:', error);
    return { success: false, error: (error as { message?: string }).message || 'Error al eliminar la propiedad' };
  }
}
