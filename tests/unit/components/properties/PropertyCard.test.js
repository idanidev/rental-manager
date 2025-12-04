import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PropertyCard from '$lib/components/properties/PropertyCard.svelte';
import { mockProperty, mockProperties } from '../../../mocks/data/properties';
import { mockRooms } from '../../../mocks/data/rooms';

// Mock de navegación
const mockGoto = vi.fn();
vi.mock('$app/navigation', () => ({
  goto: mockGoto
}));

describe('PropertyCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render property name', () => {
    const propertyWithRooms = {
      ...mockProperty,
      rooms: mockRooms,
      property_access: [{ role: 'owner' }]
    };

    render(PropertyCard, { props: { property: propertyWithRooms } });
    expect(screen.getByText(mockProperty.name)).toBeInTheDocument();
  });

  it('should render property address', () => {
    const propertyWithRooms = {
      ...mockProperty,
      rooms: mockRooms,
      property_access: [{ role: 'owner' }]
    };

    render(PropertyCard, { props: { property: propertyWithRooms } });
    expect(screen.getByText(mockProperty.address)).toBeInTheDocument();
  });

  it('should show room occupancy stats', () => {
    const propertyWithRooms = {
      ...mockProperty,
      rooms: mockRooms,
      property_access: [{ role: 'owner' }]
    };

    render(PropertyCard, { props: { property: propertyWithRooms } });
    
    // Verificar que muestra estadísticas
    const privateRooms = mockRooms.filter(r => r.room_type !== 'common');
    const occupiedRooms = privateRooms.filter(r => r.occupied).length;
    
    expect(screen.getByText(new RegExp(`${occupiedRooms}/${privateRooms.length}`))).toBeInTheDocument();
  });

  it('should show role badge for owner', () => {
    const propertyWithRooms = {
      ...mockProperty,
      rooms: mockRooms,
      property_access: [{ role: 'owner' }]
    };

    render(PropertyCard, { props: { property: propertyWithRooms } });
    expect(screen.getByText('Propietario')).toBeInTheDocument();
  });

  it('should show role badge for editor', () => {
    const propertyWithRooms = {
      ...mockProperty,
      rooms: mockRooms,
      property_access: [{ role: 'editor' }]
    };

    render(PropertyCard, { props: { property: propertyWithRooms } });
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('should navigate to property page on click', async () => {
    const propertyWithRooms = {
      ...mockProperty,
      rooms: mockRooms,
      property_access: [{ role: 'owner' }]
    };

    const { component } = render(PropertyCard, { props: { property: propertyWithRooms } });

    const card = screen.getByRole('button');
    card.click();

    // Verificar que se llamó a goto
    expect(mockGoto).toHaveBeenCalledWith(`/properties/${mockProperty.id}`);
  });

  it('should calculate occupancy rate correctly', () => {
    const propertyWithRooms = {
      ...mockProperty,
      rooms: mockRooms,
      property_access: [{ role: 'owner' }]
    };

    render(PropertyCard, { props: { property: propertyWithRooms } });
    
    // Verificar que muestra el porcentaje de ocupación
    const privateRooms = mockRooms.filter(r => r.room_type !== 'common');
    const occupiedRooms = privateRooms.filter(r => r.occupied).length;
    const expectedRate = privateRooms.length > 0 
      ? Math.round((occupiedRooms / privateRooms.length) * 100) 
      : 0;

    expect(screen.getByText(new RegExp(`${expectedRate}%`))).toBeInTheDocument();
  });
});



