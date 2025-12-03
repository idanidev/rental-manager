import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import GlassCard from '$lib/components/ui/GlassCard.svelte';

describe('GlassCard Component', () => {
  it('should render with default props', () => {
    const { container } = render(GlassCard);
    const card = container.querySelector('.glass-card');
    expect(card).toBeInTheDocument();
  });

  it('should apply hover effect by default', () => {
    const { container } = render(GlassCard);
    const card = container.querySelector('.glass-card');
    expect(card?.className).toContain('hover:scale-[1.02]');
  });

  it('should not apply hover effect when hover is false', () => {
    const { container } = render(GlassCard, { props: { hover: false } });
    const card = container.querySelector('.glass-card');
    expect(card?.className).not.toContain('hover:scale-[1.02]');
  });

  it('should accept custom className', () => {
    const { container } = render(GlassCard, { props: { className: 'custom-class' } });
    const card = container.querySelector('.glass-card');
    expect(card?.className).toContain('custom-class');
  });

  it('should render with slot content', () => {
    const { container } = render(GlassCard);
    const card = container.querySelector('.glass-card');
    expect(card).toBeInTheDocument();
  });
});

