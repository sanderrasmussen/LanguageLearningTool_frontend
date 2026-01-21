<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { isAuthenticated } from '$lib/auth';
  import { getTexts, deleteText, type Text } from '$lib/api';
  import Navigation from '$lib/components/Navigation.svelte';

  let texts: Text[] = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    if (!isAuthenticated()) {
      goto('/signin');
      return;
    }

    await loadTexts();
  });

  async function loadTexts() {
    loading = true;
    error = '';
    try {
      texts = await getTexts();
    } catch (err: any) {
      error = err.message || 'Failed to load texts';
      console.error('Error loading texts:', err);
    } finally {
      loading = false;
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this text?')) return;

    try {
      await deleteText(id);
      texts = texts.filter(text => text.id !== id);
    } catch (err: any) {
      alert('Failed to delete text: ' + (err.message || 'Unknown error'));
      console.error('Error deleting text:', err);
    }
  }

  function handleEdit(id: number) {
    goto(`/texts/${id}/edit`);
  }

  function handleCreate() {
    goto('/texts/create');
  }

  function handleView(id: number) {
    goto(`/texts/${id}`);
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
  <Navigation />

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">My Texts</h1>
      <p class="text-gray-700 dark:text-gray-400 transition-colors">Manage your saved texts for language learning.</p>
    </div>

    {#if loading}
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto transition-colors"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400 transition-colors">Loading your texts...</p>
      </div>
    {:else if error}
      <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4 mb-4 transition-colors">
        <p class="text-red-800 dark:text-red-200">{error}</p>
        <button
          on:click={loadTexts}
          class="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline transition-colors"
        >
          Try again
        </button>
      </div>
    {:else if texts.length === 0}
      <div class="text-center py-12">
        <div class="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
          <span class="text-4xl">📝</span>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors">No texts yet</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6 transition-colors">Start by creating your first text for language learning.</p>
        <button
          on:click={handleCreate}
          class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Create Your First Text
        </button>
      </div>
    {:else}
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each texts as text (text.id)}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700" on:click={() => handleView(text.id)}>
            <div class="flex justify-between items-start mb-4">
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1 transition-colors">
                  {text.title}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                  {text.language.toUpperCase()} • {new Date(text.createdAt).toLocaleDateString()}
                </p>
              </div>
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

            <div class="mb-4">
              <p class="text-gray-700 dark:text-gray-300 line-clamp-3 transition-colors">
                {text.content.length > 150 ? text.content.substring(0, 150) + '...' : text.content}
              </p>
            </div>

            <div class="flex justify-between items-center">
              <button
                on:click|stopPropagation={() => handleEdit(text.id)}
                class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm transition-colors"
              >
                Edit
              </button>
              <button
                on:click|stopPropagation={() => handleDelete(text.id)}
                class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>

<style>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
