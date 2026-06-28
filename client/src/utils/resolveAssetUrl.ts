export function resolveAssetUrl(url?: string | null): string {
  if (!url) return '';

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  return `${import.meta.env.BASE_URL}${url.replace(/^\/+/, '')}`;
}
