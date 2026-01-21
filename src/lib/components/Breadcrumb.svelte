<script lang="ts">
  export interface BreadcrumbItem {
    label: string;
    href?: string;
    current?: boolean;
  }

  interface Props {
    items: BreadcrumbItem[];
  }

  let { items }: Props = $props();
</script>

<nav class="flex mb-6" aria-label="Breadcrumb">
  <ol class="inline-flex items-center space-x-1 md:space-x-3">
    {#each items as item, index}
      <li class="inline-flex items-center">
        {#if index > 0}
          <svg class="w-3 h-3 text-gray-400 dark:text-gray-500 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        {/if}

        {#if item.href && !item.current}
          <a
            href={item.href}
            class="inline-flex items-center text-sm font-medium text-gray-900 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {item.label}
          </a>
        {:else}
          <span class="text-sm font-medium text-gray-700 dark:text-gray-400" class:text-gray-900={item.current} class:dark:text-gray-200={item.current}>
            {item.label}
          </span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
