<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { isAuthenticated } from '$lib/auth';
  import { getDeck, getFlashcardsByDeck, deleteFlashcard, type Deck, type Flashcard } from '$lib/api';
  import Navigation from '$lib/components/Navigation.svelte';
  import Breadcrumb from '$lib/components/Breadcrumb.svelte';

  let deck: Deck | null = null;
  let flashcards: Flashcard[] = [];
  let loading = true;
  let error = '';
  let deletingCardId: number | null = null;

  onMount(async () => {
    if (!isAuthenticated()) {
      goto('/signin');
      return;
    }

    const deckId = parseInt($page.params.id || '0');
    if (isNaN(deckId)) {
      error = 'Invalid deck ID';
      loading = false;
      return;
    }

    await loadDeck(deckId);
  });

  async function loadDeck(id: number) {
    loading = true;
    error = '';
    try {
      const [deckData, flashcardsData] = await Promise.all([
        getDeck(id),
        getFlashcardsByDeck(id)
      ]);
      deck = deckData;
      flashcards = flashcardsData;
    } catch (err: any) {
      error = err.message || 'Failed to load deck';
      console.error('Error loading deck:', err);
    } finally {
      loading = false;
    }
  }

  function handleBack() {
    goto('/flashcards');
  }

  async function handleDeleteFlashcard(cardId: number) {
    if (deletingCardId !== null) return;

    if (!confirm('Are you sure you want to delete this flashcard?')) {
      return;
    }

    deletingCardId = cardId;
    try {
      await deleteFlashcard(cardId);
      flashcards = flashcards.filter(card => card.id !== cardId);
      if (deck) {
        deck.flashcardCount = flashcards.length;
      }
    } catch (err: any) {
      error = err.message || 'Failed to delete flashcard';
      console.error('Error deleting flashcard:', err);
    } finally {
      deletingCardId = null;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
  <Navigation />

  <!-- Main Content -->
  <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <Breadcrumb items={[
      { label: 'Flashcards', href: '/flashcards' },
      { label: 'Deck Details', current: true }
    ]} />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors duration-300">
      <div class="flex justify-between items-start mb-6">
        {#if deck}
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">{deck.name}</h1>
            <div class="flex items-center space-x-4 text-sm text-gray-700 dark:text-gray-400 transition-colors">
              <span class="font-medium">Language: {deck.language.toUpperCase()}</span>
              <span>Created: {new Date(deck.createdAt).toLocaleDateString()}</span>
              <span>{deck.flashcardCount} card{deck.flashcardCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        {/if}
        <button
          on:click={handleBack}
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors"
        >
          Back to Decks
        </button>
      </div>

      {#if loading}
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto transition-colors"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400 transition-colors">Loading deck...</p>
        </div>
      {:else if error}
        <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-6 transition-colors">
          {error}
        </div>
      {:else if deck}
        {#if flashcards.length === 0}
          <div class="text-center py-12">
            <div class="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
              <svg class="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors">No flashcards yet</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6 transition-colors">This deck is empty. Add flashcards to start learning.</p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each flashcards as flashcard}
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 transition-colors border border-gray-200 dark:border-gray-600">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-4 mb-2">
                      <div class="text-xl font-semibold text-gray-900 dark:text-white">{flashcard.word}</div>
                      {#if flashcard.pinyin}
                        <div class="text-lg text-gray-600 dark:text-gray-300">{flashcard.pinyin}</div>
                      {/if}
                    </div>
                    <div class="text-gray-700 dark:text-gray-300">{flashcard.translation}</div>
                    <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Next review: {new Date(flashcard.nextReviewDate).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    on:click={() => handleDeleteFlashcard(flashcard.id)}
                    disabled={deletingCardId === flashcard.id}
                    class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete flashcard"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </main>
</div>
