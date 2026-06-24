import { supabase } from './supabase'

// Uploads a profile photo to the per-user folder in the public "avatars"
// bucket and returns a cache-busted public URL. Each user can only write to
// their own folder (enforced by storage RLS — see supabase/schema.sql).
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!supabase) throw new Error('Cloud storage is not configured.')
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // Bust the CDN/browser cache so a freshly-cropped photo replaces the old one.
  return `${data.publicUrl}?t=${Date.now()}`
}
