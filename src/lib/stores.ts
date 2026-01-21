import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

// Custom dark mode store with persistence and safe browser-only behavior.
// Stores a boolean: true = dark, false = light. If no explicit user preference
// is stored, follows system `prefers-color-scheme` and reacts to changes.
const internal = writable(false);

let userPreference: 'dark' | 'light' | null = null;

export const darkMode = {
  subscribe: internal.subscribe,
  set(value: boolean, { save = true } = {}) {
    if (!browser) return internal.set(value);
    if (save) {
      localStorage.setItem('theme', value ? 'dark' : 'light');
      userPreference = value ? 'dark' : 'light';
    }
    internal.set(value);
  },
  update(fn: (v: boolean) => boolean, opts?: { save?: boolean }) {
    const newVal = fn(get(internal));
    this.set(newVal, opts);
  },
  // Remove explicit preference and follow system again
  clearPreference() {
    if (!browser) return;
    localStorage.removeItem('theme');
    userPreference = null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    internal.set(systemPrefersDark);
  }
};

if (browser) {
  const stored = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (stored === 'dark') {
    userPreference = 'dark';
    internal.set(true);
  } else if (stored === 'light') {
    userPreference = 'light';
    internal.set(false);
  } else {
    userPreference = null;
    internal.set(systemPrefersDark);
  }

  // Apply DOM class when theme changes
  internal.subscribe((isDark) => {
    document.documentElement.classList.toggle('dark', isDark);
  });

  // If user has no explicit preference, respond to system changes
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const mqHandler = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      internal.set(e.matches);
    }
  };
  mq.addEventListener('change', mqHandler);
}
