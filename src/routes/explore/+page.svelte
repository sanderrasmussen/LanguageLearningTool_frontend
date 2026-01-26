<script lang="ts">
  import { onMount } from 'svelte';
  import { getPublicTexts, upvoteText, type Text } from '$lib/api';
  import Navigation from '$lib/components/Navigation.svelte';
  import Breadcrumb from '$lib/components/Breadcrumb.svelte';
  import { goto } from '$app/navigation';

  let texts: Text[] = [];
  let loading = true;
  let error = '';
  let selectedLanguage = '';

  const languages = [
    { value: '', label: 'All Languages' },
    { value: 'zh', label: 'Chinese' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ja', label: 'Japanese' },
  ];

  async function loadTexts() {
    loading = true;
    error = '';
    try {
      texts = await getPublicTexts(selectedLanguage || undefined);
    } catch (err: any) {
      error = err.message || 'Failed to load texts';
      console.error('Error loading texts:', err);
    } finally {
      loading = false;
    }
  }

  function handleLanguageChange() {
    loadTexts();
  }

  async function handleUpvote(textId: number) {
    try {
      const updatedText = await upvoteText(textId);
      // Update the text in the list
      texts = texts.map(text =>
        text.id === textId ? updatedText : text
      );
    } catch (err: any) {
      console.error('Error upvoting text:', err);
      // Could show a toast notification here
    }
  }

  function handleViewText(textId: number) {
    goto(`/texts/${textId}`);
  }

  onMount(() => {
    loadTexts();
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
  <Navigation />

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <Breadcrumb items={[
      { label: 'Explore Texts', current: true }
    ]} />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors duration-300">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Explore Public Texts</h1>

        <div class="flex items-center gap-4">
          <label for="language-select" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Language:
          </label>
          <select
            id="language-select"
            bind:value={selectedLanguage}
            on:change={handleLanguageChange}
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {#each languages as lang}
              <option value={lang.value}>{lang.label}</option>
            {/each}
          </select>
        </div>
      </div>

      {#if loading}
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto transition-colors"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400 transition-colors">Loading texts...</p>
        </div>
      {:else if error}
        <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-6 transition-colors">
          {error}
        </div>
      {:else if texts.length === 0}
        <div class="text-center py-12">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No public texts found</h4>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {#if selectedLanguage}
              No public texts found for {languages.find(l => l.value === selectedLanguage)?.label || selectedLanguage}.
            {:else}
              No public texts available yet.
            {/if}
          </p>
        </div>
      {:else}
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {#each texts as text}
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-600">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {text.title}
                </h3>
                <button
                  on:click={() => handleUpvote(text.id)}
                  class="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                  title="Upvote this text"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  {text.upvotes}
                </button>
              </div>

              <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                {text.content.length > 150 ? text.content.substring(0, 150) + '...' : text.content}
              </p>

              <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span class="font-medium">Language: {text.language.toUpperCase()}</span>
                <span>Created: {new Date(text.createdAt).toLocaleDateString()}</span>
              </div>

              <button
                on:click={() => handleViewText(text.id)}
                class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
              >
                Read Text
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </main>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
