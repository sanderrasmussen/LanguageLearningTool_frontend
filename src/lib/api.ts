import { getStoredToken, clearStoredToken } from './auth';
import { goto } from '$app/navigation';

const API_BASE_URL = 'http://localhost:8080/api';

export interface CedictEntry {
  traditional: string;
  simplified: string;
  pinyin: string;
  definitions: string[];
}

export interface JmdictSense {
  gloss: string[];
  pos: string[];
  field: string[];
  misc: string[];
  dial: string[];
}

export interface JmdictEntry {
  entSeq: string;
  kanji: string[];
  reading: string[];
  senses: JmdictSense[];
}

export interface Text {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  isPublic: boolean;
  language: string;
  upvotes: number;
  userId: number;
  wordData?: Record<string, CedictEntry>;
  japaneseWordData?: Record<string, JmdictEntry>;
  segmentedText?: string[];
}

export interface TextRequest {
  title: string;
  content: string;
  language: string;
  isPublic?: boolean;
}

export interface Deck {
  id: number;
  name: string;
  language: string;
  createdAt: string;
  userId: number;
  flashcardCount: number;
}

export interface DeckRequest {
  name: string;
  language: string;
}

export interface Flashcard {
  id: number;
  word: string;
  translation: string;
  pinyin: string;
  createdAt: string;
  deckId: number;
  deckName: string;
  userId: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
}

export interface FlashcardRequest {
  word: string;
  translation: string;
  pinyin: string;
  deckId: number;
}

export interface ReviewRequest {
  quality: number; // 0-5 scale
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

export async function getText(id: number): Promise<Text> {
  const response = await fetchWithAuth(`${API_BASE_URL}/texts/${id}`);
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

export async function getPublicTexts(language?: string): Promise<Text[]> {
  const url = language
    ? `${API_BASE_URL}/texts/public?language=${encodeURIComponent(language)}`
    : `${API_BASE_URL}/texts/public`;
  const response = await fetch(url); // Public endpoint doesn't require auth
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function upvoteText(id: number): Promise<Text> {
  const response = await fetchWithAuth(`${API_BASE_URL}/texts/${id}/upvote`, {
    method: 'POST',
  });
  return response.json();
}

// Deck API functions
export async function getDeck(id: number): Promise<Deck> {
  const response = await fetchWithAuth(`${API_BASE_URL}/decks/${id}`);
  return response.json();
}

export async function getDecks(language?: string): Promise<Deck[]> {
  const url = language
    ? `${API_BASE_URL}/decks?language=${encodeURIComponent(language)}`
    : `${API_BASE_URL}/decks`;
  const response = await fetchWithAuth(url);
  return response.json();
}

export async function createDeck(deck: DeckRequest): Promise<Deck> {
  const response = await fetchWithAuth(`${API_BASE_URL}/decks`, {
    method: 'POST',
    body: JSON.stringify(deck),
  });
  return response.json();
}

export async function updateDeck(id: number, deck: DeckRequest): Promise<Deck> {
  const response = await fetchWithAuth(`${API_BASE_URL}/decks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(deck),
  });
  return response.json();
}

export async function deleteDeck(id: number): Promise<void> {
  await fetchWithAuth(`${API_BASE_URL}/decks/${id}`, {
    method: 'DELETE',
  });
}

// Flashcard API functions
export async function getFlashcardsByDeck(deckId: number): Promise<Flashcard[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/flashcards/deck/${deckId}`);
  return response.json();
}

export async function getDueFlashcards(limit: number = 20): Promise<Flashcard[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/flashcards/due?limit=${limit}`);
  return response.json();
}

export async function createFlashcard(flashcard: FlashcardRequest): Promise<Flashcard> {
  const response = await fetchWithAuth(`${API_BASE_URL}/flashcards`, {
    method: 'POST',
    body: JSON.stringify(flashcard),
  });
  return response.json();
}

export async function reviewFlashcard(id: number, review: ReviewRequest): Promise<Flashcard> {
  const response = await fetchWithAuth(`${API_BASE_URL}/flashcards/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(review),
  });
  return response.json();
}

export async function deleteFlashcard(id: number): Promise<void> {
  await fetchWithAuth(`${API_BASE_URL}/flashcards/${id}`, {
    method: 'DELETE',
  });
}
