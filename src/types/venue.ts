export type TicketStatus = 'Pending' | 'Checked-In';

export type TicketCategory = 'VIP' | 'General Admission' | 'Backstage' | 'Artist' | 'Press' | 'Staff';

export interface ScanAttemptRecord {
  timestamp: string;
  scanner: string;
  gate: string;
}

export interface Guest {
  id: string; // Internal ID
  name: string;
  ticketId: string; // The QR code payload / barcode value
  category: TicketCategory;
  tableOrSeat?: string;
  notes?: string;
  status: TicketStatus;
  checkedInTime?: string | null;
  checkedInBy?: string | null;
  checkedInGate?: string | null;
  scanCount: number; // 0 = never scanned, 1 = valid entry, 2+ = duplicate re-scan attempts
  deniedAttempts?: ScanAttemptRecord[];
  email?: string;
  phone?: string;
}

// 10 distinct venue roles
export type StaffRole =
  | 'super_admin'
  | 'volunteers'
  | 'security'
  | 'media_and_press'
  | 'marketing'
  | 'hr'
  | 'ceremony_director'
  | 'pr'
  | 'secretary'
  | 'doc_department';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: StaffRole;
  accessKey: string;
  assignedGate: string;
  ticketId?: string; // Scannable QR code ticket ID for staff pass
  canScan: boolean;
  canManualCheckIn: boolean;
  canRevokeCheckIn: boolean;
  canManageStaff: boolean;
  canExportData: boolean;
  isActive: boolean;
  lastActiveTime?: string;
}

/**
 * Checks if the role has authorization to scan QR codes and access venue management.
 * Strictly restricted to Security and Admins (Super Admin and Ceremony Director).
 */
export function isScannerOrAdminRole(role?: StaffRole | null): boolean {
  if (!role) return false;
  return role === 'security' || role === 'super_admin' || role === 'ceremony_director';
}

export interface ScanResult {
  type: 'SUCCESS' | 'ALREADY_CHECKED_IN' | 'INVALID_TICKET' | 'REVOKED';
  guest?: Guest;
  scannedCode: string;
  timestamp: string;
  message: string;
  attemptNumber?: number;
  duplicateAttemptsCount?: number;
  previousCheckIn?: {
    time: string;
    scanner: string;
    gate?: string;
  };
}

export interface VenueSettings {
  venueName: string;
  totalCapacity: number;
  currentEventName: string;
  eventDate: string;
  warningCapacityPercentage: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoResetScanDelayMs: number;
  strictAntiPassback: boolean; // Strictly locks out re-scanned QR codes
}

export interface CheckInLogEntry {
  id: string;
  ticketId: string;
  guestName: string;
  category: TicketCategory;
  gate: string;
  scannerName: string;
  timestamp: string;
  type: 'CHECK_IN' | 'UNDO_CHECK_IN' | 'DENIED_ATTEMPT' | 'SECURITY_FLAG';
  reason?: string;
  attemptCount?: number;
}

export const ROLE_LABELS: Record<StaffRole, { title: string; badge: string; description: string; canScan: boolean }> = {
  super_admin: {
    title: 'Super Admin',
    badge: 'Executive Admin',
    description: 'Full master venue authority. High-speed camera scanner & door control.',
    canScan: true,
  },
  ceremony_director: {
    title: 'Ceremony Director',
    badge: 'Director Admin',
    description: 'Executive stage & door protocol. High-speed camera scanner access.',
    canScan: true,
  },
  security: {
    title: 'Security',
    badge: 'Door Enforcement',
    description: 'Active camera scanner, duplicate scan enforcement, and perimeter policing.',
    canScan: true,
  },
  volunteers: {
    title: 'Volunteers',
    badge: 'Staff Pass',
    description: 'Personal Staff QR Pass screen. Verified at gate entrance by Security.',
    canScan: false,
  },
  media_and_press: {
    title: 'Media & Press',
    badge: 'Press Pass',
    description: 'Personal Accreditation QR Pass screen. Verified at gate entrance by Security.',
    canScan: false,
  },
  pr: {
    title: 'Public Relations (PR)',
    badge: 'VIP Liaison Pass',
    description: 'Personal VIP Liaison QR Pass screen. Verified at gate entrance by Security.',
    canScan: false,
  },
  marketing: {
    title: 'Marketing',
    badge: 'Staff Pass',
    description: 'Personal Staff QR Pass screen. Verified at gate entrance by Security.',
    canScan: false,
  },
  hr: {
    title: 'HR (Human Resources)',
    badge: 'Personnel Pass',
    description: 'Personal Staff QR Pass screen. Verified at gate entrance by Security.',
    canScan: false,
  },
  secretary: {
    title: 'Secretary',
    badge: 'Staff Pass',
    description: 'Personal Secretariat QR Pass screen. Verified at gate entrance by Security.',
    canScan: false,
  },
  doc_department: {
    title: 'Documentation Department',
    badge: 'Staff Pass',
    description: 'Personal Documentation QR Pass screen. Verified at gate entrance by Security.',
    canScan: false,
  },
};
