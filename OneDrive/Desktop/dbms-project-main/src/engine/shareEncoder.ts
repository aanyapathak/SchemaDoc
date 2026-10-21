import type { Column, DecomposedTable, FunctionalDependency, NormalizationAnalysis, TableRow } from './types';

export interface SharePayload {
  id: string;
  title: string;
  createdAt: string;
  attributes: string[];
  columns: Column[];
  rows: TableRow[];
  fds: FunctionalDependency[];
  analysis: NormalizationAnalysis;
  decomposedTables: DecomposedTable[];
}

/**
 * Generates a random 6-character uppercase alphanumeric ID (e.g. 8XK29P)
 */
export function generateShortId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Encodes payload into URL-safe base64 string and saves to localStorage
 */
export function createShareableLink(payload: Omit<SharePayload, 'id' | 'createdAt'>): {
  id: string;
  url: string;
} {
  const id = generateShortId();
  const fullPayload: SharePayload = {
    ...payload,
    id,
    createdAt: new Date().toISOString(),
  };

  const jsonStr = JSON.stringify(fullPayload);
  
  // Store in localStorage for instant retrieval across browser tabs
  try {
    localStorage.setItem(`sd_share_${id}`, jsonStr);
  } catch (e) {
    console.warn('LocalStorage quota exceeded, relying on URL hash fallback');
  }

  // Also compress into Base64 URL parameter
  const base64Data = btoa(encodeURIComponent(jsonStr));
  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = `${baseUrl}#/result/${id}?data=${base64Data}`;

  return { id, url: shareUrl };
}

/**
 * Decodes share payload from URL parameter or localStorage
 */
export function parseShareableLink(): SharePayload | null {
  const hash = window.location.hash;
  if (!hash.includes('/result/')) return null;

  const match = hash.match(/\/result\/([A-Za-z0-9]+)/);
  const shareId = match ? match[1] : null;

  if (shareId) {
    // Try localStorage first
    const cached = localStorage.getItem(`sd_share_${shareId}`);
    if (cached) {
      try {
        return JSON.parse(cached) as SharePayload;
      } catch (e) {
        console.error('Failed to parse cached share payload', e);
      }
    }
  }

  // Try URL parameter fallback
  const searchParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const dataParam = searchParams.get('data');

  if (dataParam) {
    try {
      const decodedJson = decodeURIComponent(atob(dataParam));
      return JSON.parse(decodedJson) as SharePayload;
    } catch (e) {
      console.error('Failed to decode URL base64 data', e);
    }
  }

  return null;
}
