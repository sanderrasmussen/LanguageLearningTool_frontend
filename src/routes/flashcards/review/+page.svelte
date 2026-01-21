<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { isAuthenticated } from '$lib/auth';
  import { getDueFlashcards, reviewFlashcard, type Flashcard } from '$lib/api';
  import Navigation from '$lib/components/Navigation.svelte';

  let flashcards: Flashcard[] = [];
  let currentIndex = 0;
  let showAnswer = false;
  let loading = true;
  let reviewing = false;
  let error = '';
  let sessionStats = {
    reviewed: 0,
    correct: 0,
    totalTime: 0
  };
  let startTime = Date.now();

  onMount(async () => {
    if (!isAuthenticated()) {
      goto('/signin');
      return;
    }

    await loadDueFlashcards();
  });

  async function loadDueFlashcards() {
    loading = true;
    error = '';
    try {
      flashcards = await getDueFlashcards();
      if (flashcards.length === 0) {
        goto('/flashcards');
        return;
      }
    } catch (err: any) {
      error = err.message || 'Failed to load flashcards';
      console.error('Error loading due flashcards:', err);
    } finally {
      loading = false;
    }
  }

  async function handleQualityClick(quality: number) {
    if (reviewing || !currentFlashcard) return;

    reviewing = true;
    try {
      await reviewFlashcard(currentFlashcard.id, { quality });

      sessionStats.reviewed++;
      if (quality >= 3) {
        sessionStats.correct++;
      }

      // Move to next card or finish
      if (currentIndex < flashcards.length - 1) {
        currentIndex++;
        showAnswer = false;
      } else {
        // Review session complete
        sessionStats.totalTime = Math.round((Date.now() - startTime) / 1000);
        // Could show completion stats here
      }
    } catch (err: any) {
      error = err.message || 'Failed to submit review';
      console.error('Error submitting review:', err);
    } finally {
      reviewing = false;
    }
  }

  function toggleAnswer() {
    showAnswer = !showAnswer;
  }

  function handleFinish() {
    goto('/flashcards');
  }

  $: currentFlashcard = flashcards[currentIndex];
  $: progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;
  $: isComplete = currentIndex >= flashcards.length;
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
  <Navigation />

  <!-- Main Content -->
  <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Review Session</h1>
          <p class="text-gray-700 dark:text-gray-400 transition-colors">Strengthen your memory with spaced repetition.</p>
        </div>
        <button
          on:click={handleFinish}
          class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Progress Bar -->
      {#if !isComplete && flashcards.length > 0}
        <div class="mt-6">
          <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Card {currentIndex + 1} of {flashcards.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style="width: {progress}%"
            ></div>
          </div>
        </div>
      {/if}
    </div>

    {#if loading}
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto transition-colors"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400 transition-colors">Loading flashcards...</p>
      </div>
    {:else if error}
      <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4 mb-4 transition-colors">
        <p class="text-red-800 dark:text-red-200">{error}</p>
        <button
          on:click={loadDueFlashcards}
          class="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline transition-colors"
        >
          Try again
        </button>
      </div>
    {:else if isComplete}
      <!-- Session Complete -->
      <div class="text-center py-12">
        <div class="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
          <svg class="h-12 w-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">Review Session Complete!</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{sessionStats.reviewed}</div>
            <div class="text-gray-600 dark:text-gray-400">Cards Reviewed</div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <div class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{sessionStats.correct}</div>
            <div class="text-gray-600 dark:text-gray-400">Correct Answers</div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <div class="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{Math.round(sessionStats.totalTime / 60)}m</div>
            <div class="text-gray-600 dark:text-gray-400">Time Spent</div>
          </div>
        </div>

        <div class="space-x-4">
          <button
            on:click={() => goto('/flashcards')}
            class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Back to Flashcards
          </button>
          <button
            on:click={loadDueFlashcards}
            class="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Review More Cards
          </button>
        </div>
      </div>
    {:else if currentFlashcard}
      <!-- Flashcard Review -->
      <div class="max-w-2xl mx-auto">
        <!-- Card -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8 transition-all duration-300 border border-gray-200 dark:border-gray-700 min-h-[300px] flex flex-col justify-center">
          <!-- Card Header -->
          <div class="text-center mb-6">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {currentFlashcard.deckName} • {currentFlashcard.repetitions} review{currentFlashcard.repetitions !== 1 ? 's' : ''}
            </span>
          </div>

          <!-- Question (Word) -->
          <div class="text-center mb-8">
            <div class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {currentFlashcard.word}
            </div>
            {#if currentFlashcard.pinyin}
              <div class="text-xl text-gray-600 dark:text-gray-400">
                {currentFlashcard.pinyin}
              </div>
            {/if}
          </div>

          <!-- Answer Section -->
          {#if showAnswer}
            <div class="border-t border-gray-200 dark:border-gray-600 pt-8">
              <div class="text-center">
                <div class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  {currentFlashcard.translation}
                </div>
              </div>
            </div>
          {/if}

          <!-- Show Answer Button -->
          {#if !showAnswer}
            <div class="text-center">
              <button
                on:click={toggleAnswer}
                class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span class="flex items-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  <span>Show Answer</span>
                </span>
              </button>
            </div>
          {/if}
        </div>

        <!-- Answer Buttons -->
        {#if showAnswer}
          <div class="space-y-4">
            <p class="text-center text-gray-600 dark:text-gray-400 mb-6">How well did you know this?</p>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button
                on:click={() => handleQualityClick(0)}
                disabled={reviewing}
                class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <div class="text-center">
                  <div class="font-bold text-lg">Again</div>
                  <div class="text-sm opacity-90">0 - Complete blackout</div>
                </div>
              </button>

              <button
                on:click={() => handleQualityClick(1)}
                disabled={reviewing}
                class="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <div class="text-center">
                  <div class="font-bold text-lg">Hard</div>
                  <div class="text-sm opacity-90">1 - Incorrect response</div>
                </div>
              </button>

              <button
                on:click={() => handleQualityClick(2)}
                disabled={reviewing}
                class="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <div class="text-center">
                  <div class="font-bold text-lg">Good</div>
                  <div class="text-sm opacity-90">2 - Correct with effort</div>
                </div>
              </button>

              <button
                on:click={() => handleQualityClick(3)}
                disabled={reviewing}
                class="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <div class="text-center">
                  <div class="font-bold text-lg">Good</div>
                  <div class="text-sm opacity-90">3 - Correct after hesitation</div>
                </div>
              </button>

              <button
                on:click={() => handleQualityClick(4)}
                disabled={reviewing}
                class="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <div class="text-center">
                  <div class="font-bold text-lg">Easy</div>
                  <div class="text-sm opacity-90">4 - Correct with ease</div>
                </div>
              </button>

              <button
                on:click={() => handleQualityClick(5)}
                disabled={reviewing}
                class="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <div class="text-center">
                  <div class="font-bold text-lg">Perfect</div>
                  <div class="text-sm opacity-90">5 - Perfect response</div>
                </div>
              </button>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </main>
</div>

<style>
  .card-flip {
    transform-style: preserve-3d;
    transition: transform 0.6s;
  }

  .card-flip.flipped {
    transform: rotateY(180deg);
  }
</style>
