import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Guest,
  StaffMember,
  StaffRole,
  VenueSettings,
  ScanResult,
  CheckInLogEntry,
  ROLE_LABELS,
  isScannerOrAdminRole,
} from '../types/venue';
import { playSuccessChime, playWarningBuzzer, playErrorAlarm, playSecurityAlertSiren } from '../utils/audio';
import { vibrateSuccess, vibrateWarning, vibrateError } from '../utils/haptics';
import confetti from 'canvas-confetti';

interface VenueContextType {
  guests: Guest[];
  staffMembers: StaffMember[];
  currentUser: StaffMember | null;
  isAuthenticated: boolean;
  settings: VenueSettings;
  logs: CheckInLogEntry[];
  lastScanResult: ScanResult | null;
  activeTab: 'scanner' | 'dashboard' | 'guestlist' | 'team';
  setActiveTab: (tab: 'scanner' | 'dashboard' | 'guestlist' | 'team') => void;
  login: (identifier: string, pass: string) => { success: boolean; error?: string };
  register: (staffData: Omit<StaffMember, 'id'>) => { success: boolean; error?: string };
  logout: () => void;
  switchAccountFast: (staffId: string) => void;
  processScan: (rawCode: string) => ScanResult;
  manualCheckIn: (guestId: string) => boolean;
  undoCheckIn: (guestId: string) => boolean;
  flagSecurityIncident: (guestId: string, reason: string) => void;
  addGuest: (guest: Omit<Guest, 'id'>) => Guest;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  removeGuest: (id: string) => void;
  importGuests: (newGuests: Partial<Guest>[]) => { added: number; updated: number };
  resetAllCheckIns: () => void;
  loadSampleData: () => void;
  addStaffMember: (staff: Omit<StaffMember, 'id'>) => StaffMember;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  removeStaffMember: (id: string) => void;
  updateSettings: (updates: Partial<VenueSettings>) => void;
  clearLastScanResult: () => void;
  stats: {
    totalGuests: number;
    checkedInCount: number;
    pendingCount: number;
    capacityRemaining: number;
    capacityPercent: number;
    vipCheckedIn: number;
    vipTotal: number;
    recentCheckIns: CheckInLogEntry[];
  };
}

const STORAGE_KEY_GUESTS = 'westmun_venue_guests_v4';
const STORAGE_KEY_STAFF = 'westmun_venue_staff_v4';
const STORAGE_KEY_SETTINGS = 'westmun_venue_settings_v4';
const STORAGE_KEY_LOGS = 'westmun_venue_logs_v4';
const STORAGE_KEY_AUTH = 'westmun_venue_auth_v4';

const DEFAULT_SETTINGS: VenueSettings = {
  venueName: 'West Mun Grand Venue',
  totalCapacity: 1200,
  currentEventName: 'The Gold Gala • West Mun Residency',
  eventDate: new Date().toISOString().split('T')[0],
  warningCapacityPercentage: 85,
  soundEnabled: true,
  vibrationEnabled: true,
  autoResetScanDelayMs: 4000,
  strictAntiPassback: true, // Strict mode: Re-scanning any admitted QR code is permanently rejected
};

// Pre-seeded staff accounts representing all 10 requested roles
// RULE: ONLY Security and Admins (Super Admin and Ceremony Director) have the ability to scan.
// Everyone else has canScan: false and sees their scannable QR Pass Screen.
const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-admin-1',
    name: 'Ahmed Al-Kik',
    email: 'admin@westmun.com',
    password: 'gold2026',
    role: 'super_admin',
    accessKey: '9900',
    assignedGate: 'West Mun Executive Control',
    ticketId: 'WM-STAFF-ADMIN-9900',
    canScan: true,
    canManualCheckIn: true,
    canRevokeCheckIn: true,
    canManageStaff: true,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-ceremony-1',
    name: 'Marcus Vance',
    email: 'ceremony@westmun.com',
    password: 'gold2026',
    role: 'ceremony_director',
    accessKey: '1100',
    assignedGate: 'Main Stage & Protocol Suite',
    ticketId: 'WM-STAFF-CEREMONY-1100',
    canScan: true,
    canManualCheckIn: true,
    canRevokeCheckIn: true,
    canManageStaff: true,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-sec-1',
    name: 'Viktor Romanov',
    email: 'security@westmun.com',
    password: 'gold2026',
    role: 'security',
    accessKey: '2200',
    assignedGate: 'Main Perimeter & Gold Gate A',
    ticketId: 'WM-STAFF-SEC-2200',
    canScan: true,
    canManualCheckIn: true,
    canRevokeCheckIn: true,
    canManageStaff: false,
    canExportData: false,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-vol-1',
    name: 'Jordan Reyes',
    email: 'volunteer@westmun.com',
    password: 'gold2026',
    role: 'volunteers',
    accessKey: '3300',
    assignedGate: 'North Turnstile Lane 1',
    ticketId: 'WM-STAFF-VOL-3300',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: false,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-press-1',
    name: 'Clara Oswald',
    email: 'press@westmun.com',
    password: 'gold2026',
    role: 'media_and_press',
    accessKey: '4400',
    assignedGate: 'Press Desk & Media Lounge',
    ticketId: 'WM-STAFF-PRESS-4400',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-pr-1',
    name: 'Sophia Chen',
    email: 'pr@westmun.com',
    password: 'gold2026',
    role: 'pr',
    accessKey: '5500',
    assignedGate: 'Gold Carpet & VIP Entrance',
    ticketId: 'WM-STAFF-PR-5500',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-mkt-1',
    name: 'Devon Miller',
    email: 'marketing@westmun.com',
    password: 'gold2026',
    role: 'marketing',
    accessKey: '6600',
    assignedGate: 'Guest Relations Lounge',
    ticketId: 'WM-STAFF-MKT-6600',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-hr-1',
    name: 'Elena Rostova',
    email: 'hr@westmun.com',
    password: 'gold2026',
    role: 'hr',
    accessKey: '7700',
    assignedGate: 'Staff Operations Hub',
    ticketId: 'WM-STAFF-HR-7700',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-sec-dept-1',
    name: 'Maya Lin',
    email: 'secretary@westmun.com',
    password: 'gold2026',
    role: 'secretary',
    accessKey: '8800',
    assignedGate: 'Secretariat & Manifest Desk',
    ticketId: 'WM-STAFF-SECY-8800',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-doc-1',
    name: 'Julian Sterling',
    email: 'doc@westmun.com',
    password: 'gold2026',
    role: 'doc_department',
    accessKey: '9901',
    assignedGate: 'Documentation Archive Unit',
    ticketId: 'WM-STAFF-DOC-9901',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
];

const INITIAL_GUESTS: Guest[] = [
  // Official Staff Passes (Scanned at entrance by Security)
  {
    id: 'g-staff-vol',
    name: 'Jordan Reyes',
    ticketId: 'WM-STAFF-VOL-3300',
    category: 'Staff',
    tableOrSeat: 'North Turnstile Lane 1',
    notes: 'Volunteers Department Credential Pass',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-staff-press',
    name: 'Clara Oswald',
    ticketId: 'WM-STAFF-PRESS-4400',
    category: 'Press',
    tableOrSeat: 'Press Desk & Media Lounge',
    notes: 'Media & Press Accreditation Pass',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-staff-pr',
    name: 'Sophia Chen',
    ticketId: 'WM-STAFF-PR-5500',
    category: 'Staff',
    tableOrSeat: 'Gold Carpet & VIP Entrance',
    notes: 'Public Relations VIP Liaison Pass',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-staff-mkt',
    name: 'Devon Miller',
    ticketId: 'WM-STAFF-MKT-6600',
    category: 'Staff',
    tableOrSeat: 'Guest Relations Lounge',
    notes: 'Marketing Department Staff Pass',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-staff-hr',
    name: 'Elena Rostova',
    ticketId: 'WM-STAFF-HR-7700',
    category: 'Staff',
    tableOrSeat: 'Staff Operations Hub',
    notes: 'Human Resources Staff Pass',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-staff-secy',
    name: 'Maya Lin',
    ticketId: 'WM-STAFF-SECY-8800',
    category: 'Staff',
    tableOrSeat: 'Secretariat & Manifest Desk',
    notes: 'Secretary Department Staff Pass',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-staff-doc',
    name: 'Julian Sterling',
    ticketId: 'WM-STAFF-DOC-9901',
    category: 'Staff',
    tableOrSeat: 'Documentation Archive Unit',
    notes: 'Documentation Department Staff Pass',
    status: 'Pending',
    scanCount: 0,
  },

  // General Attendees & VIPs
  {
    id: 'g-1',
    name: 'Alexander Wright',
    ticketId: 'WM-VIP-8891',
    category: 'VIP',
    tableOrSeat: 'Gold Tier • Table 14',
    notes: 'Includes VIP champagne service & private lounge access',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-2',
    name: 'Elena Rostova (Guest Pass)',
    ticketId: 'WM-GA-4412',
    category: 'General Admission',
    tableOrSeat: 'Main Auditorium Tier 1',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-3',
    name: 'Marcus Vance',
    ticketId: 'WM-ART-1002',
    category: 'Artist',
    tableOrSeat: 'Presidential Green Room',
    notes: 'Keynote Performer Entourage - All-Access Gold Lanyard',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-4',
    name: 'Sophia Chen (VIP Guest)',
    ticketId: 'WM-VIP-8892',
    category: 'VIP',
    tableOrSeat: 'Gold Tier • Table 14',
    notes: 'Alexander Wright +1',
    status: 'Checked-In',
    scanCount: 1,
    checkedInTime: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
    checkedInBy: 'Viktor Romanov (Security)',
    checkedInGate: 'Main Perimeter & Gold Gate A',
  },
  {
    id: 'g-5',
    name: 'Devon Miller (Guest Pass)',
    ticketId: 'WM-GA-4413',
    category: 'General Admission',
    tableOrSeat: 'Floor Section B',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-6',
    name: 'Clara Oswald (Press Pass)',
    ticketId: 'WM-PRS-3021',
    category: 'Press',
    tableOrSeat: 'Media Box 3',
    notes: 'Approved for stage front DSLR photography and interview pit',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-7',
    name: 'Liam Sterling',
    ticketId: 'WM-VIP-8895',
    category: 'VIP',
    tableOrSeat: 'Gold Tier • Booth 4',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-8',
    name: 'Maya Lin (Guest Pass)',
    ticketId: 'WM-GA-4414',
    category: 'General Admission',
    tableOrSeat: 'Floor Section A',
    status: 'Checked-In',
    scanCount: 1,
    checkedInTime: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    checkedInBy: 'Viktor Romanov (Security)',
    checkedInGate: 'Main Perimeter & Gold Gate A',
  },
  {
    id: 'g-9',
    name: 'David O\'Reilly',
    ticketId: 'WM-VIP-8898',
    category: 'VIP',
    tableOrSeat: 'Gold Table 8',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-10',
    name: 'Amara Okafor',
    ticketId: 'WM-ART-1005',
    category: 'Backstage',
    tableOrSeat: 'Production Suite',
    notes: 'Visual Director Pass',
    status: 'Pending',
    scanCount: 0,
  },
];

const VenueContext = createContext<VenueContextType | null>(null);

export const VenueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guests, setGuests] = useState<Guest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GUESTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_GUESTS;
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STAFF);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STAFF;
  });

  const [currentUser, setCurrentUser] = useState<StaffMember | null>(() => {
    try {
      const savedAuthId = localStorage.getItem(STORAGE_KEY_AUTH);
      if (savedAuthId) {
        const found = staffMembers.find((s) => s.id === savedAuthId);
        if (found) return found;
      }
    } catch (e) {
      console.error(e);
    }
    // Default to Super Admin for immediate review
    return staffMembers[0];
  });

  const [settings, setSettings] = useState<VenueSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SETTINGS;
  });

  const [logs, setLogs] = useState<CheckInLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'log-1',
        ticketId: 'WM-VIP-8892',
        guestName: 'Sophia Chen',
        category: 'VIP',
        gate: 'Gold Carpet & VIP Entrance',
        scannerName: 'Sophia Chen (PR Desk)',
        timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
        type: 'CHECK_IN',
      },
      {
        id: 'log-2',
        ticketId: 'WM-GA-4414',
        guestName: 'Maya Lin',
        category: 'General Admission',
        gate: 'North Turnstile Lane 1',
        scannerName: 'Jordan Reyes (Volunteers)',
        timestamp: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
        type: 'CHECK_IN',
      },
    ];
  });

  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [activeTab, setActiveTab] = useState<'scanner' | 'dashboard' | 'guestlist' | 'team'>('scanner');

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GUESTS, JSON.stringify(guests));
  }, [guests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(staffMembers));
  }, [staffMembers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_AUTH, currentUser.id);
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  }, [currentUser]);

  // Sync across tabs
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('westmun_gold_venue_sync');

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data) return;
      if (data.type === 'SYNC_ALL') {
        if (data.guests) setGuests(data.guests);
        if (data.logs) setLogs(data.logs);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  const broadcastUpdate = useCallback((updatedGuests: Guest[], updatedLogs: CheckInLogEntry[]) => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('westmun_gold_venue_sync');
        channel.postMessage({
          type: 'SYNC_ALL',
          guests: updatedGuests,
          logs: updatedLogs,
        });
        channel.close();
      } catch (e) {
        console.warn('Broadcast failed', e);
      }
    }
  }, []);

  // Account Authentication methods
  const login = useCallback(
    (identifier: string, pass: string): { success: boolean; error?: string } => {
      const cleanId = identifier.trim().toLowerCase();
      const cleanPass = pass.trim();

      const user = staffMembers.find(
        (s) =>
          (s.email.toLowerCase() === cleanId || s.accessKey === cleanId || s.name.toLowerCase() === cleanId) &&
          (s.password ? s.password === cleanPass : cleanPass === 'gold2026' || cleanPass.length >= 4)
      );

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials. Password or staff email does not match any West Mun account.',
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          error: 'This account has been deactivated by the Security or HR department.',
        };
      }

      setCurrentUser(user);
      return { success: true };
    },
    [staffMembers]
  );

  const register = useCallback(
    (staffData: Omit<StaffMember, 'id'>): { success: boolean; error?: string } => {
      if (!staffData.email || !staffData.name || !staffData.password) {
        return { success: false, error: 'Name, email, and password are required to create an account.' };
      }

      const existing = staffMembers.find((s) => s.email.toLowerCase() === staffData.email.toLowerCase());
      if (existing) {
        return { success: false, error: 'A staff member with this email already exists.' };
      }

      const canScan = isScannerOrAdminRole(staffData.role);
      const accessPin = staffData.accessKey || String(Math.floor(1000 + Math.random() * 9000));
      const generatedTicketId = staffData.ticketId || `WM-STAFF-${staffData.role.toUpperCase()}-${accessPin}`;

      const newMember: StaffMember = {
        ...staffData,
        id: `staff-${Date.now()}`,
        accessKey: accessPin,
        ticketId: generatedTicketId,
        canScan,
        canManualCheckIn: canScan,
        canRevokeCheckIn: canScan,
        isActive: true,
        lastActiveTime: new Date().toISOString(),
      };

      setStaffMembers((prev) => [...prev, newMember]);
      setCurrentUser(newMember);

      // Add corresponding staff credential pass to guests manifest so Security can scan it
      setGuests((prev) => [
        ...prev,
        {
          id: `g-staff-${newMember.id}`,
          name: newMember.name,
          ticketId: generatedTicketId,
          category: newMember.role === 'media_and_press' ? 'Press' : 'Staff',
          tableOrSeat: newMember.assignedGate || 'West Mun Staff Zone',
          notes: `${ROLE_LABELS[newMember.role]?.title || 'Staff'} Credential Pass`,
          status: 'Pending',
          scanCount: 0,
        },
      ]);

      return { success: true };
    },
    [staffMembers]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const switchAccountFast = useCallback(
    (staffId: string) => {
      const found = staffMembers.find((s) => s.id === staffId);
      if (found) {
        setCurrentUser(found);
      }
    },
    [staffMembers]
  );

  // Process QR / Barcode Scan
  const processScan = useCallback(
    (rawCode: string): ScanResult => {
      const cleanCode = (rawCode || '').trim();
      const nowIso = new Date().toISOString();

      // If the current user has scanner authorization, attribute scan to them.
      // If a non-scanner user clicked "simulate scan" from their pass screen, attribute to on-duty Security.
      const isSecurityOrAdminScanner = isScannerOrAdminRole(currentUser?.role);
      const currentScannerName = isSecurityOrAdminScanner && currentUser
        ? `${currentUser.name} (${ROLE_LABELS[currentUser.role]?.title || 'Security'})`
        : 'Viktor Romanov (Security)';
      const currentGate = isSecurityOrAdminScanner && currentUser
        ? currentUser.assignedGate
        : 'Main Perimeter & Gold Gate A';

      if (!cleanCode) {
        const res: ScanResult = {
          type: 'INVALID_TICKET',
          scannedCode: cleanCode,
          timestamp: nowIso,
          message: 'Empty or unreadable QR code payload.',
        };
        if (settings.soundEnabled) playErrorAlarm();
        if (settings.vibrationEnabled) vibrateError();
        setLastScanResult(res);
        return res;
      }

      let guestIndex = guests.findIndex(
        (g) => g.ticketId.toLowerCase() === cleanCode.toLowerCase()
      );

      // If not in manifest, check if it belongs to a registered staff member's pass!
      if (guestIndex === -1) {
        const matchingStaff = staffMembers.find(
          (s) =>
            (s.ticketId && s.ticketId.toLowerCase() === cleanCode.toLowerCase()) ||
            s.id.toLowerCase() === cleanCode.toLowerCase()
        );
        if (matchingStaff) {
          const autoStaffGuest: Guest = {
            id: `g-staff-${matchingStaff.id}`,
            name: matchingStaff.name,
            ticketId: matchingStaff.ticketId || cleanCode,
            category: matchingStaff.role === 'media_and_press' ? 'Press' : 'Staff',
            tableOrSeat: matchingStaff.assignedGate || 'Staff Operations',
            notes: `${ROLE_LABELS[matchingStaff.role]?.title} Credential Pass`,
            status: 'Pending',
            scanCount: 0,
          };
          guests.push(autoStaffGuest);
          guestIndex = guests.length - 1;
        }
      }

      if (guestIndex === -1) {
        const res: ScanResult = {
          type: 'INVALID_TICKET',
          scannedCode: cleanCode,
          timestamp: nowIso,
          message: 'Ticket ID not found in West Mun guest manifest.',
        };

        if (settings.soundEnabled) playErrorAlarm();
        if (settings.vibrationEnabled) vibrateError();

        const newLog: CheckInLogEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ticketId: cleanCode,
          guestName: 'Unknown Attendee',
          category: 'General Admission',
          gate: currentGate,
          scannerName: currentScannerName,
          timestamp: nowIso,
          type: 'DENIED_ATTEMPT',
          reason: 'Ticket not found in official manifest',
        };

        const updatedLogs = [newLog, ...logs];
        setLogs(updatedLogs);
        broadcastUpdate(guests, updatedLogs);
        setLastScanResult(res);
        return res;
      }

      const guest = guests[guestIndex];

      // Strict Anti-Passback Check: Cannot re-scan the same QR code again!
      if (guest.status === 'Checked-In') {
        const currentCount = guest.scanCount || 1;
        const nextAttemptNum = currentCount + 1;

        const newAttemptRecord = {
          timestamp: nowIso,
          scanner: currentScannerName,
          gate: currentGate,
        };

        const updatedGuest: Guest = {
          ...guest,
          scanCount: nextAttemptNum,
          deniedAttempts: [...(guest.deniedAttempts || []), newAttemptRecord],
        };

        const updatedGuests = [...guests];
        updatedGuests[guestIndex] = updatedGuest;

        const res: ScanResult = {
          type: 'ALREADY_CHECKED_IN',
          guest: updatedGuest,
          scannedCode: cleanCode,
          timestamp: nowIso,
          attemptNumber: nextAttemptNum,
          duplicateAttemptsCount: nextAttemptNum - 1,
          message: `ENTRY DENIED: QR Code was already scanned and admitted at ${guest.checkedInTime ? new Date(guest.checkedInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'earlier'}. Re-scanning is strictly blocked. (Attempt #${nextAttemptNum})`,
          previousCheckIn: {
            time: guest.checkedInTime || 'Unknown',
            scanner: guest.checkedInBy || 'Door Staff',
            gate: guest.checkedInGate || undefined,
          },
        };

        if (settings.soundEnabled) {
          playSecurityAlertSiren();
          setTimeout(() => playWarningBuzzer(), 300);
        }
        if (settings.vibrationEnabled) {
          vibrateError();
          setTimeout(() => vibrateWarning(), 250);
        }

        const newLog: CheckInLogEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ticketId: guest.ticketId,
          guestName: guest.name,
          category: guest.category,
          gate: currentGate,
          scannerName: currentScannerName,
          timestamp: nowIso,
          type: 'DENIED_ATTEMPT',
          attemptCount: nextAttemptNum,
          reason: `SECURITY ALERT: Blocked re-scan attempt #${nextAttemptNum} at ${currentGate}. Already admitted by ${guest.checkedInBy || 'Door Staff'} at ${guest.checkedInGate || 'Entrance'}.`,
        };

        const updatedLogs = [newLog, ...logs];
        setGuests(updatedGuests);
        setLogs(updatedLogs);
        broadcastUpdate(updatedGuests, updatedLogs);
        setLastScanResult(res);
        return res;
      }

      // Valid Ticket: First time scan
      const updatedGuest: Guest = {
        ...guest,
        status: 'Checked-In',
        scanCount: 1,
        deniedAttempts: [],
        checkedInTime: nowIso,
        checkedInBy: currentScannerName,
        checkedInGate: currentGate,
      };

      const updatedGuests = [...guests];
      updatedGuests[guestIndex] = updatedGuest;

      const newLog: CheckInLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ticketId: guest.ticketId,
        guestName: guest.name,
        category: guest.category,
        gate: currentGate,
        scannerName: currentScannerName,
        timestamp: nowIso,
        type: 'CHECK_IN',
        attemptCount: 1,
      };

      const updatedLogs = [newLog, ...logs];
      setGuests(updatedGuests);
      setLogs(updatedLogs);
      broadcastUpdate(updatedGuests, updatedLogs);

      if (settings.soundEnabled) playSuccessChime();
      if (settings.vibrationEnabled) vibrateSuccess();

      // Gold confetti for VIP or Artist
      try {
        confetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#f59e0b', '#fbbf24', '#ffffff'],
        });
      } catch {
        // ignore
      }

      const res: ScanResult = {
        type: 'SUCCESS',
        guest: updatedGuest,
        scannedCode: cleanCode,
        timestamp: nowIso,
        message: 'Access Granted',
      };

      setLastScanResult(res);
      return res;
    },
    [guests, logs, currentUser, settings, broadcastUpdate]
  );

  const manualCheckIn = useCallback(
    (guestId: string): boolean => {
      const idx = guests.findIndex((g) => g.id === guestId);
      if (idx === -1) return false;
      const guest = guests[idx];
      if (guest.status === 'Checked-In') return false;

      const nowIso = new Date().toISOString();
      const currentScannerName = currentUser ? `${currentUser.name} (Manual)` : 'Manual Entry';
      const currentGate = currentUser ? currentUser.assignedGate : 'Gate';

      const updatedGuest: Guest = {
        ...guest,
        status: 'Checked-In',
        scanCount: 1,
        deniedAttempts: [],
        checkedInTime: nowIso,
        checkedInBy: currentScannerName,
        checkedInGate: currentGate,
      };

      const updatedGuests = [...guests];
      updatedGuests[idx] = updatedGuest;

      const newLog: CheckInLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ticketId: guest.ticketId,
        guestName: guest.name,
        category: guest.category,
        gate: currentGate,
        scannerName: currentScannerName,
        timestamp: nowIso,
        type: 'CHECK_IN',
        attemptCount: 1,
      };

      const updatedLogs = [newLog, ...logs];
      setGuests(updatedGuests);
      setLogs(updatedLogs);
      broadcastUpdate(updatedGuests, updatedLogs);

      if (settings.soundEnabled) playSuccessChime();
      if (settings.vibrationEnabled) vibrateSuccess();
      return true;
    },
    [guests, logs, currentUser, settings, broadcastUpdate]
  );

  const undoCheckIn = useCallback(
    (guestId: string): boolean => {
      const idx = guests.findIndex((g) => g.id === guestId);
      if (idx === -1) return false;
      const guest = guests[idx];
      if (guest.status !== 'Checked-In') return false;

      const nowIso = new Date().toISOString();
      const currentScannerName = currentUser ? currentUser.name : 'Door Admin';
      const currentGate = currentUser ? currentUser.assignedGate : 'Control Desk';

      const updatedGuest: Guest = {
        ...guest,
        status: 'Pending',
        scanCount: 0,
        deniedAttempts: [],
        checkedInTime: null,
        checkedInBy: null,
        checkedInGate: null,
      };

      const updatedGuests = [...guests];
      updatedGuests[idx] = updatedGuest;

      const newLog: CheckInLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ticketId: guest.ticketId,
        guestName: guest.name,
        category: guest.category,
        gate: currentGate,
        scannerName: currentScannerName,
        timestamp: nowIso,
        type: 'UNDO_CHECK_IN',
        reason: 'Reset to pending by authorized staff',
      };

      const updatedLogs = [newLog, ...logs];
      setGuests(updatedGuests);
      setLogs(updatedLogs);
      broadcastUpdate(updatedGuests, updatedLogs);
      return true;
    },
    [guests, logs, currentUser, broadcastUpdate]
  );

  const flagSecurityIncident = useCallback(
    (guestId: string, reason: string) => {
      const guest = guests.find((g) => g.id === guestId);
      if (!guest) return;
      const nowIso = new Date().toISOString();
      const currentScannerName = currentUser ? currentUser.name : 'Security Enforcement';
      const currentGate = currentUser ? currentUser.assignedGate : 'Gate';

      const incidentLog: CheckInLogEntry = {
        id: `incident-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ticketId: guest.ticketId,
        guestName: guest.name,
        category: guest.category,
        gate: currentGate,
        scannerName: currentScannerName,
        timestamp: nowIso,
        type: 'SECURITY_FLAG',
        reason: reason || `Counterfeit or shared QR screenshot flagged for interception.`,
        attemptCount: guest.scanCount,
      };

      const updatedLogs = [incidentLog, ...logs];
      setLogs(updatedLogs);
      broadcastUpdate(guests, updatedLogs);
    },
    [guests, logs, currentUser, broadcastUpdate]
  );

  const addGuest = useCallback(
    (newGuestData: Omit<Guest, 'id'>): Guest => {
      const newGuest: Guest = {
        ...newGuestData,
        id: `g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      const updatedGuests = [newGuest, ...guests];
      setGuests(updatedGuests);
      broadcastUpdate(updatedGuests, logs);
      return newGuest;
    },
    [guests, logs, broadcastUpdate]
  );

  const updateGuest = useCallback(
    (id: string, updates: Partial<Guest>) => {
      const updatedGuests = guests.map((g) => (g.id === id ? { ...g, ...updates } : g));
      setGuests(updatedGuests);
      broadcastUpdate(updatedGuests, logs);
    },
    [guests, logs, broadcastUpdate]
  );

  const removeGuest = useCallback(
    (id: string) => {
      const updatedGuests = guests.filter((g) => g.id !== id);
      setGuests(updatedGuests);
      broadcastUpdate(updatedGuests, logs);
    },
    [guests, logs, broadcastUpdate]
  );

  const importGuests = useCallback(
    (newGuestsList: Partial<Guest>[]): { added: number; updated: number } => {
      let added = 0;
      let updated = 0;
      const currentList = [...guests];

      newGuestsList.forEach((incoming) => {
        if (!incoming.ticketId) return;

        const existingIdx = currentList.findIndex(
          (g) => g.ticketId.toLowerCase() === (incoming.ticketId || '').toLowerCase()
        );

        if (existingIdx !== -1) {
          currentList[existingIdx] = {
            ...currentList[existingIdx],
            name: incoming.name || currentList[existingIdx].name,
            category: incoming.category || currentList[existingIdx].category,
            tableOrSeat: incoming.tableOrSeat || currentList[existingIdx].tableOrSeat,
            notes: incoming.notes || currentList[existingIdx].notes,
            status: incoming.status || currentList[existingIdx].status,
            checkedInTime: incoming.checkedInTime || currentList[existingIdx].checkedInTime,
            checkedInBy: incoming.checkedInBy || currentList[existingIdx].checkedInBy,
          };
          updated++;
        } else {
          currentList.push({
            id: `g-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: incoming.name || 'Attendee',
            ticketId: incoming.ticketId,
            category: incoming.category || 'General Admission',
            tableOrSeat: incoming.tableOrSeat,
            notes: incoming.notes,
            status: incoming.status || 'Pending',
            scanCount: incoming.scanCount ?? (incoming.status === 'Checked-In' ? 1 : 0),
            deniedAttempts: incoming.deniedAttempts || [],
            checkedInTime: incoming.checkedInTime || null,
            checkedInBy: incoming.checkedInBy || null,
          });
          added++;
        }
      });

      setGuests(currentList);
      broadcastUpdate(currentList, logs);
      return { added, updated };
    },
    [guests, logs, broadcastUpdate]
  );

  const resetAllCheckIns = useCallback(() => {
    const updatedGuests = guests.map((g) => ({
      ...g,
      status: 'Pending' as const,
      scanCount: 0,
      deniedAttempts: [],
      checkedInTime: null,
      checkedInBy: null,
      checkedInGate: null,
    }));
    setGuests(updatedGuests);
    const resetLog: CheckInLogEntry = {
      id: `log-${Date.now()}`,
      ticketId: 'ALL',
      guestName: 'All Attendees',
      category: 'General Admission',
      gate: currentUser ? currentUser.assignedGate : 'Executive Control',
      scannerName: currentUser ? currentUser.name : 'Super Admin',
      timestamp: new Date().toISOString(),
      type: 'UNDO_CHECK_IN',
      reason: 'Full venue manifest reset',
    };
    const updatedLogs = [resetLog, ...logs];
    setLogs(updatedLogs);
    broadcastUpdate(updatedGuests, updatedLogs);
  }, [guests, logs, currentUser, broadcastUpdate]);

  const loadSampleData = useCallback(() => {
    setGuests(INITIAL_GUESTS);
    setStaffMembers(INITIAL_STAFF);
    broadcastUpdate(INITIAL_GUESTS, logs);
  }, [logs, broadcastUpdate]);

  const addStaffMember = useCallback((staffData: Omit<StaffMember, 'id'>): StaffMember => {
    const canScan = isScannerOrAdminRole(staffData.role);
    const accessPin = staffData.accessKey || String(Math.floor(1000 + Math.random() * 9000));
    const generatedTicketId = staffData.ticketId || `WM-STAFF-${staffData.role.toUpperCase()}-${accessPin}`;

    const newStaff: StaffMember = {
      ...staffData,
      id: `staff-${Date.now()}`,
      accessKey: accessPin,
      ticketId: generatedTicketId,
      canScan,
      canManualCheckIn: canScan,
      canRevokeCheckIn: canScan,
    };

    setStaffMembers((prev) => [...prev, newStaff]);

    // Also register into guests manifest so Security can scan their pass
    setGuests((prev) => [
      ...prev,
      {
        id: `g-staff-${newStaff.id}`,
        name: newStaff.name,
        ticketId: generatedTicketId,
        category: newStaff.role === 'media_and_press' ? 'Press' : 'Staff',
        tableOrSeat: newStaff.assignedGate || 'Staff Operations',
        notes: `${ROLE_LABELS[newStaff.role]?.title || 'Staff'} Credential Pass`,
        status: 'Pending',
        scanCount: 0,
      },
    ]);

    return newStaff;
  }, []);

  const updateStaffMember = useCallback((id: string, updates: Partial<StaffMember>) => {
    setStaffMembers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const removeStaffMember = useCallback((id: string) => {
    setStaffMembers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateSettings = useCallback((updates: Partial<VenueSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearLastScanResult = useCallback(() => {
    setLastScanResult(null);
  }, []);

  const stats = useMemo(() => {
    const totalGuests = guests.length;
    const checkedInCount = guests.filter((g) => g.status === 'Checked-In').length;
    const pendingCount = totalGuests - checkedInCount;
    const capacity = settings.totalCapacity || 1200;
    const capacityRemaining = Math.max(0, capacity - checkedInCount);
    const capacityPercent = Math.min(100, Math.round((checkedInCount / capacity) * 100));

    const vipTotal = guests.filter((g) => g.category === 'VIP').length;
    const vipCheckedIn = guests.filter((g) => g.category === 'VIP' && g.status === 'Checked-In').length;

    const recentCheckIns = logs.slice(0, 10);

    return {
      totalGuests,
      checkedInCount,
      pendingCount,
      capacityRemaining,
      capacityPercent,
      vipCheckedIn,
      vipTotal,
      recentCheckIns,
    };
  }, [guests, logs, settings.totalCapacity]);

  return (
    <VenueContext.Provider
      value={{
        guests,
        staffMembers,
        currentUser,
        isAuthenticated: !!currentUser,
        settings,
        logs,
        lastScanResult,
        activeTab,
        setActiveTab,
        login,
        register,
        logout,
        switchAccountFast,
        processScan,
        manualCheckIn,
        undoCheckIn,
        flagSecurityIncident,
        addGuest,
        updateGuest,
        removeGuest,
        importGuests,
        resetAllCheckIns,
        loadSampleData,
        addStaffMember,
        updateStaffMember,
        removeStaffMember,
        updateSettings,
        clearLastScanResult,
        stats,
      }}
    >
      {children}
    </VenueContext.Provider>
  );
};

export const useVenue = () => {
  const ctx = useContext(VenueContext);
  if (!ctx) throw new Error('useVenue must be used within VenueProvider');
  return ctx;
};
