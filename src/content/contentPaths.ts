export const CONTENT_DIR = 'cultivation_idle_content_bible_v1_config';

export function getContentBaseUrl(): string {
  const baseUrl = import.meta.env.BASE_URL ?? '/';
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalized}${CONTENT_DIR}/`;
}

export function contentUrl(fileName: string): string {
  return `${getContentBaseUrl()}${fileName}`;
}
