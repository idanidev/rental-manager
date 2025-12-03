import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Modal from '$lib/components/ui/Modal.svelte';

describe('Modal Component', () => {
  beforeEach(() => {
    // Limpiar body antes de cada test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Limpiar body después de cada test
    document.body.innerHTML = '';
  });

  it('should not render when open is false', () => {
    const { container } = render(Modal, { 
      props: { open: false, title: 'Test Modal' } 
    });
    
    expect(container.querySelector('.modal-backdrop')).not.toBeInTheDocument();
  });

  it('should render when open is true', () => {
    render(Modal, { 
      props: { open: true, title: 'Test Modal' } 
    });
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('should render title correctly', () => {
    render(Modal, { 
      props: { open: true, title: 'My Modal Title' } 
    });
    
    expect(screen.getByText('My Modal Title')).toBeInTheDocument();
  });

  it('should render modal structure correctly', () => {
    render(Modal, { props: { open: true, title: 'Test' } });
    const modalContent = document.querySelector('.modal-content');
    expect(modalContent).toBeInTheDocument();
  });

  it('should apply size classes correctly', () => {
    render(Modal, { 
      props: { open: true, title: 'Test', size: 'xl' } 
    });
    
    const modalContent = document.querySelector('.modal-content');
    expect(modalContent?.className).toContain('max-w-4xl');
  });

  it('should close when close button is clicked', async () => {
    const user = userEvent.setup();
    let isOpen = true;
    
    const { component } = render(Modal, {
      props: { 
        open: isOpen,
        title: 'Test Modal'
      }
    });

    component.$on('open', (event) => {
      isOpen = event.detail.value;
    });

    const closeButton = screen.getByLabelText('Cerrar');
    await user.click(closeButton);

    // El modal debería estar cerrado
    expect(document.querySelector('.modal-backdrop')).not.toBeInTheDocument();
  });
});

