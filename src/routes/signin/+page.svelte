<script lang="ts">
  import { goto } from '$app/navigation';
  import { LOGIN_MUTATION } from '$lib/queries';
  import { client } from '$lib/graphql';

  let formData = {
    usernameOrEmail: '',
    password: '',
  };

  let isLoading = false;
  let errorMessage = '';

  async function handleSubmit(event: Event) {
    event.preventDefault();
    isLoading = true;
    errorMessage = '';

    try {
      const result = await client.mutation(LOGIN_MUTATION, {
        input: {
          username: formData.usernameOrEmail,
          password: formData.password,
        }
      }).toPromise();

      if (result.data?.login?.token) {
        localStorage.setItem('authToken', result.data.login.token);
        goto('/');
      } else {
        errorMessage = 'Login failed. Please check your credentials.';
      }
    } catch (error: any) {
      errorMessage = error.message || 'An error occurred during login.';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-all duration-500">
  <div class="max-w-md w-full space-y-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
    <div class="text-center">
      <div class="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
        <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
        </svg>
      </div>
      <h2 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Welcome Back
      </h2>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Sign in to continue your language learning journey
      </p>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-500">
        Or
        <a href="/signup" class="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-200">
          create a new account
        </a>
      </p>
    </div>

    {#if errorMessage}
      <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-md transition-colors">
        {errorMessage}
      </div>
    {/if}

    <form class="mt-8 space-y-6" on:submit={handleSubmit}>
      <div class="space-y-4">
        <div>
          <label for="usernameOrEmail" class="block text-sm font-medium text-gray-900 dark:text-gray-300 transition-colors">
            Username or Email
          </label>
          <input
            id="usernameOrEmail"
            name="usernameOrEmail"
            type="text"
            autocomplete="username"
            required
            bind:value={formData.usernameOrEmail}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Enter your username or email"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-900 dark:text-gray-300 transition-colors">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            bind:value={formData.password}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Enter your password"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {#if isLoading}
            <span class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          {:else}
            <span class="flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span>Sign In</span>
            </span>
          {/if}
        </button>
      </div>

      <div class="text-center">
        <a href="/" class="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
          ← Back to home
        </a>
      </div>
    </form>
  </div>
</div>
