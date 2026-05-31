import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Fetch wrapper that automatically attaches the current Bearer token
 * and retries once with a refreshed token on 401.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const makeHeaders = (t?: string | null): HeadersInit => ({
    ...(options.headers as Record<string, string>),
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  });

  const res = await fetch(`${API_URL}${path}`, { ...options, headers: makeHeaders(token) });

  if (res.status !== 401 || !session) return res;

  // Token expired — refresh once and retry
  const { data } = await supabase.auth.refreshSession();
  if (!data.session) {
    await supabase.auth.signOut();
    return res;
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: makeHeaders(data.session.access_token),
  });
}
