import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Button from '$lib/components/ui/Button.svelte';

describe('Button Component', () => {
  it('should render button', () => {
    const { container } = render(Button);
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('should apply primary variant by default', () => {
    const { container } = render(Button);
    const button = container.querySelector('button');
    expect(button.className).toContain('btn-primary');
  });

  it('should apply secondary variant', () => {
    const { container } = render(Button, { props: { variant: 'secondary' } });
    const button = container.querySelector('button');
    expect(button.className).toContain('btn-secondary');
  });

  it('should apply ghost variant', () => {
    const { container } = render(Button, { props: { variant: 'ghost' } });
    const button = container.querySelector('button');
    expect(button.className).toContain('hover:bg-white/20');
  });

  it('should be disabled when disabled prop is true', () => {
    const { container } = render(Button, { props: { disabled: true } });
    const button = container.querySelector('button');
    expect(button.disabled).toBe(true);
    expect(button.className).toContain('disabled:opacity-50');
  });

  it('should call onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    const { component } = render(Button);
    component.$on('click', handleClick);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should have full width when fullWidth prop is true', () => {
    const { container } = render(Button, { props: { fullWidth: true } });
    const button = container.querySelector('button');
    expect(button.className).toContain('w-full');
  });

  it('should accept custom className', () => {
    const { container } = render(Button, { props: { className: 'custom-class' } });
    const button = container.querySelector('button');
    expect(button.className).toContain('custom-class');
  });
});

