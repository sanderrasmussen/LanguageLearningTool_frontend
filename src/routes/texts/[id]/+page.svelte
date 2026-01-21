<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { isAuthenticated } from '$lib/auth';
  import { getTexts, type Text, type CedictEntry } from '$lib/api';
  import Navigation from '$lib/components/Navigation.svelte';
  import Breadcrumb from '$lib/components/Breadcrumb.svelte';
  import TextNavigation from '$lib/components/TextNavigation.svelte';

  let text: Text | null = null;
  let allTexts: Text[] = [];
  let loading = true;
  let error = '';
  let focusedWord: CedictEntry | null = null;

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
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Text Details</h1>
          {#if text}
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
          {/if}
        </div>
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
                    <span
                      class="character"
                      title={`Click to look up: ${segment}`}
                      on:click={() => clickSegment(segment)}
                    >{segment}</span>
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
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{focusedWord.simplified}</div>
                  <div class="text-lg text-gray-600 dark:text-gray-300">{focusedWord.pinyin}</div>
                  <div class="text-left">
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
                          <div class="text-sm text-gray-600 dark:text-gray-300">{relatedWord.pinyin}</div>
                          <div class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {#each relatedWord.definitions.slice(0, 2) as def}
                              {def}{relatedWord.definitions.length > 2 ? ', ...' : ''}
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
