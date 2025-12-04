/**
 * Tipos TypeScript para Rental Manager
 * Definiciones de tipos basadas en el schema de la base de datos
 */

// =====================================================
// TIPOS BASE
// =====================================================

export type UUID = string;
export type DateString = string; // ISO date string

// =====================================================
// PROPERTY (Propiedad)
// =====================================================

export interface Property {
  id: UUID;
  name: string;
  address: string;
  description?: string | null;
  owner_id: UUID;
  created_at: DateString;
  updated_at: DateString;
  rooms?: Room[];
}

// =====================================================
// ROOM (Habitación)
// =====================================================

export interface Room {
  id: UUID;
  property_id: UUID;
  name: string;
  room_type: 'private' | 'common';
  monthly_rent?: number | null;
  size_sqm?: number | null;
  occupied: boolean;
  tenant_id?: UUID | null;
  tenant_name?: string | null; // Deprecated, usar tenant_id
  photos?: string[];
  inventory?: InventoryItem[];
  notes?: string | null;
  deposit_amount?: number | null;
  created_at: DateString;
  updated_at: DateString;
}

export interface InventoryItem {
  name: string;
  quantity?: number;
  condition?: string;
  notes?: string;
}

// =====================================================
// TENANT (Inquilino)
// =====================================================

export interface Tenant {
  id: UUID;
  property_id: UUID;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  dni?: string | null;
  contract_start_date?: DateString | null;
  contract_months?: number | null;
  contract_end_date?: DateString | null;
  deposit_amount?: number | null;
  monthly_rent?: number | null;
  notes?: string | null;
  contract_notes?: string | null;
  active: boolean;
  current_address?: string | null;
  created_at: DateString;
  updated_at: DateString;
  room?: Room | null; // Relación opcional desde la query
}

// =====================================================
// EXPENSE (Gasto)
// =====================================================

export interface Expense {
  id: UUID;
  property_id: UUID;
  room_id?: UUID | null;
  amount: number;
  category: string;
  description?: string | null;
  date: DateString;
  created_by: UUID;
  created_at: DateString;
  updated_at: DateString;
}

// =====================================================
// INCOME (Ingreso)
// =====================================================

export interface Income {
  id: UUID;
  property_id: UUID;
  room_id: UUID;
  amount: number;
  month: DateString;
  paid: boolean;
  payment_date?: DateString | null;
  notes?: string | null;
  created_at: DateString;
  updated_at: DateString;
}

// =====================================================
// PROPERTY ACCESS (Acceso a Propiedad)
// =====================================================

export type PropertyRole = 'owner' | 'editor' | 'viewer';

export interface PropertyAccess {
  id: UUID;
  property_id: UUID;
  user_id: UUID;
  role: PropertyRole;
  created_at: DateString;
}

// =====================================================
// INVITATION (Invitación)
// =====================================================

export interface Invitation {
  id: UUID;
  property_id: UUID;
  email: string;
  role: PropertyRole;
  invited_by: UUID;
  accepted: boolean;
  accepted_at?: DateString | null;
  created_at: DateString;
  expires_at?: DateString | null;
}

// =====================================================
// NOTIFICATION (Notificación)
// =====================================================

export interface Notification {
  id: string;
  tenantId: UUID;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  roomName: string;
  propertyId: UUID;
  propertyName: string;
  contractEndDate: DateString;
  daysUntilExpiry: number;
  urgency: 'high' | 'medium' | 'low';
  daysExpired?: number;
}

// =====================================================
// FORM DATA TYPES
// =====================================================

export interface RoomFormData {
  property_id: UUID;
  name: string;
  room_type: 'private' | 'common';
  monthly_rent?: number | string | null;
  size_sqm?: number | string | null;
  occupied: boolean;
  tenant_id?: UUID | string | null;
  inventory?: InventoryItem[];
  photos?: string[];
  notes?: string | null;
}

export interface TenantFormData {
  property_id: UUID;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  dni?: string | null;
  contract_start_date?: DateString | null;
  contract_months?: number | null;
  deposit_amount?: number | null;
  monthly_rent?: number | null;
  notes?: string | null;
  contract_notes?: string | null;
  active?: boolean;
}

// =====================================================
// EVENT HANDLERS
// =====================================================

export type ClickHandler = (e: MouseEvent | KeyboardEvent) => void;
export type NullableClickHandler = ClickHandler | null | undefined;


