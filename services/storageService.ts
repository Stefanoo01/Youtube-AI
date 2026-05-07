import { supabase } from './supabaseClient';
import { Script, CharacterProfile } from '../types';

export const getScripts = async (): Promise<Script[]> => {
  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scripts:', error);
    return [];
  }

  // Convert DB timestamp string to number for frontend compatibility
  return (data || []).map((s: any) => ({
    ...s,
    createdAt: new Date(s.created_at).getTime()
  }));
};

export const saveScript = async (script: Script): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase.from('scripts').insert({
    title: script.title,
    content: script.content,
    type: script.type,
    user_id: user.id
    // id is auto-generated
    // created_at is auto-generated
  });

  if (error) throw error;
};

export const deleteScript = async (id: string): Promise<void> => {
  const { error } = await supabase.from('scripts').delete().eq('id', id);
  if (error) throw error;
};

export const updateScript = async (id: string, updates: Partial<Script>): Promise<void> => {
  const { data, error } = await supabase.from('scripts').update(updates).eq('id', id).select();
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Nessuna riga aggiornata. Potrebbe mancare la policy UPDATE su Supabase.');
  }
};

export const getProfile = async (): Promise<CharacterProfile> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { hostName: 'Player1', language: 'English' };

  // Use maybeSingle() instead of single() to avoid 406 errors if row doesn't exist
  const { data, error } = await supabase
    .from('profiles')
    .select('host_name, language')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return { hostName: 'Player1', language: 'English' };
  }

  if (!data) {
    return { hostName: 'Player1', language: 'English' };
  }

  // Ensure we never return null, fallback to empty string or default
  return { 
    hostName: data.host_name || 'Player1',
    language: data.language || 'English'
  };
};

export const saveProfile = async (profile: CharacterProfile): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('profiles')
    .upsert({ 
      user_id: user.id, 
      host_name: profile.hostName,
      language: profile.language || 'English'
    }, { onConflict: 'user_id' });

  if (error) throw error;
};