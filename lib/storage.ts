import { createClient } from '@/lib/supabase/server';

export const STUDY_MATERIAL_BUCKET = 'study-materials';

export async function uploadStudyMaterial(userId: string, file: File) {
  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage
    .from(STUDY_MATERIAL_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

export async function deleteStudyMaterial(path: string) {
  const supabase = await createClient();
  return supabase.storage.from(STUDY_MATERIAL_BUCKET).remove([path]);
}
