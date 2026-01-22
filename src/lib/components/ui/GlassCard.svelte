<script>
  /** @type {'none' | 'sm' | 'default' | 'lg' | 'xl'} */
  export let padding = "default";
  /** @type {boolean} */
  export let hover = false;
  /** @type {boolean} */
  export let interactive = false;
  /** @type {boolean} */
  export let glow = false;
  /** @type {string} */
  export let className = "";

  const paddingClasses = {
    none: "",
    sm: "p-3",
    default: "p-4",
    lg: "p-6",
    xl: "p-8",
  };
</script>

<div
  class="
    glass-card
    {paddingClasses[padding]} 
    {className}
  "
  class:glass-card--hover={hover}
  class:glass-card--interactive={interactive}
  class:glass-card--glow={glow}
  role={interactive ? "button" : undefined}
  tabindex={interactive ? 0 : undefined}
  on:click
  on:keydown
>
  <slot />
</div>

<style>
  .glass-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      inset 0 -1px 0 rgba(255, 255, 255, 0.1);
    border-radius: 1.5rem;
    transition: all 250ms cubic-bezier(0.19, 1, 0.22, 1);
    position: relative;
    overflow: hidden;
  }

  .glass-card--hover:hover {
    background: rgba(255, 255, 255, 0.95);
    transform: translateY(-2px);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.12),
      0 6px 16px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  .glass-card--interactive {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .glass-card--interactive:active {
    transform: scale(0.98);
  }

  .glass-card--interactive:focus-visible {
    outline: 3px solid #f97316;
    outline-offset: 2px;
  }

  .glass-card--glow::before {
    content: "";
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, #f97316 0%, #ec4899 100%);
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 250ms ease-out;
    pointer-events: none;
  }

  .glass-card--glow:hover::before {
    opacity: 1;
  }

  :global(.dark) .glass-card {
    background: rgba(31, 41, 55, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      inset 0 -1px 0 rgba(255, 255, 255, 0.03);
  }

  :global(.dark) .glass-card--hover:hover {
    background: rgba(55, 65, 81, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    .glass-card {
      transition: none;
    }

    .glass-card--hover:hover,
    .glass-card--interactive:active {
      transform: none;
    }
  }
</style>
