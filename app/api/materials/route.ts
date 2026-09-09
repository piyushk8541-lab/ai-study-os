import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/usage';

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await auth.supabase.from('uploads').select('id,file_name,mime_type,page_count,processing_status,processing_error,created_at,extracted_text').order('created_at', { ascending: false }).limit(25);
  if (error) return NextResponse.json({ error: 'Unable to load materials.' }, { status: 500 });
  return NextResponse.json({ materials: data ?? [] });
}
