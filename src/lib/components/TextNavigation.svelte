<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Text } from '$lib/api';

  interface Props {
    currentTextId: number;
    allTexts: Text[];
  }

  let { currentTextId, allTexts }: Props = $props();

  let sortedTexts = $derived(allTexts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  let currentIndex = $derived(sortedTexts.findIndex((text: Text) => text.id === currentTextId));
  let previousText = $derived(currentIndex > 0 ? sortedTexts[currentIndex - 1] : null);
  let nextText = $derived(currentIndex < sortedTexts.length - 1 ? sortedTexts[currentIndex + 1] : null);

  function navigateToText(textId: number) {
    goto(`/texts/${textId}/edit`);
  }
</script>

{#if previousText || nextText}
  <div class="flex justify-between items-center mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
    <div class="flex items-center space-x-4">
      {#if previousText}
        <button
          on:click={() => navigateToText(previousText.id)}
          class="flex items-center text-gray-900 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          <span class="text-sm font-medium">Previous</span>
        </button>
        <div class="text-xs text-gray-600 dark:text-gray-400">
          {previousText.language.toUpperCase()} • {new Date(previousText.createdAt).toLocaleDateString()}
        </div>
      {/if}
    </div>

    <div class="text-sm text-gray-700 dark:text-gray-300">
      Text {currentIndex + 1} of {sortedTexts.length}
    </div>

    <div class="flex items-center space-x-4">
      {#if nextText}
        <div class="text-xs text-gray-600 dark:text-gray-400 text-right">
          {nextText.language.toUpperCase()} • {new Date(nextText.createdAt).toLocaleDateString()}
        </div>
        <button
          on:click={() => navigateToText(nextText.id)}
          class="flex items-center text-gray-900 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <span class="text-sm font-medium">Next</span>
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      {/if}
    </div>
  </div>
{/if}
