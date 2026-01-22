<script>
  /** @type {'default' | 'success' | 'warning' | 'error' | 'info'} */
  export let variant = "default";
  /** @type {'sm' | 'md' | 'lg'} */
  export let size = "md";
  /** @type {boolean} */
  export let pill = false;
  /** @type {string} */
  export let className = "";
</script>

<span
  class="badge badge--{variant} badge--{size} {className}"
  class:badge--pill={pill}
>
  <slot />
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    border-radius: 0.5rem;
    white-space: nowrap;
  }

  /* Sizes */
  .badge--sm {
    height: 20px;
    padding: 0 0.5rem;
    font-size: 0.75rem;
  }

  .badge--md {
    height: 24px;
    padding: 0 0.75rem;
    font-size: 0.875rem;
  }

  .badge--lg {
    height: 28px;
    padding: 0 1rem;
    font-size: 1rem;
  }

  .badge--pill {
    border-radius: 9999px;
  }

  /* Variants */
  .badge--default {
    background: #f3f4f6;
    color: #374151;
  }

  .badge--success {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .badge--warning {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  .badge--error {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .badge--info {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  @media (prefers-color-scheme: dark) {
    .badge--default {
      background: #1f2937;
      color: #d1d5db;
    }
  }
</style>
