<script lang="ts">
  import { goto } from '$app/navigation';
  import { SIGN_UP_MUTATION } from '$lib/queries';
  import { client } from '$lib/graphql';

  let formData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';

  async function handleSubmit(event: Event) {
    event.preventDefault();
    isLoading = true;
    errorMessage = '';
    successMessage = '';

    if (formData.password !== formData.confirmPassword) {
      errorMessage = 'Passwords do not match.';
      isLoading = false;
      return;
    }

    if (formData.password.length < 6) {
      errorMessage = 'Password must be at least 6 characters long.';
      isLoading = false;
      return;
    }

    try {
      const result = await client.mutation(SIGN_UP_MUTATION, {
        input: {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }
      }).toPromise();

      if (result.data?.signUp?.token) {
        successMessage = 'Account created successfully! Redirecting...';
        localStorage.setItem('authToken', result.data.signUp.token);
        setTimeout(() => {
          goto('/');
        }, 2000);
      } else {
        errorMessage = result.error?.message || 'Sign up failed. Please try again.';
      }
    } catch (error: any) {
      errorMessage = error.message || 'An error occurred during sign up.';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
  <div class="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors border border-gray-200 dark:border-gray-700">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white transition-colors">
        Create your account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-700 dark:text-gray-300 transition-colors">
        Already have an account?
        <a href="/signin" class="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
          Sign in here
        </a>
      </p>
    </div>

    {#if errorMessage}
      <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-md transition-colors">
        {errorMessage}
      </div>
    {/if}

    {#if successMessage}
      <div class="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded-md transition-colors">
        {successMessage}
      </div>
    {/if}

    <form class="mt-8 space-y-6" on:submit={handleSubmit}>
      <div class="space-y-4">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-900 dark:text-gray-300 transition-colors">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autocomplete="username"
            required
            bind:value={formData.username}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Choose a username"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-900 dark:text-gray-300 transition-colors">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            bind:value={formData.email}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Enter your email"
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
            autocomplete="new-password"
            required
            bind:value={formData.password}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Create a password (min. 6 characters)"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-900 dark:text-gray-300 transition-colors">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            bind:value={formData.confirmPassword}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Confirm your password"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {#if isLoading}
            <span class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </span>
          {:else}
            Create Account
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
