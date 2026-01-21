<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { isAuthenticated } from '$lib/auth';
  import { getDecks, getDueFlashcards, createDeck, type Deck, type Flashcard } from '$lib/api';
  import Navigation from '$lib/components/Navigation.svelte';

  let decks: Deck[] = [];
  let dueFlashcards: Flashcard[] = [];
  let loading = true;
  let error = '';
  let activeTab = 'decks'; // 'decks' or 'review'
  let showCreateDeckModal = false;
  let deckForm = {
    name: '',
    language: 'en'
  };
  let creatingDeck = false;

  onMount(async () => {
    if (!isAuthenticated()) {
      goto('/signin');
      return;
    }

    await loadData();
  });

  async function loadData() {
    loading = true;
    error = '';
    try {
      [decks, dueFlashcards] = await Promise.all([
        getDecks(),
        getDueFlashcards()
      ]);
    } catch (err: any) {
      error = err.message || 'Failed to load data';
      console.error('Error loading flashcards data:', err);
    } finally {
      loading = false;
    }
  }

  function handleCreateDeck() {
    showCreateDeckModal = true;
    deckForm = { name: '', language: 'en' };
    error = '';
  }

  function handleCancelDeck() {
    showCreateDeckModal = false;
    deckForm = { name: '', language: 'en' };
    error = '';
  }

  async function handleSubmitDeck() {
    if (!deckForm.name.trim()) {
      error = 'Deck name is required';
      return;
    }

    creatingDeck = true;
    error = '';

    try {
      await createDeck({
        name: deckForm.name.trim(),
        language: deckForm.language
      });

      showCreateDeckModal = false;
      deckForm = { name: '', language: 'en' };
      await loadData(); // Refresh the decks list
    } catch (err: any) {
      error = err.message || 'Failed to create deck';
      console.error('Error creating deck:', err);
    } finally {
      creatingDeck = false;
    }
  }

  function handleReview() {
    if (dueFlashcards.length > 0) {
      goto('/flashcards/review');
    }
  }

  function handleViewDeck(deckId: number) {
    goto(`/flashcards/deck/${deckId}`);
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
  <Navigation />

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Flashcards</h1>
      <p class="text-gray-700 dark:text-gray-400 transition-colors">Master vocabulary with spaced repetition learning.</p>
    </div>

    <!-- Tab Navigation -->
    <div class="mb-6">
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-8">
          <button
            on:click={() => activeTab = 'decks'}
            class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {activeTab === 'decks'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}"
          >
            My Decks ({decks.length})
          </button>
          <button
            on:click={() => activeTab = 'review'}
            class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {activeTab === 'review'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}"
          >
            Review ({dueFlashcards.length})
            {#if dueFlashcards.length > 0}
              <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                {dueFlashcards.length}
              </span>
            {/if}
          </button>
        </nav>
      </div>
    </div>

    {#if loading}
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto transition-colors"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400 transition-colors">Loading your flashcards...</p>
      </div>
    {:else if error}
      <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4 mb-4 transition-colors">
        <p class="text-red-800 dark:text-red-200">{error}</p>
        <button
          on:click={loadData}
          class="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline transition-colors"
        >
          Try again
        </button>
      </div>
    {:else if activeTab === 'review'}
      <!-- Review Tab -->
      <div class="space-y-6">
        {#if dueFlashcards.length === 0}
          <div class="text-center py-12">
            <div class="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
              <svg class="h-12 w-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors">All caught up!</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6 transition-colors">No flashcards due for review right now.</p>
            <p class="text-sm text-gray-500 dark:text-gray-500 transition-colors">Come back later or add more flashcards to keep learning.</p>
          </div>
        {:else}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Ready for Review</h2>
                <p class="text-gray-600 dark:text-gray-400 transition-colors">You have {dueFlashcards.length} flashcard{dueFlashcards.length !== 1 ? 's' : ''} waiting to be reviewed.</p>
              </div>
              <button
                on:click={handleReview}
                class="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span class="flex items-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  <span>Start Review</span>
                </span>
              </button>
            </div>

            <!-- Preview of due flashcards -->
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {#each dueFlashcards.slice(0, 6) as flashcard}
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors">
                  <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">{flashcard.deckName}</div>
                  <div class="font-medium text-gray-900 dark:text-white">{flashcard.word}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Due: {new Date(flashcard.nextReviewDate).toLocaleDateString()}
                  </div>
                </div>
              {/each}
              {#if dueFlashcards.length > 6}
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-center transition-colors">
                  <span class="text-gray-600 dark:text-gray-400">+{dueFlashcards.length - 6} more...</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Decks Tab -->
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Your Decks</h2>
            <p class="text-gray-600 dark:text-gray-400 transition-colors">Organize your flashcards by language and topic.</p>
          </div>
          <button
            on:click={handleCreateDeck}
            class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <span class="flex items-center space-x-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              <span>Create Deck</span>
            </span>
          </button>
        </div>

        {#if decks.length === 0}
          <div class="text-center py-12">
            <div class="w-24 h-24 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
              <svg class="h-12 w-12 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors">No decks yet</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6 transition-colors">Create your first deck to start building flashcards.</p>
            <button
              on:click={handleCreateDeck}
              class="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Create Your First Deck
            </button>
          </div>
        {:else}
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {#each decks as deck}
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700" on:click={() => handleViewDeck(deck.id)}>
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white transition-colors">{deck.name}</h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400 transition-colors">{deck.language.toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <div class="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                    {deck.flashcardCount} card{deck.flashcardCount !== 1 ? 's' : ''}
                  </div>
                  <svg class="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </main>

  <!-- Create Deck Modal -->
  {#if showCreateDeckModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transition-colors">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">Create New Deck</h3>
          <button
            on:click={handleCancelDeck}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {#if error}
          <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-6 transition-colors">
            {error}
          </div>
        {/if}

        <form on:submit|preventDefault={handleSubmitDeck} class="space-y-4">
          <div>
            <label for="deckName" class="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
              Deck Name *
            </label>
            <input
              id="deckName"
              type="text"
              bind:value={deckForm.name}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., Chinese HSK Level 1"
              required
            />
          </div>

          <div>
            <label for="deckLanguage" class="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
              Language *
            </label>
            <select
              id="deckLanguage"
              bind:value={deckForm.language}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ru">Russian</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              on:click={handleCancelDeck}
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors"
              disabled={creatingDeck}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingDeck}
              class="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {#if creatingDeck}
                <span class="flex items-center space-x-2">
                  <svg class="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating...</span>
                </span>
              {:else}
                Create Deck
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
