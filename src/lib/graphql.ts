import { createClient } from '@urql/svelte';
import { cacheExchange, fetchExchange } from '@urql/core';

const url = 'http://localhost:8080/graphql';

export const client = createClient({
  url,
  exchanges: [
    cacheExchange,
    fetchExchange,
  ],
  fetchOptions: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    return {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        'Content-Type': 'application/json',
      },
    };
  },
});
