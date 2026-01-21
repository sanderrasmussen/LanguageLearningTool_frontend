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
    const toneMatch = syllable.match(/([a-zü]+)([1-5])$/);
    if (!toneMatch) return syllable;

    const base = toneMatch[1];
    const tone = parseInt(toneMatch[2]);

    // If tone 5 (neutral), return as is
    if (tone === 5) return base;

    // Find the vowel to apply the tone mark
    const vowels = ['a', 'e', 'i', 'o', 'u', 'ü'];
    const toneMarks = [
      ['ā', 'ē', 'ī', 'ō', 'ū', 'ǖ'], // 1st tone
      ['á', 'é', 'í', 'ó', 'ú', 'ǘ'], // 2nd tone
      ['ǎ', 'ě', 'ǐ', 'ǒ', 'ǔ', 'ǚ'], // 3rd tone
      ['à', 'è', 'ì', 'ò', 'ù', 'ǜ'], // 4th tone
    ];

    // Find the last vowel (priority: a > e > i > o > u > ü)
    let vowelIndex = -1;
    let vowelPos = -1;

    for (let i = vowels.length - 1; i >= 0; i--) {
      const pos = base.lastIndexOf(vowels[i]);
      if (pos !== -1) {
        vowelIndex = i;
        vowelPos = pos;
        break;
      }
    }

    if (vowelIndex === -1) return syllable;

    // Replace the vowel with the toned version
    const beforeVowel = base.substring(0, vowelPos);
    const afterVowel = base.substring(vowelPos + 1);
    const tonedVowel = toneMarks[tone - 1][vowelIndex];

    return beforeVowel + tonedVowel + afterVowel;
  });

  return convertedSyllables.join(' ');
}
