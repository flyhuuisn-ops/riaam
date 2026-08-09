import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface AppUser { id: string; display_name: string; username: string; }
const STORAGE_KEY = 'private_message_user';

export function useUserSession() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUser(JSON.parse(saved) as AppUser);
    } catch { localStorage.removeItem(STORAGE_KEY); }
    setLoading(false);
  }, []);
  const saveSession = useCallback((next: AppUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
  }, []);
  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);
  return { user, loading, saveSession, clearSession, setUser };
}

export async function createUser(displayName: string, username: string): Promise<{ user: AppUser | null; error: string | null }> {
  const handle = username.trim().toLowerCase();
  const { data: existing, error: lookupError } = await supabase.from('users').select('id').eq('username', handle).maybeSingle();
  if (lookupError) return { user: null, error: 'تعذر الاتصال بمساحة الرسائل. حاول مرة أخرى.' };
  if (existing) return { user: null, error: 'هذا اليوزر مستخدم. اختاري اسماً آخر أو سجّلي الدخول.' };
  const { data, error } = await supabase.from('users').insert({ display_name: displayName.trim() || handle, username: handle }).select().single();
  return error || !data ? { user: null, error: 'تعذر إنشاء الحساب. حاول مرة أخرى.' } : { user: data as AppUser, error: null };
}

export async function loginUser(displayName: string, username: string): Promise<{ user: AppUser | null; error: string | null }> {
  const handle = username.trim().toLowerCase();
  const { data, error } = await supabase.from('users').select('*').eq('username', handle).maybeSingle();
  if (error || !data) return { user: null, error: 'لم نعثر على هذا اليوزر. تحققي من البيانات.' };
  if (displayName.trim() && data.display_name !== displayName.trim()) {
    const updated = await supabase.from('users').update({ display_name: displayName.trim() }).eq('id', data.id).select().single();
    if (updated.data) return { user: updated.data as AppUser, error: null };
  }
  return { user: data as AppUser, error: null };
}

export async function updateUserProfile(user: AppUser, displayName: string, username: string): Promise<{ user: AppUser | null; error: string | null }> {
  const handle = username.trim().toLowerCase();
  const { data: existing } = await supabase.from('users').select('id').eq('username', handle).neq('id', user.id).maybeSingle();
  if (existing) return { user: null, error: 'هذا اليوزر مستخدم بالفعل.' };
  const { data, error } = await supabase.from('users').update({ display_name: displayName.trim() || handle, username: handle }).eq('id', user.id).select().single();
  if (error || !data) return { user: null, error: 'تعذر حفظ التعديلات.' };
  if (handle !== user.username) await supabase.from('messages').update({ sender_handle: handle, username: handle }).eq('sender_handle', user.username);
  await supabase.from('messages').update({ sender_display_name: displayName.trim() || handle }).eq('sender_handle', handle);
  return { user: data as AppUser, error: null };
}

export async function deleteUserAccount(user: AppUser): Promise<{ success: boolean; error: string | null }> {
  const { error: messagesError } = await supabase.from('messages').delete().eq('username', user.username);
  if (messagesError) return { success: false, error: 'تعذر حذف الرسائل المرتبطة بالحساب.' };
  const { error } = await supabase.from('users').delete().eq('id', user.id);
  return error ? { success: false, error: 'تعذر حذف الحساب.' } : { success: true, error: null };
}