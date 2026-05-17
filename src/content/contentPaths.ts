import { RUNTIME_CONTENT_DIR } from './runtimeContentManifest.js';

export const CONTENT_DIR = RUNTIME_CONTENT_DIR;

export function getContentBaseUrl(): string {
  const baseUrl = import.meta.env.BASE_URL ?? '/';
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalized}${CONTENT_DIR}/`;
}

export function contentUrl(fileName: string): string {
  return `${getContentBaseUrl()}${fileName}`;
}
