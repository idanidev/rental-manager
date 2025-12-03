/**
 * Datos mock de inquilinos para testing
 */
export const mockTenants = [
  {
    id: 'tenant-1',
    property_id: 'prop-1',
    full_name: 'Juan Pérez',
    email: 'juan.perez@example.com',
    phone: '+34 600 123 456',
    dni: '12345678A',
    contract_start_date: '2024-01-01',
    contract_months: 12,
    contract_end_date: '2024-12-31',
    deposit_amount: 500,
    monthly_rent: 550,
    notes: 'Inquilino responsable',
    contract_notes: 'Contrato estándar',
    active: true,
    current_address: 'Calle Mayor 123, Habitación 102',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    room: {
      id: 'room-2',
      name: 'Habitación 102',
      monthly_rent: 550
    }
  },
  {
    id: 'tenant-2',
    property_id: 'prop-1',
    full_name: 'María García',
    email: 'maria.garcia@example.com',
    phone: '+34 600 789 012',
    dni: '87654321B',
    contract_start_date: '2024-02-01',
    contract_months: 6,
    contract_end_date: '2024-07-31',
    deposit_amount: 300,
    monthly_rent: 500,
    notes: null,
    contract_notes: null,
    active: true,
    current_address: null,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
    room: null
  }
];

export const mockTenant = mockTenants[0];

