/**
 * Converts pinyin with number tones to pinyin with tone marks
 * @param pinyin - Pinyin string with numbers (e.g., "ni3 hao3")
 * @returns Pinyin string with tone marks (e.g., "nǐ hǎo")
 */
export function convertToToneMarks(pinyin: string): string {
  if (!pinyin) return pinyin;

  // Split by spaces to handle multiple syllables
  const syllables = pinyin.split(' ');

  const convertedSyllables = syllables.map(syllable => {
    // Find the tone number (1-5) at the end
    const toneMatch = syllable.match(/([a-züA-ZÜ]+)([1-5])$/);
    if (!toneMatch) return syllable;

    const base = toneMatch[1];
    const tone = parseInt(toneMatch[2]);

    // If tone 5 (neutral), return as is
    if (tone === 5) return base;

    // Find the vowel to apply the tone mark
    const vowels = ['a', 'o', 'e', 'i', 'u', 'ü'];
    const toneMarks = [
      ['ā', 'ō', 'ē', 'ī', 'ū', 'ǖ'], // 1st tone
      ['á', 'ó', 'é', 'í', 'ú', 'ǘ'], // 2nd tone
      ['ǎ', 'ǒ', 'ě', 'ǐ', 'ǔ', 'ǚ'], // 3rd tone
      ['à', 'ò', 'è', 'ì', 'ù', 'ǜ'], // 4th tone
    ];

    // Find the vowel with highest priority (a > o > e > i > u > ü)
    // Rule: if both 'i' and 'u' are present, the second one gets the mark (Anki/standard rule)
    let vowelIndex = -1;
    let vowelPos = -1;

    const lowerBase = base.toLowerCase();
    
    // Check for 'a', 'o', 'e' first (priority 1, 2, 3)
    for (let i = 0; i < 3; i++) {
      const pos = lowerBase.indexOf(vowels[i]);
      if (pos !== -1) {
        vowelIndex = i;
        vowelPos = pos;
        break;
      }
    }

    // If no 'a', 'o', 'e', check for 'iu' or 'ui'
    if (vowelIndex === -1) {
      const iuPos = lowerBase.indexOf('iu');
      const uiPos = lowerBase.indexOf('ui');
      if (iuPos !== -1) {
        vowelIndex = 4; // 'u'
        vowelPos = iuPos + 1;
      } else if (uiPos !== -1) {
        vowelIndex = 3; // 'i'
        vowelPos = uiPos + 1;
      } else {
        // Just find the first vowel from 'i', 'u', 'ü'
        for (let i = 3; i < vowels.length; i++) {
          const pos = lowerBase.indexOf(vowels[i]);
          if (pos !== -1) {
            vowelIndex = i;
            vowelPos = pos;
            break;
          }
        }
      }
    }

    if (vowelIndex === -1) return syllable;

    // Replace the vowel with the toned version
    const beforeVowel = base.substring(0, vowelPos);
    const afterVowel = base.substring(vowelPos + 1);
    const tonedVowel = toneMarks[tone - 1][vowelIndex];

    // Preserve case
    const finalVowel = base[vowelPos] === base[vowelPos].toUpperCase() 
      ? tonedVowel.toUpperCase() 
      : tonedVowel;

    return beforeVowel + finalVowel + afterVowel;
  });

  return convertedSyllables.join(' ');
}

/**
 * Speaks text using Web Speech API
 * @param text - Text to speak
 * @param lang - Language code (e.g., 'zh-CN' for Chinese)
 * @param options - Additional speech options
 */
export function speakText(text: string, lang: string = 'zh-CN', options: SpeechSynthesisUtteranceOptions = {}): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Text-to-speech not supported in this browser');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Set language
  utterance.lang = lang;

  // Apply additional options
  if (options.rate !== undefined) utterance.rate = options.rate;
  if (options.pitch !== undefined) utterance.pitch = options.pitch;
  if (options.volume !== undefined) utterance.volume = options.volume;

  // Default settings for better Chinese pronunciation
  utterance.rate = options.rate ?? 0.8; // Slightly slower for clarity
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = options.volume ?? 1.0;

  window.speechSynthesis.speak(utterance);
}

/**
 * Checks if text-to-speech is supported for a given language
 * @param lang - Language code
 * @returns boolean indicating if TTS is supported
 */
export function isTextToSpeechSupported(lang: string = 'zh-CN'): boolean {
  if (!('speechSynthesis' in window)) {
    return false;
  }

  const voices = window.speechSynthesis.getVoices();
  return voices.some(voice => voice.lang.startsWith(lang.split('-')[0]));
}

/**
 * Gets available voices for a language
 * @param lang - Language code
 * @returns Array of available voices
 */
export function getVoicesForLanguage(lang: string = 'zh-CN'): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) {
    return [];
  }

  const voices = window.speechSynthesis.getVoices();
  return voices.filter(voice => voice.lang.startsWith(lang.split('-')[0]));
}

interface SpeechSynthesisUtteranceOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}
