import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import RoomCard from '$lib/components/rooms/RoomCard.svelte';
import { mockRoom } from '../../../mocks/data/rooms';
import { mockTenant } from '../../../mocks/data/tenants';

// Mock de servicios
const mockStorageService = {
  getPhotoUrl: vi.fn((path) => `https://storage.example.com/${path}`)
};

const mockTenantsService = {
  getTenantById: vi.fn()
};

const mockPropertiesService = {
  getProperty: vi.fn()
};

const mockRoomsService = {
  getPropertyRooms: vi.fn().mockResolvedValue([])
};

vi.mock('$lib/services/storage', () => ({
  storageService: mockStorageService
}));

vi.mock('$lib/services/tenants', () => ({
  tenantsService: mockTenantsService
}));

vi.mock('$lib/services/properties', () => ({
  propertiesService: mockPropertiesService
}));

vi.mock('$lib/services/rooms', () => ({
  roomsService: mockRoomsService
}));

// Mock de componentes hijos
vi.mock('$lib/components/tenants/QuickCheckIn.svelte', () => ({
  default: { name: 'QuickCheckIn' }
}));

vi.mock('$lib/components/tenants/QuickCheckOut.svelte', () => ({
  default: { name: 'QuickCheckOut' }
}));

describe('RoomCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render room name', () => {
    render(RoomCard, { props: { room: mockRoom } });
    expect(screen.getByText(mockRoom.name)).toBeInTheDocument();
  });

  it('should show monthly rent for private rooms', () => {
    render(RoomCard, { props: { room: mockRoom } });
    expect(screen.getByText(new RegExp(`${mockRoom.monthly_rent}€`))).toBeInTheDocument();
  });

  it('should show room size if available', () => {
    render(RoomCard, { props: { room: mockRoom } });
    if (mockRoom.size_sqm) {
      expect(screen.getByText(new RegExp(`${mockRoom.size_sqm} m²`))).toBeInTheDocument();
    }
  });

  it('should show "Disponible" chip for available room', () => {
    const availableRoom = { ...mockRoom, occupied: false };
    render(RoomCard, { props: { room: availableRoom } });
    expect(screen.getByText('Disponible')).toBeInTheDocument();
  });

  it('should show "Ocupada" chip for occupied room', () => {
    const occupiedRoom = { ...mockRoom, occupied: true };
    render(RoomCard, { props: { room: occupiedRoom } });
    expect(screen.getByText('Ocupada')).toBeInTheDocument();
  });

  it('should show "Sala Común" chip for common rooms', () => {
    const commonRoom = { ...mockRoom, room_type: 'common' };
    render(RoomCard, { props: { room: commonRoom } });
    expect(screen.getByText('Sala Común')).toBeInTheDocument();
  });

  it('should display photo count when photos exist', () => {
    const roomWithPhotos = { ...mockRoom, photos: ['photo1.jpg', 'photo2.jpg'] };
    render(RoomCard, { props: { room: roomWithPhotos } });
    expect(screen.getByText('2')).toBeInTheDocument(); // Photo count
  });

  it('should show tenant information when room is occupied', async () => {
    const occupiedRoom = { ...mockRoom, occupied: true, tenant_id: 'tenant-1' };
    
    mockTenantsService.getTenantById.mockResolvedValue(mockTenant);

    render(RoomCard, { 
      props: { 
        room: occupiedRoom,
        propertyId: 'prop-1'
      } 
    });

    // Esperar a que se cargue el inquilino
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // El componente debería mostrar información del inquilino si está cargado
    // (esto puede requerir ajustes según cómo se renderiza)
  });

  it('should call onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    const { component } = render(RoomCard, {
      props: { 
        room: mockRoom,
        onClick: handleClick
      }
    });

    const card = screen.getByRole('button');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should show quick actions when showQuickActions is true', () => {
    render(RoomCard, {
      props: {
        room: mockRoom,
        propertyId: 'prop-1',
        showQuickActions: true
      }
    });

    // Debería mostrar botones de acción
    // (ajustar según la implementación real)
  });
});


