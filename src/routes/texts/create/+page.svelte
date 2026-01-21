<script lang="ts">
  import { goto } from '$app/navigation';
  import { isAuthenticated } from '$lib/auth';
  import { createText } from '$lib/api';
  import { onMount } from 'svelte';
  import Navigation from '$lib/components/Navigation.svelte';
  import Breadcrumb from '$lib/components/Breadcrumb.svelte';

  let content = '';
  let language = 'en';
  let isPublic = false;
  let saving = false;
  let error = '';

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' }
  ];

  onMount(() => {
    if (!isAuthenticated()) {
      goto('/signin');
    }
  });

  async function handleSubmit() {
    if (!content.trim()) {
      error = 'Content is required';
      return;
    }

    saving = true;
    error = '';

    try {
      await createText({
        content: content.trim(),
        language,
        isPublic
      });
      goto('/texts');
    } catch (err: any) {
      error = err.message || 'Failed to create text';
      console.error('Error creating text:', err);
    } finally {
      saving = false;
    }
  }

  function handleCancel() {
    goto('/texts');
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
  <Navigation />

  <!-- Main Content -->
  <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <Breadcrumb items={[
      { label: 'My Texts', href: '/texts' },
      { label: 'Create Text', current: true }
    ]} />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors border border-gray-200 dark:border-gray-700">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6 transition-colors">Create New Text</h1>

      {#if error}
        <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-6 transition-colors">
          {error}
        </div>
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div>
          <label for="content" class="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2 transition-colors">
            Content *
          </label>
          <textarea
            id="content"
            bind:value={content}
            rows="10"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter your text here..."
            required
          ></textarea>
        </div>

        <div>
          <label for="language" class="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2 transition-colors">
            Language *
          </label>
          <select
            id="language"
            bind:value={language}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
          >
            {#each languages as lang}
              <option value={lang.code}>{lang.name}</option>
            {/each}
          </select>
        </div>

        <div class="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            bind:checked={isPublic}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
          <label for="isPublic" class="ml-2 block text-sm text-gray-700 dark:text-gray-300 transition-colors">
            Make this text public
          </label>
        </div>

        <div class="flex justify-end space-x-4">
          <button
            type="button"
            on:click={handleCancel}
            class="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? 'Creating...' : 'Create Text'}
          </button>
        </div>
      </form>
    </div>
  </main>
</div>
