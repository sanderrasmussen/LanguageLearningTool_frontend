<script lang="ts">
  import { speakText, isTextToSpeechSupported, getVoicesForLanguage } from '$lib/utils';
  import { onMount } from 'svelte';

  let voices: SpeechSynthesisVoice[] = [];
  let status = '';
  let testText = 'こんにちは、これはテストです。';
  let isTesting = false;

  onMount(() => {
    loadVoices();
  });

  async function loadVoices() {
    if (!("speechSynthesis" in window)) {
      status = "Web Speech API not supported in this browser";
      return;
    }

    // Wait for voices to load
    const loadVoices = () => {
      voices = window.speechSynthesis.getVoices();
      console.log("Loaded voices:", voices.length);
      status = `Loaded ${voices.length} voices`;
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  async function testJapaneseTTS() {
    if (!isTextToSpeechSupported('ja-JP')) {
      status = "Japanese TTS not supported";
      return;
    }

    isTesting = true;
    status = "Testing Japanese TTS...";
    
    try {
      await speakText(testText, 'ja-JP');
      status = "Japanese TTS test completed successfully";
    } catch (error) {
      status = `Japanese TTS test failed: ${error}`;
    } finally {
      isTesting = false;
    }
  }

  async function testChineseTTS() {
    if (!isTextToSpeechSupported('zh-CN')) {
      status = "Chinese TTS not supported";
      return;
    }

    isTesting = true;
    status = "Testing Chinese TTS...";
    
    try {
      await speakText('你好，这是测试。', 'zh-CN');
      status = "Chinese TTS test completed successfully";
    } catch (error) {
      status = `Chinese TTS test failed: ${error}`;
    } finally {
      isTesting = false;
    }
  }

  function listJapaneseVoices() {
    const japaneseVoices = voices.filter(v => 
      v.lang.includes('ja') || 
      v.name.toLowerCase().includes('japanese') ||
      v.name.toLowerCase().includes('japonais')
    );
    
    if (japaneseVoices.length === 0) {
      status = "No Japanese voices found";
    } else {
      status = `Found ${japaneseVoices.length} Japanese voices: ${japaneseVoices.map(v => v.name).join(', ')}`;
    }
  }
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
  <div class="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">TTS Test Page</h1>
    
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Status: {status}</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Japanese TTS Test</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">Test text: {testText}</p>
        <button 
          on:click={testJapaneseTTS}
          disabled={isTesting}
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {isTesting ? 'Testing...' : 'Test Japanese TTS'}
        </button>
      </div>

      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Chinese TTS Test</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">Test text: 你好，这是测试。</p>
        <button 
          on:click={testChineseTTS}
          disabled={isTesting}
          class="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {isTesting ? 'Testing...' : 'Test Chinese TTS'}
        </button>
      </div>
    </div>

    <div class="mb-8">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Voice Information</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          on:click={loadVoices}
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
        >
          Load All Voices
        </button>
        <button 
          on:click={listJapaneseVoices}
          class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          List Japanese Voices
        </button>
        <button 
          on:click={() => { voices = []; status = 'Voices cleared'; }}
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          Clear Voices
        </button>
      </div>
      
      {#if voices.length > 0}
        <div class="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Available Voices:</h4>
          <ul class="list-disc list-inside space-y-1">
            {#each voices as voice}
              <li class="text-gray-700 dark:text-gray-300">
                {voice.name} ({voice.lang}) {voice.default ? '(Default)' : ''}
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>

    <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Instructions</h3>
      <ul class="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
        <li>Click "Load All Voices" to see what voices are available in your browser</li>
        <li>Click "List Japanese Voices" to filter for Japanese-specific voices</li>
        <li>Click "Test Japanese TTS" to test the Japanese text-to-speech functionality</li>
        <li>Click "Test Chinese TTS" to test the Chinese text-to-speech functionality</li>
        <li>Check the browser console for detailed logging information</li>
      </ul>
    </div>
  </div>
</div>