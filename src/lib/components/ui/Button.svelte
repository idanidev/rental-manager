<script>
  import { createEventDispatcher } from "svelte";

  /** @type {'primary' | 'secondary' | 'ghost' | 'danger' | 'success'} */
  export let variant = "primary";
  /** @type {'sm' | 'md' | 'lg' | 'xl'} */
  export let size = "md";
  /** @type {boolean} */
  export let fullWidth = false;
  /** @type {boolean} */
  export let disabled = false;
  /** @type {boolean} */
  export let loading = false;
  /** @type {any} */
  export let icon = null;
  /** @type {any} */
  export let iconRight = null;
  /** @type {string | null} */
  export let href = null;
  /** @type {'button' | 'submit' | 'reset'} */
  export let type = "button";
  /** @type {string} */
  export let className = "";

  const dispatch = createEventDispatcher();

  /** @param {MouseEvent} e */
  function handleClick(e) {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    dispatch("click", e);
  }

  $: component = href ? "a" : "button";

  const sizeClasses = {
    sm: "h-9 px-3 text-sm gap-1.5",
    md: "h-11 px-4 text-base gap-2",
    lg: "h-13 px-6 text-lg gap-2",
    xl: "h-15 px-8 text-xl gap-3",
  };

  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger",
    success: "btn-success",
  };
</script>

<svelte:element
  this={component}
  {href}
  type={href ? undefined : type}
  class="
    btn
    {sizeClasses[size]}
    {variantClasses[variant]}
    {fullWidth ? 'w-full' : ''}
    {className}
  "
  class:btn--loading={loading}
  {disabled}
  on:click={handleClick}
>
  {#if loading}
    <span class="btn__loader"></span>
  {/if}

  {#if icon && !loading}
    <span class="btn__icon">
      <svelte:component this={icon} size={size === "sm" ? 16 : 18} />
    </span>
  {/if}

  <span class="btn__content" class:opacity-0={loading}>
    <slot />
  </span>

  {#if iconRight && !loading}
    <span class="btn__icon">
      <svelte:component this={iconRight} size={size === "sm" ? 16 : 18} />
    </span>
  {/if}
</svelte:element>

<style>
  .btn {
    appearance: none;
    border: none;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: inherit;
    font-weight: 600;
    letter-spacing: 0.025em;
    line-height: 1;
    white-space: nowrap;
    border-radius: 1rem;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    position: relative;
    overflow: hidden;
    transition: all 250ms cubic-bezier(0.19, 1, 0.22, 1);
    touch-action: manipulation;
  }

  .btn:focus-visible {
    outline: 3px solid #f97316;
    outline-offset: 2px;
  }

  .btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  /* Primary */
  .btn-primary {
    background: linear-gradient(135deg, #f97316 0%, #ec4899 100%);
    color: white;
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.04),
      0 2px 4px rgba(0, 0, 0, 0.03);
  }

  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #ea580c 0%, #db2777 100%);
    box-shadow:
      0 10px 24px rgba(0, 0, 0, 0.08),
      0 6px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  /* Secondary */
  .btn-secondary {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    color: #111827;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.95);
    transform: translateY(-2px);
    box-shadow:
      0 10px 24px rgba(0, 0, 0, 0.08),
      0 6px 12px rgba(0, 0, 0, 0.05);
  }

  /* Ghost */
  .btn-ghost {
    background: transparent;
    color: #374151;
  }

  .btn-ghost:hover:not(:disabled) {
    background: #f3f4f6;
  }

  /* Danger */
  .btn-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }

  .btn-danger:hover:not(:disabled) {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    box-shadow:
      0 10px 24px rgba(0, 0, 0, 0.08),
      0 6px 12px rgba(0, 0, 0, 0.05);
  }

  /* Success */
  .btn-success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .btn-success:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    box-shadow:
      0 10px 24px rgba(0, 0, 0, 0.08),
      0 6px 12px rgba(0, 0, 0, 0.05);
  }

  /* Loading */
  .btn--loading {
    pointer-events: none;
  }

  .btn__loader {
    position: absolute;
    width: 18px;
    height: 18px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .btn__icon {
    display: inline-flex;
    flex-shrink: 0;
  }

  @media (prefers-color-scheme: dark) {
    .btn-secondary {
      background: rgba(31, 41, 55, 0.85);
      color: #f3f4f6;
      border-color: rgba(255, 255, 255, 0.1);
    }

    .btn-ghost {
      color: #d1d5db;
    }

    .btn-ghost:hover:not(:disabled) {
      background: #1f2937;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .btn,
    .btn__loader {
      animation: none;
      transition: none;
    }

    .btn:active:not(:disabled),
    .btn:hover:not(:disabled) {
      transform: none;
    }
  }
</style>
