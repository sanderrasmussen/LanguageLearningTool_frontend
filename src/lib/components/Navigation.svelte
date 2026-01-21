<script lang="ts">
  import { goto } from '$app/navigation';
  import { isAuthenticated } from '$lib/auth';
  import { onMount } from 'svelte';
  import DarkModeToggle from './DarkModeToggle.svelte';

  let authenticated = false;

  onMount(() => {
    authenticated = isAuthenticated();
  });

  function handleLogout() {
    localStorage.removeItem('authToken');
    authenticated = false;
    goto('/');
  }
</script>

<nav class="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex items-center">
        <button
          on:click={() => goto('/')}
          class="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Language Learning Tool
        </button>
      </div>

      <div class="flex items-center space-x-4">
        {#if authenticated}
          <button
            on:click={() => goto('/texts')}
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md font-medium transition-colors"
          >
            My Texts
          </button>
          <button
            on:click={() => goto('/texts/create')}
            class="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Create Text
          </button>
          <button
            on:click={handleLogout}
            class="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Logout
          </button>
        {:else}
          <a
            href="/signin"
            class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Sign In
          </a>
          <a
            href="/signup"
            class="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Sign Up
          </a>
        {/if}
        <DarkModeToggle />
      </div>
    </div>
  </div>
</nav>
