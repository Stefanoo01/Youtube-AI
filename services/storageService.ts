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

export const getProfile = async (): Promise<CharacterProfile> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { hostName: 'Player1' };

  // Use maybeSingle() instead of single() to avoid 406 errors if row doesn't exist
  const { data, error } = await supabase
    .from('profiles')
    .select('host_name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return { hostName: 'Player1' };
  }

  if (!data) {
    return { hostName: 'Player1' };
  }

  // Ensure we never return null, fallback to empty string or default
  return { hostName: data.host_name || 'Player1' };
};

export const saveProfile = async (profile: CharacterProfile): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('profiles')
    .upsert({ 
      user_id: user.id, 
      host_name: profile.hostName 
    });

  if (error) throw error;
};