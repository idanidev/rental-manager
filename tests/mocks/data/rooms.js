/**
 * Datos mock de habitaciones para testing
 */
export const mockRooms = [
  {
    id: 'room-1',
    property_id: 'prop-1',
    name: 'Habitación 101',
    room_type: 'private',
    monthly_rent: 500,
    size_sqm: 20,
    occupied: false,
    tenant_id: null,
    photos: [],
    inventory: [],
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-2',
    property_id: 'prop-1',
    name: 'Habitación 102',
    room_type: 'private',
    monthly_rent: 550,
    size_sqm: 22,
    occupied: true,
    tenant_id: 'tenant-1',
    photos: ['photo1.jpg'],
    inventory: [
      { name: 'Cama', quantity: 1, condition: 'bueno' }
    ],
    notes: 'Habitación con balcón',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-3',
    property_id: 'prop-1',
    name: 'Cocina',
    room_type: 'common',
    monthly_rent: null,
    size_sqm: 15,
    occupied: false,
    tenant_id: null,
    photos: [],
    inventory: [],
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockRoom = mockRooms[0];


