export type TicketStatus = 'Pending' | 'Checked-In' | 'Left';

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
  role?: string; // Specific designated role written for this person (e.g., 'Lead Designer', 'Security', 'IT Specialist')
  tableOrSeat?: string;
  notes?: string;
  status: TicketStatus;
  checkedInTime?: string | null;
  checkedInBy?: string | null;
  checkedInGate?: string | null;
  lastExitedTime?: string | null;
  lastExitedBy?: string | null;
  scanCount: number; // 0 = never scanned, 1+ = scans
  deniedAttempts?: ScanAttemptRecord[];
  email?: string;
  phone?: string;
}

// Distinct venue roles for MUN Venue
export type StaffRole =
  | 'super_admin'
  | 'executive'
  | 'security'
  | 'it'
  | 'designers'
  | 'media_and_press'
  | 'marketing'
  | 'hr'
  | 'pr'
  | 'volunteers'
  | 'logistics'
  | 'secretary'
  | 'ceremonies'
  | 'dcc'
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
 * Strictly restricted to members of Security and IT (and master Super Admin).
 */
export function isScannerOrAdminRole(role?: StaffRole | null): boolean {
  if (!role) return false;
  return role === 'security' || role === 'it' || role === 'super_admin';
}

/**
 * Checks if the user has the ability to add team members.
 * Security can add to Security; IT can add to IT; Super Admin & HR can add to all.
 */
export function canAddTeamMembers(role?: StaffRole | null): boolean {
  if (!role) return false;
  return role === 'security' || role === 'it' || role === 'super_admin' || role === 'hr';
}

export interface ScanResult {
  type: 'SUCCESS' | 'RE_ENTRY_SUCCESS' | 'ALREADY_CHECKED_IN' | 'EXIT_SUCCESS' | 'NOT_CHECKED_IN' | 'INVALID_TICKET' | 'REVOKED';
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
  strictAntiPassback: boolean; // Strictly locks out re-scanned QR codes unless person has left
}

export interface CheckInLogEntry {
  id: string;
  ticketId: string;
  guestName: string;
  category: TicketCategory;
  gate: string;
  scannerName: string;
  timestamp: string;
  type: 'CHECK_IN' | 'RE_ENTRY' | 'CHECK_OUT' | 'UNDO_CHECK_IN' | 'DENIED_ATTEMPT' | 'SECURITY_FLAG';
  reason?: string;
  attemptCount?: number;
}

export const ROLE_LABELS: Record<StaffRole, { title: string; badge: string; description: string; canScan: boolean }> = {
  super_admin: {
    title: 'Secretary General',
    badge: 'Secretary General',
    description: 'Executive Board leader. Full venue oversight, access management, and camera scanning authorization.',
    canScan: true,
  },
  executive: {
    title: 'Executive Board & Leadership',
    badge: 'Executive Pass',
    description: 'Deputy Secretary General, Under Secretary General, and Senior Advisors. Verified Executive Pass.',
    canScan: false,
  },
  security: {
    title: 'Security',
    badge: 'Security Scanner & Door Access',
    description: 'Active camera scanner, door check-in/out enforcement, and ability to add members to the Security team.',
    canScan: true,
  },
  it: {
    title: 'Admin of IT & Systems',
    badge: 'Admin of IT & Scanner',
    description: 'Active camera scanner, venue technical administration, door verification, and IT team management.',
    canScan: true,
  },
  designers: {
    title: 'Design',
    badge: 'Design Team Pass',
    description: 'Head of Design, Co-Heads, and Designers. Personal verified QR Pass for MUN Venue entrance.',
    canScan: false,
  },
  media_and_press: {
    title: 'Media & Press',
    badge: 'Media & Press Pass',
    description: 'Media heads, press heads, and press corps. Personal verified QR Pass for MUN Venue entrance.',
    canScan: false,
  },
  marketing: {
    title: 'Marketing',
    badge: 'Marketing Team Pass',
    description: 'Head of Marketing, Co-Head, and Marketing Members. Personal verified QR Pass for MUN Venue entrance.',
    canScan: false,
  },
  pr: {
    title: 'Public Relations (PR)',
    badge: 'PR Pass',
    description: 'Head of PR and external relations. Personal verified QR Pass for MUN Venue entrance.',
    canScan: false,
  },
  hr: {
    title: 'Human Resources (HR)',
    badge: 'HR Pass',
    description: 'Head of HR and delegate staffing affairs. Personal verified QR Pass for MUN Venue entrance.',
    canScan: false,
  },
  volunteers: {
    title: 'Volunteers (Vols)',
    badge: 'Volunteers Pass',
    description: 'Head of Male Vols, Head of Female Vols, and Co-Heads. Personal verified QR Pass for MUN Venue entrance.',
    canScan: false,
  },
  logistics: {
    title: 'Logistics',
    badge: 'Logistics Pass',
    description: 'Head of Logistics. Personal verified QR Pass for MUN Venue entrance.',
    canScan: false,
  },
  secretary: {
    title: 'Secretariat (Sec)',
    badge: 'Secretariat Pass',
    description: 'Head of Male Sec, Head of Female Sec, and Co-Head of Sec. Personal verified QR Pass for MUN Venue entrance.',
    canScan: false,
  },
  ceremonies: {
    title: 'Ceremonies',
    badge: 'Ceremonies Pass',
    description: 'Head of Ceremonies. Personal verified QR Pass for MUN Venue entrance.',
    canScan: false,
  },
  dcc: {
    title: 'DCC (Digital / Committee Control)',
    badge: 'DCC Pass',
    description: 'Head of DCC. Personal verified QR Pass for MUN Venue entrance.',
    canScan: false,
  },
  doc_department: {
    title: 'Documentation',
    badge: 'Documentation Pass',
    description: 'Resolutions and documentation department. Personal verified QR Pass for MUN Venue entrance.',
    canScan: false,
  },
};
