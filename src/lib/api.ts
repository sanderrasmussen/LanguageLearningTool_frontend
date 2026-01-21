import { getStoredToken, clearStoredToken } from './auth';
import { goto } from '$app/navigation';

const API_BASE_URL = 'http://localhost:8080/api';

export interface CedictEntry {
  traditional: string;
  simplified: string;
  pinyin: string;
  definitions: string[];
}

export interface Text {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  isPublic: boolean;
  language: string;
  userId: number;
  wordData?: Record<string, CedictEntry>;
  segmentedText?: string[];
}

export interface TextRequest {
  title: string;
  content: string;
  language: string;
  isPublic?: boolean;
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle authentication errors
  if (response.status === 401 || response.status === 403) {
    clearStoredToken();
    if (typeof window !== 'undefined' && window.location.pathname !== '/signin') {
      goto('/signin');
    }
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response;
}

export async function getTexts(): Promise<Text[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/texts`);
  return response.json();
}

export async function createText(text: TextRequest): Promise<Text> {
  const response = await fetchWithAuth(`${API_BASE_URL}/texts`, {
    method: 'POST',
    body: JSON.stringify(text),
  });
  return response.json();
}

export async function updateText(id: number, text: TextRequest): Promise<Text> {
  const response = await fetchWithAuth(`${API_BASE_URL}/texts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(text),
  });
  return response.json();
}

export async function deleteText(id: number): Promise<void> {
  await fetchWithAuth(`${API_BASE_URL}/texts/${id}`, {
    method: 'DELETE',
  });
}
