// src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || '/api';
const DEFAULT_TIMEOUT_MS = 20_000;

type RequestOptions = RequestInit & { timeoutMs?: number };
type CacheEntry<T> = { expiresAt: number; data: T };

const memoryCache = new Map<string, CacheEntry<unknown>>();
const pendingGets = new Map<string, Promise<unknown>>();

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();

  const text = await response.text();
  return text ? { message: text } : {};
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const data = await parseResponse(response) as { message?: string };
    if (!response.ok) throw new Error(data.message || `Lỗi ${response.status}`);
    return data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Máy chủ phản hồi quá lâu. Vui lòng thử lại.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function getCached<T>(path: string, ttlMs = 60_000): Promise<T> {
  const key = `${API_URL}${path}`;
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const pending = pendingGets.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = request<T>(path)
    .then((data) => {
      memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .finally(() => pendingGets.delete(key));

  pendingGets.set(key, promise);
  return promise;
}

function invalidateCache() {
  memoryCache.clear();
  pendingGets.clear();
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, options),
  getCached: <T>(path: string, ttlMs?: number) => getCached<T>(path, ttlMs),
  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) })
      .then((data) => { invalidateCache(); return data; }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' })
      .then((data) => { invalidateCache(); return data; }),
  clearCache: invalidateCache,
};
