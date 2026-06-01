import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean; _tokenSet?: boolean };

// Token cache — updated synchronously by AuthContext via setAuthToken().
// Avoids calling supabase.auth.getSession() inside the request interceptor,
// which can deadlock when the SDK tries to acquire its internal refresh lock.
let _currentToken: string | null = null;

export function setAuthToken(token: string | null) {
  _currentToken = token;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  // Never throw on HTTP error status — callers inspect json.success themselves
  validateStatus: () => true,
});

// Attach Bearer token synchronously — no Supabase SDK calls, no possibility of hanging.
apiClient.interceptors.request.use((config: RetryConfig) => {
  if (config._tokenSet) return config;
  if (_currentToken) {
    config.headers.Authorization = `Bearer ${_currentToken}`;
  }
  return config;
});

// On 401: refresh token once and retry (with a 10s hard timeout so we never hang forever)
apiClient.interceptors.response.use(async (res) => {
  if (res.status !== 401) return res;
  const config = res.config as RetryConfig;
  if (config._retry) return res;

  config._retry = true;
  try {
    const refreshTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Token refresh timed out')), 10_000)
    );
    const { data } = await Promise.race([supabase.auth.refreshSession(), refreshTimeout]);
    if (!data.session) {
      supabase.auth.signOut();
      return res;
    }
    setAuthToken(data.session.access_token);
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
    config._tokenSet = true;
    return apiClient(config);
  } catch {
    // Refresh failed or timed out — return the 401 for callers to handle
    return res;
  }
});

/**
 * Drop-in replacement for the old apiFetch — callers that do await res.json() still work.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<{ json: () => Promise<any>; ok: boolean; status: number }> {
  const method = (options.method as AxiosRequestConfig['method']) || 'GET';
  const headers = (options.headers as Record<string, string>) || {};
  let data: any;

  if (options.body) {
    try { data = JSON.parse(options.body as string); } catch { data = options.body; }
  }

  const res: AxiosResponse = await apiClient.request({ url: path, method, headers, data });

  return {
    ok: res.status >= 200 && res.status < 300,
    status: res.status,
    json: async () => res.data,
  };
}
