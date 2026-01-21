<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { isAuthenticated } from '$lib/auth';
  import { getTexts, getDecks, createFlashcard, type Text, type CedictEntry, type Deck } from '$lib/api';
  import { convertToToneMarks } from '$lib/utils';
  import Navigation from '$lib/components/Navigation.svelte';
  import Breadcrumb from '$lib/components/Breadcrumb.svelte';
  import TextNavigation from '$lib/components/TextNavigation.svelte';

  let text: Text | null = null;
  let allTexts: Text[] = [];
  let loading = true;
  let error = '';
  let focusedWord: CedictEntry | null = null;
  let availableDecks: Deck[] = [];
  let showDeckSelection = false;
  let selectedDeckId: number | null = null;
  let addingToDeck = false;

  onMount(async () => {
    if (!isAuthenticated()) {
      goto('/signin');
      return;
    }

    const textId = parseInt($page.params.id || '0');
    if (isNaN(textId)) {
      error = 'Invalid text ID';
      loading = false;
      return;
    }

    await loadText(textId);
  });

  async function loadText(id: number) {
    loading = true;
    error = '';
    try {
      const texts = await getTexts();
      allTexts = texts;
      text = texts.find(t => t.id === id) || null;

      if (!text) {
        error = 'Text not found';
      }
    } catch (err: any) {
      error = err.message || 'Failed to load text';
      console.error('Error loading text:', err);
    } finally {
      loading = false;
    }
  }

  function handleEdit() {
    if (text) {
      goto(`/texts/${text.id}/edit`);
    }
  }

  function handleBack() {
    goto('/texts');
  }

  function clickSegment(segment: string) {
    if (!segment || !text?.wordData) {
      return;
    }

    const wordEntry = text.wordData[segment];
    if (wordEntry) {
      // Find all sub-words within this compound word
      const relatedWords: CedictEntry[] = [wordEntry];

      // For compound words, also include individual characters
      if (segment.length > 1) {
        for (let i = 0; i < segment.length; i++) {
          const singleChar = segment.charAt(i);
          const singleEntry = text.wordData[singleChar];
          if (singleEntry) {
            relatedWords.push(singleEntry);
          }
        }
      }

      // Create a combined entry for display
      focusedWord = {
        traditional: wordEntry.traditional,
        simplified: wordEntry.simplified,
        pinyin: wordEntry.pinyin,
        definitions: wordEntry.definitions,
        relatedWords: relatedWords.slice(1) // All words except the main one
      } as any;
    }
  }

  async function loadDecks() {
    try {
      // Load decks filtered by the text's language
      availableDecks = await getDecks(text?.language);
    } catch (err: any) {
      console.error('Error loading decks:', err);
    }
  }

  async function handleAddToFlashcard() {
    if (!focusedWord) return;

    await loadDecks();
    showDeckSelection = true;
    selectedDeckId = null;
  }

  async function handleConfirmAddToDeck() {
    if (!focusedWord || !selectedDeckId || addingToDeck) return;

    addingToDeck = true;
    try {
      // Create the flashcard
      const translation = focusedWord.definitions.length > 0
        ? focusedWord.definitions[0].split('/')[0].trim() // Take first definition
        : focusedWord.simplified;

      await createFlashcard({
        word: focusedWord.simplified,
        translation: translation,
        pinyin: focusedWord.pinyin || '',
        deckId: selectedDeckId
      });

      // Success feedback
      showDeckSelection = false;
      focusedWord = null; // Close the dictionary panel
      // Could show a success toast here
    } catch (err: any) {
      error = err.message || 'Failed to add flashcard';
      console.error('Error adding flashcard:', err);
    } finally {
      addingToDeck = false;
    }
  }

  function handleCancelAddToDeck() {
    showDeckSelection = false;
    selectedDeckId = null;
  }
</script>

<!-- Dictionary popup removed - now using persistent sidebar -->

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
  <Navigation />

  <!-- Main Content -->
  <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <Breadcrumb items={[
      { label: 'My Texts', href: '/texts' },
      { label: 'View Text', current: true }
    ]} />

    {#if text}
      <TextNavigation currentTextId={text.id} allTexts={allTexts} />
    {/if}

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors duration-300">
      <div class="flex justify-between items-start mb-6">
        {#if text}
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">{text.title}</h1>
            <div class="flex items-center space-x-4 text-sm text-gray-700 dark:text-gray-400 transition-colors">
              <span class="font-medium">Language: {text.language.toUpperCase()}</span>
              <span>Created: {new Date(text.createdAt).toLocaleDateString()}</span>
              {#if text.isPublic}
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 transition-colors">
                  Public
                </span>
              {:else}
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors">
                  Private
                </span>
              {/if}
            </div>
          </div>
        {/if}
        {#if text}
          <button
            on:click={handleEdit}
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md font-medium transition-colors"
          >
            Edit Text
          </button>
        {/if}
      </div>

      {#if loading}
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto transition-colors"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400 transition-colors">Loading text...</p>
        </div>
      {:else if error}
        <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-6 transition-colors">
          {error}
        </div>
        <button
          on:click={handleBack}
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md font-medium transition-colors"
        >
          Back to Texts
        </button>
      {:else if text}
        <div class="flex gap-6">
          <!-- Text Content -->
          <div class="flex-1">
            {#if text.segmentedText}
              <div class="reading-view text-black dark:text-white">
                {#each text.segmentedText as segment}
                  {#if segment.trim() === ''}
                    {segment}
                  {:else}
                    <button
                      class="character"
                      title={`Click to look up: ${segment}`}
                      on:click={() => clickSegment(segment)}
                      type="button"
                    >{segment}</button>
                  {/if}
                {/each}
              </div>
            {:else}
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 transition-colors">
                <pre class="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed font-sans transition-colors">{text.content}</pre>
              </div>
            {/if}
          </div>

          <!-- Dictionary Panel -->
          {#if focusedWord}
            <div class="w-80 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-fit sticky top-6 transition-colors duration-300 border border-gray-200 dark:border-gray-700">
              <div class="flex flex-col gap-4">
                <!-- Main word -->
                <div class="border-b border-gray-200 dark:border-gray-600 pb-3">
                  <div class="flex items-center justify-between mb-2">
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">{focusedWord.simplified}</div>
                    <button
                      on:click={handleAddToFlashcard}
                      class="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-3 py-1 rounded text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      title="Add to Flashcard"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                    </button>
                  </div>
                  <div class="text-lg text-gray-600 dark:text-gray-300">{text?.language === 'zh' ? convertToToneMarks(focusedWord.pinyin) : focusedWord.pinyin}</div>
                  <div class="text-left mt-2">
                    <h3 class="font-semibold mb-1 text-gray-900 dark:text-gray-100">Definitions:</h3>
                    <ul class="list-disc list-inside">
                      {#each focusedWord.definitions as def}
                        <li class="text-gray-700 dark:text-gray-300">{def}</li>
                      {/each}
                    </ul>
                  </div>
                </div>

                <!-- Related words (sub-components) -->
                {#if (focusedWord as any).relatedWords && (focusedWord as any).relatedWords.length > 0}
                  <div>
                    <h3 class="font-semibold mb-2 text-gray-800 dark:text-gray-200">Word Components:</h3>
                    <div class="space-y-3">
                      {#each (focusedWord as any).relatedWords as relatedWord}
                        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded transition-colors">
                          <div class="text-xl font-semibold text-gray-900 dark:text-white">{relatedWord.simplified}</div>
                          <div class="text-sm text-gray-600 dark:text-gray-300">{text?.language === 'zh' ? convertToToneMarks(relatedWord.pinyin) : relatedWord.pinyin}</div>
                          <div class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {#each relatedWord.definitions.slice(0, 2) as def}
                              {def + (relatedWord.definitions.length > 2 ? ', ...' : '')}
                            {/each}
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>

        <div class="mt-8 flex justify-start">
          <button
            on:click={handleBack}
            class="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors"
          >
            Back to Texts
          </button>
        </div>
      {/if}
    </div>
  </main>

  <!-- Deck Selection Modal -->
  {#if showDeckSelection}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transition-colors">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">Add to Flashcard Deck</h3>
          <button on:click={handleCancelAddToDeck} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" type="button">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {#if focusedWord}
          <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="text-lg font-semibold text-gray-900 dark:text-white">{focusedWord.simplified}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">{text?.language === 'zh' ? convertToToneMarks(focusedWord.pinyin) : focusedWord.pinyin}</div>
            <div class="text-sm text-gray-700 dark:text-gray-300 mt-1">
              {focusedWord.definitions[0]?.split('/')[0] || 'Definition not available'}
            </div>
          </div>
        {/if}

        {#if availableDecks.length === 0}
          <div class="text-center py-8">
            <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No decks available</h4>
            <p class="text-gray-600 dark:text-gray-400 mb-4">Create a deck first to add flashcards.</p>
            <button on:click={() => goto('/flashcards')} class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200" type="button">
              Go to Flashcards
            </button>
          </div>
        {:else}
          <div class="space-y-3 mb-6">
            <label class="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
              Select a deck:
            </label>
            {#each availableDecks as deck}
              <button on:click={() => selectedDeckId = deck.id} class="w-full text-left p-3 rounded-lg border transition-all duration-200 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 {selectedDeckId === deck.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}" type="button">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">{deck.name}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">{deck.flashcardCount} cards</div>
                  </div>
                  {#if selectedDeckId === deck.id}
                    <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                  {/if}
                </div>
              </button>
            {/each}
          </div>

          <div class="flex justify-end space-x-3">
            <button on:click={handleCancelAddToDeck} class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors" disabled={addingToDeck} type="button">
              Cancel
            </button>
            <button on:click={handleConfirmAddToDeck} disabled={!selectedDeckId || addingToDeck} class="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" type="button">
              {#if addingToDeck}
                <span class="flex items-center space-x-2">
                  <svg class="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Adding...</span>
                </span>
              {:else}
                Add to Deck
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .reading-view {
    text-align: left;
    line-height: 2.2;
    font-size: 1.35rem;
    background-color: transparent;
    min-height: 300px;
    max-height: 70vh;
    padding: 0;
    width: 100%;
    word-spacing: 0.3rem;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-y: auto;
    margin: 0 auto;
    transition: color 0.3s ease;
    font-family: 'Georgia', 'Times New Roman', serif;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .character {
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    transition: background-color 0.2s, color 0.2s;
    border-radius: 6px;
  }

  .character:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  :global(.dark) .character:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .prose pre {
    background: transparent;
    padding: 0;
    margin: 0;
    font-size: inherit;
    line-height: inherit;
  }
</style>
