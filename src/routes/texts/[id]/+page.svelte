<script lang="ts">
  import { goto } from 
'$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { isAuthenticated } from '$lib/auth';
  import { getTexts, getText, getDecks, createFlashcard, type Text, type CedictEntry, type JmdictEntry, type Deck } from '$lib/api';
  import { convertToToneMarks, speakText, isTextToSpeechSupported } from '$lib/utils';
  import Navigation from '$lib/components/Navigation.svelte';
  import Breadcrumb from '$lib/components/Breadcrumb.svelte';
  import TextNavigation from '$lib/components/TextNavigation.svelte';

  let text: Text | null = null;
  let allTexts: Text[] = [];
  let loading = true;
  let error = '';
  let focusedWord: CedictEntry | null = null;
  let availableDecks: Deck[] = [];
  let showDeckSelection = false;
  let selectedDeckId: number | null = null;
  let addingToDeck = false;

  // Full text reading state
  let isReading = false;
  let currentHighlightIndex = -1;
  let readingProgress = 0;
  let totalChars = 0;
  let segmentCharStarts: number[] = [];

  onMount(async () => {
    if (!isAuthenticated()) {
      goto('/signin');
      return;
    }

    // Load voices for TTS (needed for some browsers)
    if ("speechSynthesis" in window) {
      // Some browsers need voices to be loaded first
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log("Loaded voices:", voices.length);
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
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
      // Fetch all texts for navigation (without heavy word data)
      allTexts = await getTexts();
      // Fetch the specific text with full details
      text = await getText(id);

      if (text) {
        // Prepare for full text reading
        const fullText = text.segmentedText?.join('') || text.content || '';
        totalChars = fullText.length;
        segmentCharStarts = [];
        let pos = 0;
        if (text.segmentedText) {
          for (let segment of text.segmentedText) {
            segmentCharStarts.push(pos);
            pos += segment.length;
          }
        }
      } else {
        error = 'Text not found';
      }
    } catch (err: any) {
      error = err.message || 'Failed to load text';
      console.error('Error loading text:', err);
    }
    finally {
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
    if (!segment || !text) {
      return;
    }

    // Chinese: use CC-CEDICT data directly
    if ((text.language === 'zh' || text.language.toLowerCase() === 'chinese') && text.wordData) {
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
      return;
    }

    // Japanese: adapt JMdict data to the same focusedWord shape
    if (
      (text.language === 'ja' || text.language.toLowerCase() === 'japanese') &&
      text.japaneseWordData
    ) {
      const wordEntry: JmdictEntry | undefined = text.japaneseWordData[segment];
      if (!wordEntry) {
        return;
      }

      const primaryKanji = (wordEntry.kanji && wordEntry.kanji[0]) || segment;
      const primaryReading = (wordEntry.reading && wordEntry.reading[0]) || '';
      const definitions: string[] =
        wordEntry.senses?.flatMap((s) => s.gloss ?? []) ?? [];

      // Find all related conjugations/forms that share the same kanji
      const relatedWords: any[] = [];
      if (wordEntry.kanji && wordEntry.kanji.length > 0) {
        // Search through all wordData to find entries with matching kanji
        for (const [key, entry] of Object.entries(text.japaneseWordData)) {
          if (entry.entSeq !== wordEntry.entSeq && entry.kanji && entry.kanji.length > 0) {
            // Check if this entry shares any kanji with the current entry
            const sharesKanji = entry.kanji.some((k: string) => wordEntry.kanji!.includes(k));
            if (sharesKanji) {
              const relatedKanji = entry.kanji.join(', ');
              const relatedReading = entry.reading?.join(', ') || '';
              const relatedDefinitions = entry.senses?.flatMap((s) => s.gloss ?? []) ?? [];
              
              relatedWords.push({
                traditional: relatedKanji,
                simplified: relatedKanji,
                pinyin: relatedReading,
                definitions: relatedDefinitions
              });
            }
          }
        }
      }

      // Create a combined entry for display
      focusedWord = {
        traditional: primaryKanji,
        simplified: primaryKanji,
        pinyin: primaryReading,
        definitions,
        relatedWords: relatedWords
      } as any;
    }
  }

  async function loadDecks() {
    try {
      // Load decks filtered by the text's language
      availableDecks = await getDecks(text?.language);
    } catch (err: any) {
      console.error('Error loading decks:', err);
    }
  }

  async function handleAddToFlashcard() {
    if (!focusedWord) return;

    await loadDecks();
    showDeckSelection = true;
    selectedDeckId = null;
  }

  async function handleConfirmAddToDeck() {
    if (!focusedWord || !selectedDeckId || addingToDeck) return;

    addingToDeck = true;
    try {
      // Create the flashcard
      const translation = focusedWord.definitions.length > 0
        ? focusedWord.definitions[0].split('/')[0].trim() // Take first definition
        : focusedWord.simplified;

      await createFlashcard({
        word: focusedWord.simplified,
        translation: translation,
        pinyin: focusedWord.pinyin || '',
        deckId: selectedDeckId
      });

      // Success feedback
      showDeckSelection = false;
      focusedWord = null; // Close the dictionary panel
      // Could show a success toast here
    } catch (err: any) {
      error = err.message || 'Failed to add flashcard';
      console.error('Error adding flashcard:', err);
    }
    finally {
      addingToDeck = false;
    }
  }

  function handleCancelAddToDeck() {
    showDeckSelection = false;
    selectedDeckId = null;
  }

  async function startReading() {
    if (!text) return;

    const fullText = text.segmentedText?.join("") || text.content || "";
    if (!fullText.trim()) return;

    // Stop any current speech
    stopReading(); 

    // Use native browser text-to-speech only
    if (!("speechSynthesis" in window)) {
      console.warn("Text-to-speech not supported in this browser.");
      error = "Text-to-speech not supported in your browser.";
      return;
    }

    console.log("Starting reading with native browser TTS");
    const utterance = new SpeechSynthesisUtterance(fullText);
    
    // Set language based on text language
    if (text.language === "zh" || text.language.toLowerCase() === "chinese") {
      utterance.lang = "zh-CN";
    } else if (text.language === "ja" || text.language.toLowerCase() === "japanese") {
      utterance.lang = "ja-JP";
    } else {
      utterance.lang = "en-US";
    }
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const charIndex = event.charIndex;
        // Find which segment this char belongs to
        for (let i = segmentCharStarts.length - 1; i >= 0; i--) {
          if (charIndex >= segmentCharStarts[i]) {
            currentHighlightIndex = i;
            break;
          }
        }
        readingProgress = totalChars > 0 ? (charIndex / totalChars) * 100 : 0;
      }
    };

    utterance.onend = () => {
      isReading = false;
      currentHighlightIndex = -1;
      readingProgress = 100;
    };

    utterance.onerror = () => {
      isReading = false;
      currentHighlightIndex = -1;
      readingProgress = 0;
    };

    window.speechSynthesis.speak(utterance);
    isReading = true;
  }

  function pauseReading() {
    if ("speechSynthesis" in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        isReading = true;
      } else {
        window.speechSynthesis.pause();
        isReading = false;
      }
    }
  }

  function stopReading() {
    // Stop native browser TTS
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    isReading = false;
    currentHighlightIndex = -1;
    readingProgress = 0;
  }

  async function seekToProgress(event: Event) {
    const target = event.target as HTMLInputElement;
    const newProgress = parseFloat(target.value);

    if (!text?.segmentedText) return;

    // Stop current reading
    stopReading();

    readingProgress = newProgress;

    // Find the segment corresponding to this progress
    const targetCharIndex = Math.floor((newProgress / 100) * totalChars);
    let startSegmentIndex = 0;

    for (let i = 0; i < segmentCharStarts.length; i++) {
      if (segmentCharStarts[i] <= targetCharIndex) {
        startSegmentIndex = i;
      } else {
        break;
      }
    }

    // Start reading from this segment
    const remainingSegments = text.segmentedText.slice(startSegmentIndex);
    const remainingText = remainingSegments.join("");

    if (remainingText.trim()) {
      isReading = true;

      // Use native browser text-to-speech
      if (!("speechSynthesis" in window)) {
        console.warn("Text-to-speech not supported in this browser for seeking.");
        error = "Text-to-speech not supported in your browser for seeking.";
        isReading = false;
        return;
      }

      console.log("Seeking with native browser TTS from progress: " + newProgress);
      const utterance = new SpeechSynthesisUtterance(remainingText);
      
      // Set language based on text language
      if (text.language === "zh" || text.language.toLowerCase() === "chinese") {
        utterance.lang = "zh-CN";
      } else if (text.language === "ja" || text.language.toLowerCase() === "japanese") {
        utterance.lang = "ja-JP";
      } else {
        utterance.lang = "en-US";
      }
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onboundary = (event) => {
        if (event.name === "word") {
          const charIndex = event.charIndex + segmentCharStarts[startSegmentIndex];
          // Find which segment this char belongs to
          for (let i = segmentCharStarts.length - 1; i >= 0; i--) {
            if (charIndex >= segmentCharStarts[i]) {
              currentHighlightIndex = i;
              break;
            }
          }
          readingProgress = totalChars > 0 ? (charIndex / totalChars) * 100 : 0;
        }
      };

      utterance.onend = () => {
        isReading = false;
        currentHighlightIndex = -1;
        readingProgress = 100;
      };

      utterance.onerror = () => {
        isReading = false;
        currentHighlightIndex = -1;
        error = "Native TTS failed to seek.";
      };

      window.speechSynthesis.speak(utterance);
    }
  }
</script>

<!-- Dictionary popup removed - now using persistent sidebar -->

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
  <Navigation />

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <Breadcrumb items={[
      { label: 'My Texts', href: '/texts' },
      { label: 'View Text', current: true }
    ]} />

    {#if text}
      <TextNavigation currentTextId={text.id} allTexts={allTexts} />
    {/if}

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors duration-300">
      <div class="flex justify-between items-start mb-6">
        {#if text}
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">{text.title}</h1>
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
          </div>
        {/if}
        {#if text}
          <div class="flex gap-2">
            {#if (text.language === 'zh' || text.language?.toLowerCase() === 'chinese') || 
                 (text.language === 'ja' || text.language?.toLowerCase() === 'japanese') || 
                 text.language === 'en'}
              <button
                on:click={startReading}
                disabled={isReading}
                class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors"
              >
                Read Full Text
              </button>
            {/if}
            <button
              on:click={handleEdit}
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md font-medium transition-colors"
            >
              Edit Text
            </button>
          </div>
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
                {#each text.segmentedText as segment, i}
                  {#if segment.trim() === ''}
                    {segment}
                  {:else}
                    <button
                      class={currentHighlightIndex === i ? 'highlight' : 'character'}
                      title={`Click to look up: ${segment}`}
                      on:click={() => clickSegment(segment)}
                      type="button"
                    >{segment}</button>
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
                  <div class="flex items-center justify-between mb-2">
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">{focusedWord.simplified}</div>
                    <button
                      on:click={handleAddToFlashcard}
                      class="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-3 py-1 rounded text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      title="Add to Flashcard"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                    </button>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="text-lg text-gray-600 dark:text-gray-300">{text?.language === 'zh' ? convertToToneMarks(focusedWord.pinyin) : focusedWord.pinyin}</div>
                    {#if focusedWord}
                      {#if (text?.language === 'zh' || text?.language?.toLowerCase() === 'chinese') && isTextToSpeechSupported('zh-CN')}
                        <button
                          on:click={async () => await speakText(focusedWord!.simplified || focusedWord!.pinyin || '', 'zh-CN')}
                          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Speak word"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                          </svg>
                        </button>
                      {:else if (text?.language === 'ja' || text?.language?.toLowerCase() === 'japanese')}
                        <button
                          on:click={async () => {
                            // For Japanese, prefer reading (hiragana/katakana) over kanji for pronunciation
                            const wordToSpeak = focusedWord!.pinyin || focusedWord!.simplified || '';
                            if (wordToSpeak) {
                              await speakText(wordToSpeak, 'ja-JP');
                            }
                          }}
                          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Speak word"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                          </svg>
                        </button>
                      {/if}
                    {/if}
                  </div>
                  <div class="text-left mt-2">
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
                          <div class="text-sm text-gray-600 dark:text-gray-300">{text?.language === 'zh' ? convertToToneMarks(relatedWord.pinyin) : relatedWord.pinyin}</div>
                          <div class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {#each relatedWord.definitions.slice(0, 2) as def}
                              {def + (relatedWord.definitions.length > 2 ? ', ...' : '')}
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

        <!-- Reading Controls -->
        {#if isReading || readingProgress > 0}
          <div class="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div class="flex items-center gap-4">
              <button on:click={pauseReading} class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
                {isReading ? 'Pause' : 'Resume'}
              </button>
              <button on:click={stopReading} class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors">
                Stop
              </button>
              <div class="flex-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={readingProgress}
                  on:input={seekToProgress}
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                />
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Progress: {Math.round(readingProgress)}%
                </div>
              </div>
            </div>
          </div>
        {/if}

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

  <!-- Deck Selection Modal -->
  {#if showDeckSelection}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transition-colors">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">Add to Flashcard Deck</h3>
          <button on:click={handleCancelAddToDeck} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" type="button">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {#if focusedWord}
          <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="text-lg font-semibold text-gray-900 dark:text-white">{focusedWord.simplified}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">{text?.language === 'zh' ? convertToToneMarks(focusedWord.pinyin) : focusedWord.pinyin}</div>
            <div class="text-sm text-gray-700 dark:text-gray-300 mt-1">
              {focusedWord.definitions[0]?.split('/')[0] || 'Definition not available'}
            </div>
          </div>
        {/if}

        {#if availableDecks.length === 0}
          <div class="text-center py-8">
            <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No decks available</h4>
            <p class="text-gray-600 dark:text-gray-400 mb-4">Create a deck first to add flashcards.</p>
            <button on:click={() => goto('/flashcards')} class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200" type="button">
              Go to Flashcards
            </button>
          </div>
        {:else}
          <div class="space-y-3 mb-6">
            <label class="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
              Select a deck:
            </label>
            {#each availableDecks as deck}
              <button on:click={() => selectedDeckId = deck.id} class="w-full text-left p-3 rounded-lg border transition-all duration-200 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 {selectedDeckId === deck.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}" type="button">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">{deck.name}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">{deck.flashcardCount} cards</div>
                  </div>
                  {#if selectedDeckId === deck.id}
                    <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                  {/if}
                </div>
              </button>
            {/each}
          </div>

          <div class="flex justify-end space-x-3">
            <button on:click={handleCancelAddToDeck} class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors" disabled={addingToDeck} type="button">
              Cancel
            </button>
            <button on:click={handleConfirmAddToDeck} disabled={!selectedDeckId || addingToDeck} class="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" type="button">
              {#if addingToDeck}
                <span class="flex items-center space-x-2">
                  <svg class="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Adding...</span>
                </span>
              {:else}
                Add to Deck
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .reading-view {
    text-align: left;
    line-height: 2.2;
    font-size: 1.35rem;
    background-color: transparent;
    min-height: 500px;
    max-height: 85vh;
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

  .highlight {
    background-color: yellow !important;
    color: black !important;
    border-radius: 6px;
    padding: 2px;
    animation: pulse 1s ease-in-out;
  }

  .prose pre {
    background: transparent;
    padding: 0;
    margin: 0;
    font-size: inherit;
    line-height: inherit;
  }
</style>