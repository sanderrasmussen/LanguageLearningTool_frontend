<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Navigation from '$lib/components/Navigation.svelte';

  let isLoggedIn = false;

  onMount(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      isLoggedIn = true;
    }
  });

  function handleLogout() {
    localStorage.removeItem('authToken');
    isLoggedIn = false;
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
  <Navigation />

  <!-- Hero Section -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    {#if isLoggedIn}
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">Welcome back!</h1>
        <p class="text-xl text-gray-700 dark:text-gray-300 mb-8 transition-colors">Ready to continue your language learning journey?</p>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-md mx-auto transition-colors border border-gray-200 dark:border-gray-700">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4 transition-colors">Your Dashboard</h2>
          <p class="text-gray-700 dark:text-gray-300 transition-colors">Learning features will be available here soon!</p>
        </div>
      </div>
    {:else}
      <div class="text-center">
        <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors">
          Master Any Language
        </h1>
        <p class="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto transition-colors">
          Join thousands of learners on their language journey. Start learning today with our interactive tools and personalized lessons.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/signup"
            class="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            Start Learning Today
          </a>
          <a
            href="/signin"
            class="bg-white dark:bg-gray-800 border-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>

      <!-- Features Section -->
      <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors border border-gray-200 dark:border-gray-700">
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 transition-colors">
            <span class="text-2xl">📚</span>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors">Interactive Lessons</h3>
          <p class="text-gray-700 dark:text-gray-300 transition-colors">Learn through engaging exercises and real conversations.</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors border border-gray-200 dark:border-gray-700">
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4 transition-colors">
            <span class="text-2xl">🎯</span>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors">Personalized Learning</h3>
          <p class="text-gray-700 dark:text-gray-300 transition-colors">Adaptive lessons that match your learning style and pace.</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors border border-gray-200 dark:border-gray-700">
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4 transition-colors">
            <span class="text-2xl">🌍</span>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors">Multiple Languages</h3>
          <p class="text-gray-700 dark:text-gray-300 transition-colors">Choose from dozens of languages and start your journey.</p>
        </div>
      </div>
    {/if}
  </main>
</div>

