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
  login: (identifier: string, pass?: string) => { success: boolean; user?: StaffMember; error?: string };
  authenticateByIdentifier: (identifier: string) => { success: boolean; error?: string; user?: StaffMember };
  resetStaffPassword: (staffId: string, customPassword?: string) => { success: boolean; newPassword?: string; error?: string };
  generateNewStaffPassword: (staffId: string) => { success: boolean; newPassword?: string; error?: string };
  register: (staffData: Omit<StaffMember, 'id'>) => { success: boolean; error?: string };
  logout: () => void;
  switchAccountFast: (staffId: string) => void;
  loginAsStaffMember: (member: StaffMember) => void;
  processScan: (rawCode: string, mode?: 'entry' | 'exit') => ScanResult;
  markGuestLeft: (guestId: string) => boolean;
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
    leftCount: number;
    pendingCount: number;
    capacityRemaining: number;
    capacityPercent: number;
    vipCheckedIn: number;
    vipTotal: number;
    recentCheckIns: CheckInLogEntry[];
  };
}

const STORAGE_KEY_GUESTS = 'west_mun_guests_v14_trends_and_eggs';
const STORAGE_KEY_STAFF = 'west_mun_staff_v14_trends_and_eggs';
const STORAGE_KEY_SETTINGS = 'west_mun_settings_v14_trends_and_eggs';
const STORAGE_KEY_LOGS = 'west_mun_logs_v14_trends_and_eggs';
const STORAGE_KEY_AUTH = 'west_mun_auth_v14_trends_and_eggs';

const DEFAULT_SETTINGS: VenueSettings = {
  venueName: 'MUN Venue',
  totalCapacity: 1200,
  currentEventName: 'WESTMUN Conference',
  eventDate: new Date().toISOString().split('T')[0],
  warningCapacityPercentage: 85,
  soundEnabled: true,
  vibrationEnabled: true,
  autoResetScanDelayMs: 4000,
  strictAntiPassback: true, // Only scanned once unless someone leaves, then they can re-scan!
};

// Official staff accounts for MUN Venue with roles explicitly assigned.
// ONLY members of Security and IT (and master Super Admin) can scan QR codes.
// Both IT and Security members have the ability to add members to their team.
// All other roles (Design, Media, PR, HR, etc.) have their personal scannable QR Pass.
const INITIAL_STAFF: StaffMember[] = [
  // IT Team (Admin of IT: Ahmed Magdi - Password MUST be 344)
  {
    id: 'staff-it-ahmed',
    name: 'Ahmed Magdi',
    email: 'ahmed.magdi@westmun.org',
    customTitle: 'Admin of IT & Head of Systems',
    password: '344',
    role: 'it',
    accessKey: '344',
    assignedGate: 'Security & Tech Hub',
    ticketId: 'MUN-IT-01',
    canScan: true,
    canManualCheckIn: true,
    canRevokeCheckIn: true,
    canManageStaff: true,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-it-saleh',
    name: 'Saleh Samaha',
    email: 'saleh.samaha@westmun.org',
    customTitle: 'Co-Head of IT',
    password: '5821',
    role: 'it',
    accessKey: '5821',
    assignedGate: 'Security & Tech Hub',
    ticketId: 'MUN-IT-02',
    canScan: true,
    canManualCheckIn: true,
    canRevokeCheckIn: true,
    canManageStaff: true,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },

  // Security Team (Can scan + door access enforcement)
  {
    id: 'staff-sec-lead',
    name: 'Security Lead',
    email: 'security.lead@westmun.org',
    customTitle: 'Head of Security',
    password: '9046',
    role: 'security',
    accessKey: '9046',
    assignedGate: 'Main Entrance Gate',
    ticketId: 'MUN-SEC-LEAD-01',
    canScan: true,
    canManualCheckIn: true,
    canRevokeCheckIn: true,
    canManageStaff: true,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-sec-officer',
    name: 'Security Officer',
    email: 'security.officer@westmun.org',
    customTitle: 'Security Officer',
    password: '4279',
    role: 'security',
    accessKey: '4279',
    assignedGate: 'Access Control',
    ticketId: 'MUN-SEC-OFF-02',
    canScan: true,
    canManualCheckIn: true,
    canRevokeCheckIn: true,
    canManageStaff: true,
    canExportData: false,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-sec-yusef',
    name: 'Yusef Saad',
    email: 'yusef.saad@westmun.org',
    customTitle: 'Head of Male Security',
    password: '5714',
    role: 'security',
    accessKey: '5714',
    assignedGate: 'Access Control',
    ticketId: 'MUN-SEC-01',
    canScan: true,
    canManualCheckIn: true,
    canRevokeCheckIn: true,
    canManageStaff: true,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-sec-najla',
    name: 'Najla Rami',
    email: 'najla.rami@westmun.org',
    customTitle: 'Head of Female Security',
    password: '6239',
    role: 'security',
    accessKey: '6239',
    assignedGate: 'Access Control',
    ticketId: 'MUN-SEC-02',
    canScan: true,
    canManualCheckIn: true,
    canRevokeCheckIn: true,
    canManageStaff: true,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-sec-bushra',
    name: 'Bushra Ismail',
    email: 'bushra.ismail@westmun.org',
    customTitle: 'Co-Head of Security',
    password: '7841',
    role: 'security',
    accessKey: '7841',
    assignedGate: 'Access Control',
    ticketId: 'MUN-SEC-03',
    canScan: true,
    canManualCheckIn: true,
    canRevokeCheckIn: true,
    canManageStaff: true,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },

  // Executive Board & Leadership
  {
    id: 'staff-rakan',
    name: 'Rakan Almerbed',
    email: 'rakan.almerbed@westmun.org',
    customTitle: 'Secretary General',
    password: '1042',
    role: 'super_admin',
    accessKey: '1042',
    assignedGate: 'Executive Board',
    ticketId: 'MUN-EXEC-01',
    canScan: true,
    canManualCheckIn: true,
    canRevokeCheckIn: true,
    canManageStaff: true,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-yousef-saifi',
    name: 'Yousef Saifi',
    email: 'yousef.saifi@westmun.org',
    customTitle: 'Deputy Secretary General',
    password: '2418',
    role: 'executive',
    accessKey: '2418',
    assignedGate: 'Executive Board',
    ticketId: 'MUN-EXEC-02',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-fahad-usg',
    name: 'Zain Firas',
    email: 'zain.firas@westmun.org',
    customTitle: 'Under Secretary-General',
    password: '3195',
    role: 'executive',
    accessKey: '3195',
    assignedGate: 'Executive Board',
    ticketId: 'MUN-EXEC-03',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-muaz',
    name: 'Muaz El Amir',
    email: 'muaz.elamir@westmun.org',
    customTitle: 'Senior Advisor',
    password: '4820',
    role: 'executive',
    accessKey: '4820',
    assignedGate: 'Executive Board',
    ticketId: 'MUN-EXEC-04',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },

  // Marketing
  {
    id: 'staff-mkt-naya',
    name: 'Naya',
    email: 'naya.barakat@westmun.org',
    customTitle: 'Head of Marketing',
    password: '8326',
    role: 'marketing',
    accessKey: '8326',
    assignedGate: 'Marketing Hub',
    ticketId: 'MUN-MKT-01',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-mkt-sama',
    name: 'Sama Sameh',
    email: 'sama.sameh@westmun.org',
    customTitle: 'Co-Head of Marketing',
    password: '9154',
    role: 'marketing',
    accessKey: '9154',
    assignedGate: 'Marketing Hub',
    ticketId: 'MUN-MKT-02',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-mkt-jayda',
    name: 'Jadiya',
    email: 'jadiya.marketing@westmun.org',
    customTitle: 'Marketing Member',
    password: '1472',
    role: 'marketing',
    accessKey: '1472',
    assignedGate: 'Marketing Hub',
    ticketId: 'MUN-MKT-03',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: false,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },

  // Design
  {
    id: 'staff-des-mallak',
    name: 'Mallak Abbas',
    email: 'mallak.abbas@westmun.org',
    customTitle: 'Head of Design',
    password: '2583',
    role: 'designers',
    accessKey: '2583',
    assignedGate: 'Design Studio',
    ticketId: 'MUN-DES-01',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: false,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-des-saud',
    name: 'Saud Alanazi',
    email: 'saud.alanazi@westmun.org',
    customTitle: 'Co-Heads of Design',
    password: '3691',
    role: 'designers',
    accessKey: '3691',
    assignedGate: 'Design Studio',
    ticketId: 'MUN-DES-02',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: false,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-des-layan',
    name: 'Layan Ahmed',
    email: 'layan.ahmed@westmun.org',
    customTitle: 'Designer',
    password: '4702',
    role: 'designers',
    accessKey: '4702',
    assignedGate: 'Design Studio',
    ticketId: 'MUN-DES-03',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: false,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-des-aya',
    name: 'Aya Nezar',
    email: 'aya.nezar@westmun.org',
    customTitle: 'Designer',
    password: '5813',
    role: 'designers',
    accessKey: '5813',
    assignedGate: 'Design Studio',
    ticketId: 'MUN-DES-04',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: false,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },

  // Media & Press
  {
    id: 'staff-med-hashem',
    name: 'Hashem',
    email: 'hashem.media@westmun.org',
    customTitle: 'Co-Head of Media/Press',
    password: '6924',
    role: 'media_and_press',
    accessKey: '6924',
    assignedGate: 'Media Gallery',
    ticketId: 'MUN-MED-01',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-med-fahad',
    name: 'Fahad Al Kendi',
    email: 'fahad.alkendi@westmun.org',
    customTitle: 'Head of Male Media',
    password: '7035',
    role: 'media_and_press',
    accessKey: '7035',
    assignedGate: 'Media Gallery',
    ticketId: 'MUN-MED-02',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-med-selena',
    name: 'Noor',
    email: 'noor.media@westmun.org',
    customTitle: 'Head of Female Media',
    password: '8146',
    role: 'media_and_press',
    accessKey: '8146',
    assignedGate: 'Media Gallery',
    ticketId: 'MUN-MED-03',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-med-mohammed',
    name: 'Mohammed Al Nahas',
    email: 'mohammed.alnahas@westmun.org',
    customTitle: 'Head of Male Press',
    password: '9257',
    role: 'media_and_press',
    accessKey: '9257',
    assignedGate: 'Press Room',
    ticketId: 'MUN-MED-04',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-med-dana',
    name: 'Dana Alnajar',
    email: 'dana.alnajar@westmun.org',
    customTitle: 'Head of Female Press',
    password: '1368',
    role: 'media_and_press',
    accessKey: '1368',
    assignedGate: 'Press Room',
    ticketId: 'MUN-MED-05',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },

  // Volunteers (Vols)
  {
    id: 'staff-vol-saad',
    name: 'Saad Usman',
    email: 'saad.usman@westmun.org',
    customTitle: 'Head of Male Vols',
    password: '2791',
    role: 'volunteers',
    accessKey: '2791',
    assignedGate: 'Floor Operations',
    ticketId: 'MUN-VOL-01',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: false,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-vol-maram',
    name: 'Maram Ali',
    email: 'maram.ali@westmun.org',
    customTitle: 'Head of Female Vols',
    password: '3802',
    role: 'volunteers',
    accessKey: '3802',
    assignedGate: 'Floor Operations',
    ticketId: 'MUN-VOL-02',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: false,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-vol-younis',
    name: 'Younis',
    email: 'younis.vol@westmun.org',
    customTitle: 'Co-Head of Vols',
    password: '4913',
    role: 'volunteers',
    accessKey: '4913',
    assignedGate: 'Floor Operations',
    ticketId: 'MUN-VOL-04',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: false,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },

  // Logistics, PR, HR, Ceremonies, DCC
  {
    id: 'staff-log-ahmed',
    name: 'Ahmed El Amir',
    email: 'ahmed.elamir@westmun.org',
    customTitle: 'Head of Logistics',
    password: '6024',
    role: 'logistics',
    accessKey: '6024',
    assignedGate: 'Logistics Center',
    ticketId: 'MUN-LOG-01',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-pr-mazen',
    name: 'Mazen Alaa',
    email: 'mazen.alaa@westmun.org',
    customTitle: 'Head of PR',
    password: '7135',
    role: 'pr',
    accessKey: '7135',
    assignedGate: 'VIP Relations',
    ticketId: 'MUN-PR-01',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-hr-hoorein',
    name: 'Hoorein',
    email: 'hoorein.hr@westmun.org',
    customTitle: 'Head of HR',
    password: '8246',
    role: 'hr',
    accessKey: '8246',
    assignedGate: 'HR Operations',
    ticketId: 'MUN-HR-01',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: true,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-hr-seif',
    name: 'Seif Ayman',
    email: 'seif.ayman@westmun.org',
    customTitle: 'Head of HR',
    password: '9357',
    role: 'hr',
    accessKey: '9357',
    assignedGate: 'HR Operations',
    ticketId: 'MUN-HR-02',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: true,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-cer-sultana',
    name: 'Sultana Al Fajar',
    email: 'sultana.ceremonies@westmun.org',
    customTitle: 'Head of Ceremonies',
    password: '1579',
    role: 'ceremonies',
    accessKey: '1579',
    assignedGate: 'Ceremonies Stage',
    ticketId: 'MUN-CER-01',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
  {
    id: 'staff-dcc-majd',
    name: 'Majd',
    email: 'majd.dcc@westmun.org',
    customTitle: 'Head of DCC',
    password: '2680',
    role: 'dcc',
    accessKey: '2680',
    assignedGate: 'DCC Control Room',
    ticketId: 'MUN-DCC-01',
    canScan: false,
    canManualCheckIn: false,
    canRevokeCheckIn: false,
    canManageStaff: false,
    canExportData: true,
    isActive: true,
    lastActiveTime: new Date().toISOString(),
  },
];

// All official credential passes for WESTMUN.
// Each person is listed with their exact designated role written for them.
const INITIAL_GUESTS: Guest[] = [
  // Executive Board & Leadership
  {
    id: 'g-exec-rakan',
    name: 'Rakan Almerbed',
    ticketId: 'MUN-EXEC-01',
    category: 'VIP',
    role: 'Secretary General',
    tableOrSeat: 'Executive Board',
    notes: 'Executive Board & Leadership',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-exec-yousef',
    name: 'Yousef Saifi',
    ticketId: 'MUN-EXEC-02',
    category: 'VIP',
    role: 'Deputy Secretary General',
    tableOrSeat: 'Executive Board',
    notes: 'Executive Board & Leadership',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-exec-fahad',
    name: 'Zain Firas',
    ticketId: 'MUN-EXEC-03',
    category: 'VIP',
    role: 'Under Secretary-General',
    tableOrSeat: 'Executive Board',
    notes: 'Executive Board & Leadership',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-exec-muaz',
    name: 'Muaz El Amir',
    ticketId: 'MUN-EXEC-04',
    category: 'VIP',
    role: 'Senior Advisor',
    tableOrSeat: 'Executive Board',
    notes: 'Executive Board & Leadership',
    status: 'Pending',
    scanCount: 0,
  },

  // Marketing
  {
    id: 'g-mkt-naya',
    name: 'Naya',
    ticketId: 'MUN-MKT-01',
    category: 'Staff',
    role: 'Head of Marketing',
    tableOrSeat: 'Marketing Hub',
    notes: 'Marketing Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-mkt-sama',
    name: 'Sama Sameh',
    ticketId: 'MUN-MKT-02',
    category: 'Staff',
    role: 'Co-Head of Marketing',
    tableOrSeat: 'Marketing Hub',
    notes: 'Marketing Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-mkt-jayda',
    name: 'Jadiya',
    ticketId: 'MUN-MKT-03',
    category: 'Staff',
    role: 'Marketing Member',
    tableOrSeat: 'Marketing Hub',
    notes: 'Marketing Department',
    status: 'Pending',
    scanCount: 0,
  },

  // Design
  {
    id: 'g-des-mallak',
    name: 'Mallak Abbas',
    ticketId: 'MUN-DES-01',
    category: 'Staff',
    role: 'Head of Design',
    tableOrSeat: 'Design Studio',
    notes: 'Design Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-des-saud',
    name: 'Saud Alanazi',
    ticketId: 'MUN-DES-02',
    category: 'Staff',
    role: 'Co-Heads of Design',
    tableOrSeat: 'Design Studio',
    notes: 'Design Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-des-layan',
    name: 'Layan Ahmed',
    ticketId: 'MUN-DES-03',
    category: 'Staff',
    role: 'Designer',
    tableOrSeat: 'Design Studio',
    notes: 'Design Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-des-aya',
    name: 'Aya Nezar',
    ticketId: 'MUN-DES-04',
    category: 'Staff',
    role: 'Designer',
    tableOrSeat: 'Design Studio',
    notes: 'Design Department',
    status: 'Pending',
    scanCount: 0,
  },

  // Media & Press
  {
    id: 'g-med-hashem',
    name: 'Hashem',
    ticketId: 'MUN-MED-01',
    category: 'Press',
    role: 'Co-Head of Media/Press',
    tableOrSeat: 'Media Gallery',
    notes: 'Media & Press Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-med-fahad',
    name: 'Fahad Al Kendi',
    ticketId: 'MUN-MED-02',
    category: 'Press',
    role: 'Head of Male Media',
    tableOrSeat: 'Media Gallery',
    notes: 'Media & Press Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-med-selena',
    name: 'Noor',
    ticketId: 'MUN-MED-03',
    category: 'Press',
    role: 'Head of Female Media',
    tableOrSeat: 'Media Gallery',
    notes: 'Media & Press Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-med-mohammed',
    name: 'Mohammed Al Nahas',
    ticketId: 'MUN-MED-04',
    category: 'Press',
    role: 'Head of Male Press',
    tableOrSeat: 'Press Room',
    notes: 'Media & Press Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-med-dana',
    name: 'Dana Alnajar',
    ticketId: 'MUN-MED-05',
    category: 'Press',
    role: 'Head of Female Press',
    tableOrSeat: 'Press Room',
    notes: 'Media & Press Department',
    status: 'Pending',
    scanCount: 0,
  },

  // IT (Can scan + can add members to IT team)
  {
    id: 'g-it-ahmed',
    name: 'Ahmed Magdi',
    ticketId: 'MUN-IT-01',
    category: 'Staff',
    role: 'Admin of IT',
    tableOrSeat: 'IT Command',
    notes: 'IT Department • Admin of IT • Authorized Scanner',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-it-saleh',
    name: 'Saleh Samaha',
    ticketId: 'MUN-IT-02',
    category: 'Staff',
    role: 'Co-Head of IT',
    tableOrSeat: 'IT Command',
    notes: 'IT Department • Authorized Scanner',
    status: 'Pending',
    scanCount: 0,
  },

  // Security (Can scan + can add members to Security team)
  {
    id: 'g-sec-lead',
    name: 'Security Lead',
    ticketId: 'MUN-SEC-LEAD-01',
    category: 'Staff',
    role: 'Head of Security',
    tableOrSeat: 'Main Entrance Gate',
    notes: 'Security Department • Authorized Scanner',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-sec-officer',
    name: 'Security Officer',
    ticketId: 'MUN-SEC-OFF-02',
    category: 'Staff',
    role: 'Security Officer',
    tableOrSeat: 'Access Control',
    notes: 'Security Department • Authorized Scanner',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-sec-yusef',
    name: 'Yusef Saad',
    ticketId: 'MUN-SEC-01',
    category: 'Staff',
    role: 'Head of Male Security',
    tableOrSeat: 'Access Control Gate',
    notes: 'Security Department • Authorized Scanner',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-sec-najla',
    name: 'Najla Rami',
    ticketId: 'MUN-SEC-02',
    category: 'Staff',
    role: 'Head of Female Security',
    tableOrSeat: 'Access Control Gate',
    notes: 'Security Department • Authorized Scanner',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-sec-bushra',
    name: 'Bushra Ismail',
    ticketId: 'MUN-SEC-03',
    category: 'Staff',
    role: 'Co-Head of Security',
    tableOrSeat: 'Access Control Gate',
    notes: 'Security Department • Authorized Scanner',
    status: 'Pending',
    scanCount: 0,
  },

  // Volunteers (Vols)
  {
    id: 'g-vol-saad',
    name: 'Saad Usman',
    ticketId: 'MUN-VOL-01',
    category: 'Staff',
    role: 'Head of Male Vols',
    tableOrSeat: 'Floor Operations',
    notes: 'Volunteers (Vols) Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-vol-maram',
    name: 'Maram Ali',
    ticketId: 'MUN-VOL-02',
    category: 'Staff',
    role: 'Head of Female Vols',
    tableOrSeat: 'Floor Operations',
    notes: 'Volunteers (Vols) Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-vol-younis',
    name: 'Younis',
    ticketId: 'MUN-VOL-04',
    category: 'Staff',
    role: 'Co-Head of Vols',
    tableOrSeat: 'Floor Operations',
    notes: 'Volunteers (Vols) Department',
    status: 'Pending',
    scanCount: 0,
  },

  // Other Departments
  {
    id: 'g-log-ahmed',
    name: 'Ahmed El Amir',
    ticketId: 'MUN-LOG-01',
    category: 'Staff',
    role: 'Head of Logistics',
    tableOrSeat: 'Logistics Center',
    notes: 'Logistics Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-pr-mazen',
    name: 'Mazen Alaa',
    ticketId: 'MUN-PR-01',
    category: 'Staff',
    role: 'Head of PR',
    tableOrSeat: 'VIP Relations',
    notes: 'Public Relations (PR) Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-hr-hoorein',
    name: 'Hoorein',
    ticketId: 'MUN-HR-01',
    category: 'Staff',
    role: 'Head of HR',
    tableOrSeat: 'HR Operations',
    notes: 'Human Resources (HR) Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-hr-seif',
    name: 'Seif Ayman',
    ticketId: 'MUN-HR-02',
    category: 'Staff',
    role: 'Head of HR',
    tableOrSeat: 'HR Operations',
    notes: 'Human Resources (HR) Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-cer-sultana',
    name: 'Sultana Al Fajar',
    ticketId: 'MUN-CER-01',
    category: 'Staff',
    role: 'Head of Ceremonies',
    tableOrSeat: 'Ceremonies Stage',
    notes: 'Ceremonies Department',
    status: 'Pending',
    scanCount: 0,
  },
  {
    id: 'g-dcc-majd',
    name: 'Majd',
    ticketId: 'MUN-DCC-01',
    category: 'Staff',
    role: 'Head of DCC',
    tableOrSeat: 'DCC Control Room',
    notes: 'Digital Committee Control (DCC) Department',
    status: 'Pending',
    scanCount: 0,
  },
];

const VenueContext = createContext<VenueContextType | null>(null);

export const VenueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guests, setGuests] = useState<Guest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GUESTS);
      if (saved) {
        const parsed: Guest[] = JSON.parse(saved);
        // Map and update existing people directly — no extra people created
        const updated = parsed.map((g) => {
          if (g.id === 'g-exec-fahad' || g.role === 'Under Secretary-General' || g.name.toLowerCase().includes('fahad')) {
            return { ...g, name: 'Zain Firas', role: 'Under Secretary-General' };
          }
          if (g.id === 'g-mkt-naya' || g.name.toLowerCase() === 'naya barakat') {
            return { ...g, name: 'Naya', role: 'Head of Marketing' };
          }
          if (g.id === 'g-mkt-jayda' || g.name.toLowerCase().includes('jayda')) {
            return { ...g, name: 'Jadiya', role: 'Marketing Member' };
          }
          if (g.id === 'g-med-selena' || g.name.toLowerCase().includes('selena')) {
            return { ...g, name: 'Noor', role: 'Head of Female Media' };
          }
          if (g.id === 'g-med-dana') {
            return { ...g, name: 'Dana Alnajar', role: 'Head of Female Press' };
          }
          if (g.id === 'g-cer-sultana') {
            return { ...g, name: 'Sultana Al Fajar', role: 'Head of Ceremonies' };
          }
          return g;
        });

        // Deduplicate by ID so no extra people are added
        const seen = new Set<string>();
        return updated.filter((g) => {
          if (seen.has(g.id)) return false;
          seen.add(g.id);
          return true;
        });
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_GUESTS;
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STAFF);
      if (saved) {
        const parsed: StaffMember[] = JSON.parse(saved);
        // Map and update existing people directly — do NOT add new people!
        const updated = parsed.map((s) => {
          // Under Secretary-General is Zain Firas
          if (
            s.id === 'staff-fahad-usg' ||
            s.customTitle === 'Under Secretary-General' ||
            s.name.toLowerCase().includes('fahad')
          ) {
            return {
              ...s,
              id: 'staff-fahad-usg',
              name: 'Zain Firas',
              email: 'zain.firas@westmun.org',
              customTitle: 'Under Secretary-General',
              role: 'executive' as StaffRole,
            };
          }
          // Naya
          if (s.id === 'staff-mkt-naya' || s.name.toLowerCase() === 'naya barakat') {
            return {
              ...s,
              id: 'staff-mkt-naya',
              name: 'Naya',
              email: 'naya.barakat@westmun.org',
              customTitle: 'Head of Marketing',
              role: 'marketing' as StaffRole,
            };
          }
          // Jadiya
          if (s.id === 'staff-mkt-jayda' || s.name.toLowerCase().includes('jayda')) {
            return {
              ...s,
              id: 'staff-mkt-jayda',
              name: 'Jadiya',
              email: 'jadiya.marketing@westmun.org',
              customTitle: 'Marketing Member',
              role: 'marketing' as StaffRole,
            };
          }
          // Noor
          if (s.id === 'staff-med-selena' || s.name.toLowerCase().includes('selena')) {
            return {
              ...s,
              id: 'staff-med-selena',
              name: 'Noor',
              email: 'noor.media@westmun.org',
              customTitle: 'Head of Female Media',
              role: 'media_and_press' as StaffRole,
            };
          }
          // Dana Alnajar
          if (s.id === 'staff-med-dana') {
            return {
              ...s,
              id: 'staff-med-dana',
              name: 'Dana Alnajar',
              email: 'dana.alnajar@westmun.org',
              customTitle: 'Head of Female Press',
              role: 'media_and_press' as StaffRole,
            };
          }
          // Sultana Al Fajar
          if (s.id === 'staff-cer-sultana') {
            return {
              ...s,
              id: 'staff-cer-sultana',
              name: 'Sultana Al Fajar',
              email: 'sultana.ceremonies@westmun.org',
              customTitle: 'Head of Ceremonies',
              role: 'ceremonies' as StaffRole,
            };
          }
          // Remove any secretary role -> change to security
          if ((s.role as string) === 'secretary') {
            return {
              ...s,
              role: 'security' as StaffRole,
              canScan: true,
              canManualCheckIn: true,
              canRevokeCheckIn: true,
              canManageStaff: true,
              canExportData: true,
              assignedGate: s.assignedGate === 'Secretariat Hub' ? 'Access Control' : s.assignedGate,
              customTitle: s.customTitle ? s.customTitle.replace(/Sec\b|Secretariat/g, 'Security') : 'Security Officer',
            };
          }
          return s;
        });

        // Ensure we do NOT retain duplicate people or extra people beyond the 32 official members
        const seen = new Set<string>();
        return updated.filter((s) => {
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STAFF;
  });

  // MANDATORY LOGIN REQUIREMENT:
  // User MUST log in with an account beforehand!
  // No automatic fallback to staffMembers[0]; null means unauthenticated.
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(() => {
    try {
      const savedAuthId = localStorage.getItem(STORAGE_KEY_AUTH);
      if (savedAuthId) {
        const found = staffMembers.find((s) => s.id === savedAuthId);
        if (found) {
          if ((found.role as string) === 'secretary') {
            return {
              ...found,
              role: 'security' as StaffRole,
              canScan: true,
              canManualCheckIn: true,
              canRevokeCheckIn: true,
              canManageStaff: true,
            };
          }
          return found;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
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
    return [];
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
    const channel = new BroadcastChannel('mun_venue_sync');

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
        const channel = new BroadcastChannel('mun_venue_sync');
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
  // Password-Free Diplomatic Authentication method
  const authenticateByIdentifier = useCallback(
    (identifier: string): { success: boolean; error?: string; user?: StaffMember } => {
      const cleanId = identifier.trim().toLowerCase();
      if (!cleanId) {
        return {
          success: false,
          error: 'Please enter your diplomatic email or delegate identifier.',
        };
      }

      // Dedicated recognition for Admin of IT AhmedMagdi
      const isAhmedMagdi =
        cleanId === 'ahmedmagdi' ||
        cleanId === 'ahmed magdi' ||
        cleanId === 'ahmed' ||
        cleanId === 'ahmed.magdi' ||
        cleanId === 'ahmedmagdialkik@gmail.com' ||
        cleanId.replace(/\s+/g, '') === 'ahmedmagdi';

      const user = staffMembers.find((s) => {
        if (
          isAhmedMagdi &&
          (s.id === 'staff-it-ahmed' ||
            s.name.toLowerCase().includes('ahmed magdi') ||
            s.email.toLowerCase() === 'ahmedmagdi')
        ) {
          return true;
        }

        const sEmail = (s.email || '').toLowerCase();
        const sName = (s.name || '').toLowerCase();
        const sNormalizedName = sName.replace(/\s+/g, '');
        const sKey = (s.accessKey || '').toLowerCase();
        const sTicket = (s.ticketId || '').toLowerCase();

        const sFirstName = sName.split(' ')[0];

        return (
          sEmail === cleanId ||
          sName === cleanId ||
          sNormalizedName === cleanId.replace(/\s+/g, '') ||
          sFirstName === cleanId ||
          sKey === cleanId ||
          sTicket === cleanId
        );
      });

      if (!user) {
        return {
          success: false,
          error: 'Diplomatic credential not found on the accredited roster. Please verify your official email or delegate ID.',
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          error: 'This credential account has been deactivated by the Secretariat.',
        };
      }

      setCurrentUser(user);
      return { success: true, user };
    },
    [staffMembers]
  );

  // Exact Multi-User Login Validation against existing members database
  const login = useCallback(
    (rawUsername: string, rawPassword?: string): { success: boolean; user?: StaffMember; error?: string } => {
      if (!rawUsername || !rawUsername.trim()) {
        return { success: false, error: '❌ Invalid username.' };
      }

      // Forgiving username normalization:
      // Ignore uppercase vs lowercase, extra spaces, leading spaces, trailing spaces, multiple spaces
      const trimmed = rawUsername.trim().toLowerCase();
      const collapsed = trimmed.replace(/\s+/g, ' ');
      const stripped = trimmed.replace(/\s+/g, '');

      // Find matching candidate(s) in existing staff members
      const matchingUsers = staffMembers.filter((s) => {
        const sNameLower = s.name.trim().toLowerCase();
        const sNameCollapsed = sNameLower.replace(/\s+/g, ' ');
        const sNameStripped = sNameLower.replace(/\s+/g, '');
        const sFirstName = sNameCollapsed.split(' ')[0];

        const sEmailLower = s.email.trim().toLowerCase();
        const sEmailUser = sEmailLower.split('@')[0];
        const sEmailStripped = sEmailLower.replace(/\s+/g, '');

        // Standard name/email match
        if (
          sNameCollapsed === collapsed ||
          sNameStripped === stripped ||
          sFirstName === collapsed ||
          sEmailLower === trimmed ||
          sEmailStripped === stripped ||
          sEmailUser === collapsed ||
          sEmailUser === stripped
        ) {
          return true;
        }

        // Account Aliases for USG and Freshmen
        if (s.id === 'staff-fahad-usg' && (collapsed === 'zain firas' || collapsed === 'zain' || collapsed === 'fahad')) return true;
        if (s.id === 'staff-cer-sultana' && (collapsed === 'sultana al fajar' || collapsed === 'sultana')) return true;
        if (s.id === 'staff-mkt-naya' && (collapsed === 'naya' || collapsed === 'naya barakat')) return true;
        if (s.id === 'staff-mkt-jayda' && (collapsed === 'jadiya' || collapsed === 'jayda' || collapsed === 'jayda yasser')) return true;
        if (s.id === 'staff-med-selena' && (collapsed === 'noor' || collapsed === 'nour' || collapsed === 'selena')) return true;
        if (s.id === 'staff-med-dana' && (collapsed === 'dana alnajar' || collapsed === 'dana')) return true;

        return false;
      });

      if (matchingUsers.length === 0) {
        return {
          success: false,
          error: '❌ Invalid username.',
        };
      }

      // Exact case-sensitive password match
      if (!rawPassword) {
        return {
          success: false,
          error: '❌ Incorrect password.',
        };
      }

      // Match user with exact password (or trimmed numeric pin)
      const cleanPass = rawPassword.trim();
      const authenticatedUser = matchingUsers.find(
        (s) => s.password === rawPassword || s.password === cleanPass || s.accessKey === cleanPass
      );

      if (!authenticatedUser) {
        return {
          success: false,
          error: '❌ Incorrect password.',
        };
      }

      if (!authenticatedUser.isActive) {
        return {
          success: false,
          error: '❌ Account inactive.',
        };
      }

      let finalUser = authenticatedUser;
      if (authenticatedUser.id === 'staff-fahad-usg') {
        finalUser = { ...authenticatedUser, name: 'Zain Firas', customTitle: 'Under Secretary-General' };
      } else if (authenticatedUser.id === 'staff-mkt-naya') {
        finalUser = { ...authenticatedUser, name: 'Naya' };
      } else if (authenticatedUser.id === 'staff-mkt-jayda') {
        finalUser = { ...authenticatedUser, name: 'Jadiya' };
      } else if (authenticatedUser.id === 'staff-med-selena') {
        finalUser = { ...authenticatedUser, name: 'Noor' };
      } else if (authenticatedUser.id === 'staff-med-dana') {
        finalUser = { ...authenticatedUser, name: 'Dana Alnajar' };
      } else if (authenticatedUser.id === 'staff-cer-sultana') {
        finalUser = { ...authenticatedUser, name: 'Sultana Al Fajar' };
      }

      setCurrentUser(finalUser);
      return { success: true, user: finalUser };
    },
    [staffMembers]
  );

  // Helper to generate a unique 4-digit numeric password (0000 - 9999)
  const generateUnique4DigitPassword = useCallback(
    (excludeStaffId?: string): string => {
      const existingPasswords = new Set(
        staffMembers
          .filter((s) => s.id !== excludeStaffId)
          .map((s) => s.password)
          .filter(Boolean)
      );
      existingPasswords.add('344'); // Reserved strictly for Ahmed Magdi

      for (let attempts = 0; attempts < 10000; attempts++) {
        const pin = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        if (!existingPasswords.has(pin)) {
          return pin;
        }
      }
      return String(Math.floor(1000 + Math.random() * 9000));
    },
    [staffMembers]
  );

  // Reset a staff member's password (Administrator Feature)
  const resetStaffPassword = useCallback(
    (staffId: string, customPassword?: string): { success: boolean; newPassword?: string; error?: string } => {
      const target = staffMembers.find((s) => s.id === staffId);
      if (!target) {
        return { success: false, error: 'Member not found.' };
      }

      // Ahmed Magdi Exception: Password MUST remain 344
      const isAhmedMagdi =
        target.id === 'staff-it-ahmed' ||
        target.name.trim().toLowerCase() === 'ahmed magdi';

      if (isAhmedMagdi) {
        return {
          success: false,
          error: 'The account belonging to Ahmed Magdi must use the password: 344. It cannot be altered.',
        };
      }

      let newPin = '';
      if (customPassword && customPassword.trim()) {
        const clean = customPassword.trim();
        if (!/^\d{4}$/.test(clean)) {
          return {
            success: false,
            error: 'Password must be exactly 4 numeric digits (0000–9999).',
          };
        }

        // Verify uniqueness across all 32 members
        const collision = staffMembers.find(
          (s) => s.id !== staffId && (s.password === clean || s.accessKey === clean)
        );
        if (collision) {
          return {
            success: false,
            error: `Password ${clean} is already assigned to ${collision.name}. No two users may share the same password.`,
          };
        }
        if (clean === '344') {
          return {
            success: false,
            error: 'Password 344 is reserved exclusively for Ahmed Magdi.',
          };
        }
        newPin = clean;
      } else {
        newPin = generateUnique4DigitPassword(staffId);
      }

      // Persist permanently with user's account
      setStaffMembers((prev) =>
        prev.map((s) =>
          s.id === staffId
            ? { ...s, password: newPin, accessKey: newPin }
            : s
        )
      );

      // If current logged-in user is this member, update active session
      if (currentUser && currentUser.id === staffId) {
        setCurrentUser((prev) => (prev ? { ...prev, password: newPin, accessKey: newPin } : null));
      }

      return { success: true, newPassword: newPin };
    },
    [staffMembers, currentUser, generateUnique4DigitPassword]
  );

  // Generate a new random 4-digit password for a specific member
  const generateNewStaffPassword = useCallback(
    (staffId: string): { success: boolean; newPassword?: string; error?: string } => {
      return resetStaffPassword(staffId);
    },
    [resetStaffPassword]
  );

  const register = useCallback(
    (staffData: Omit<StaffMember, 'id'>): { success: boolean; error?: string } => {
      if (!staffData.email || !staffData.name || !staffData.password) {
        return { success: false, error: 'Name, email, and password are required.' };
      }

      const existing = staffMembers.find(
        (s) => s.email.toLowerCase() === staffData.email.toLowerCase()
      );
      if (existing) {
        return { success: false, error: 'A user with this email address already exists.' };
      }

      const canScan = isScannerOrAdminRole(staffData.role);
      const generatedPin = staffData.accessKey || String(Math.floor(1000 + Math.random() * 9000));
      const generatedTicketId = `MUN-STAFF-${staffData.role.substring(0, 3).toUpperCase()}-${generatedPin}`;

      const newMember: StaffMember = {
        ...staffData,
        id: `staff-${Date.now()}`,
        accessKey: generatedPin,
        ticketId: generatedTicketId,
        assignedGate: 'MUN Venue',
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
          tableOrSeat: 'MUN Venue',
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
    localStorage.removeItem(STORAGE_KEY_AUTH);
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

  const loginAsStaffMember = useCallback(
    (member: StaffMember) => {
      setStaffMembers((prev) => {
        const index = prev.findIndex((s) => s.id === member.id || s.email.toLowerCase() === member.email.toLowerCase());
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...member, isActive: true };
          return updated;
        }
        return [...prev, member];
      });
      setCurrentUser(member);
      localStorage.setItem(STORAGE_KEY_AUTH, member.id);
    },
    []
  );

  // Process QR / Barcode Scan
  // Mode can be 'entry' (default) or 'exit' (when someone leaves)
  const processScan = useCallback(
    (rawCode: string, mode: 'entry' | 'exit' = 'entry'): ScanResult => {
      const cleanCode = (rawCode || '').trim();
      const nowIso = new Date().toISOString();

      const isSecurityOrAdminScanner = isScannerOrAdminRole(currentUser?.role);
      const currentScannerName = isSecurityOrAdminScanner && currentUser
        ? `${currentUser.name} (${ROLE_LABELS[currentUser.role]?.title || 'Security'})`
        : 'Mohamed Magdi (Head of IT)';
      const currentGate = 'MUN Venue';

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
            tableOrSeat: 'MUN Venue',
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
          message: 'Ticket ID not found in MUN Venue manifest.',
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
          reason: 'Ticket not found in MUN Venue guest manifest',
        };

        const updatedLogs = [newLog, ...logs];
        setLogs(updatedLogs);
        broadcastUpdate(guests, updatedLogs);
        setLastScanResult(res);
        return res;
      }

      const guest = guests[guestIndex];

      // ==========================================
      // EXIT MODE SCAN: Someone is leaving MUN Venue
      // ==========================================
      if (mode === 'exit') {
        if (guest.status === 'Checked-In') {
          // Confirm exit! Now they can re-scan later!
          const updatedGuest: Guest = {
            ...guest,
            status: 'Left',
            lastExitedTime: nowIso,
            lastExitedBy: currentScannerName,
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
            type: 'CHECK_OUT',
            reason: 'Guest left MUN Venue. Eligible for re-entry scan.',
          };

          const updatedLogs = [newLog, ...logs];
          setGuests(updatedGuests);
          setLogs(updatedLogs);
          broadcastUpdate(updatedGuests, updatedLogs);

          if (settings.soundEnabled) playSuccessChime();
          if (settings.vibrationEnabled) vibrateSuccess();

          const res: ScanResult = {
            type: 'EXIT_SUCCESS',
            guest: updatedGuest,
            scannedCode: cleanCode,
            timestamp: nowIso,
            message: `Exit Recorded: ${guest.name} has departed MUN Venue. QR code is now unlocked for re-entry scan.`,
          };

          setLastScanResult(res);
          return res;
        } else {
          // Not currently in venue
          const res: ScanResult = {
            type: 'NOT_CHECKED_IN',
            guest,
            scannedCode: cleanCode,
            timestamp: nowIso,
            message: `${guest.name} is not currently checked in to MUN Venue (${guest.status === 'Left' ? 'Already departed' : 'Has not entered yet'}).`,
          };
          if (settings.soundEnabled) playWarningBuzzer();
          if (settings.vibrationEnabled) vibrateWarning();
          setLastScanResult(res);
          return res;
        }
      }

      // ==========================================
      // ENTRY MODE SCAN: Someone is entering
      // ==========================================

      // RULE: Make sure the QR code can be scanned only once UNLESS someone leaves, then they can re-scan!
      if (guest.status === 'Checked-In') {
        // Person is currently inside MUN Venue! Re-scan is strictly blocked!
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
          message: `ENTRY DENIED: QR Code is already scanned and currently inside MUN Venue. QR code can only be scanned once unless person leaves first. (Attempt #${nextAttemptNum})`,
          previousCheckIn: {
            time: guest.checkedInTime || 'Unknown',
            scanner: guest.checkedInBy || 'Security',
            gate: 'MUN Venue',
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
          reason: `SECURITY ALERT: Blocked re-scan attempt #${nextAttemptNum} at MUN Venue. Already inside since ${guest.checkedInTime ? new Date(guest.checkedInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'earlier'}. Person must leave before re-scanning.`,
        };

        const updatedLogs = [newLog, ...logs];
        setGuests(updatedGuests);
        setLogs(updatedLogs);
        broadcastUpdate(updatedGuests, updatedLogs);
        setLastScanResult(res);
        return res;
      }

      // If person previously left ('Left'), RE-ENTRY IS GRANTED!
      const isReEntry = guest.status === 'Left';

      const updatedGuest: Guest = {
        ...guest,
        status: 'Checked-In',
        scanCount: (guest.scanCount || 0) + 1,
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
        type: isReEntry ? 'RE_ENTRY' : 'CHECK_IN',
        attemptCount: updatedGuest.scanCount,
        reason: isReEntry ? 'Re-entry validated after departure from MUN Venue.' : 'Initial check-in.',
      };

      const updatedLogs = [newLog, ...logs];
      setGuests(updatedGuests);
      setLogs(updatedLogs);
      broadcastUpdate(updatedGuests, updatedLogs);

      if (settings.soundEnabled) playSuccessChime();
      if (settings.vibrationEnabled) vibrateSuccess();

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#f59e0b', '#fbbf24', '#ffffff'],
        });
      } catch {
        // ignore
      }

      const res: ScanResult = {
        type: isReEntry ? 'RE_ENTRY_SUCCESS' : 'SUCCESS',
        guest: updatedGuest,
        scannedCode: cleanCode,
        timestamp: nowIso,
        message: isReEntry
          ? `Re-Entry Granted: Welcome back to MUN Venue, ${guest.name}!`
          : `Access Granted: Welcome to MUN Venue, ${guest.name}!`,
      };

      setLastScanResult(res);
      return res;
    },
    [guests, logs, currentUser, settings, broadcastUpdate]
  );

  // Mark a person as 'Left' (allows re-scanning their QR code)
  const markGuestLeft = useCallback(
    (guestId: string): boolean => {
      const idx = guests.findIndex((g) => g.id === guestId);
      if (idx === -1) return false;
      const guest = guests[idx];
      if (guest.status !== 'Checked-In') return false;

      const nowIso = new Date().toISOString();
      const currentScannerName = currentUser
        ? `${currentUser.name} (${ROLE_LABELS[currentUser.role]?.title || 'Security'})`
        : 'Security Officer';

      const updatedGuest: Guest = {
        ...guest,
        status: 'Left',
        lastExitedTime: nowIso,
        lastExitedBy: currentScannerName,
      };

      const updatedGuests = [...guests];
      updatedGuests[idx] = updatedGuest;

      const newLog: CheckInLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ticketId: guest.ticketId,
        guestName: guest.name,
        category: guest.category,
        gate: 'MUN Venue',
        scannerName: currentScannerName,
        timestamp: nowIso,
        type: 'CHECK_OUT',
        reason: 'Guest marked as Left MUN Venue. Unlocked for re-entry scan.',
      };

      const updatedLogs = [newLog, ...logs];
      setGuests(updatedGuests);
      setLogs(updatedLogs);
      broadcastUpdate(updatedGuests, updatedLogs);

      if (settings.soundEnabled) playSuccessChime();
      return true;
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
      const currentScannerName = currentUser ? `${currentUser.name} (Manual)` : 'Security (Manual)';
      const isReEntry = guest.status === 'Left';

      const updatedGuest: Guest = {
        ...guest,
        status: 'Checked-In',
        scanCount: (guest.scanCount || 0) + 1,
        deniedAttempts: [],
        checkedInTime: nowIso,
        checkedInBy: currentScannerName,
        checkedInGate: 'MUN Venue',
      };

      const updatedGuests = [...guests];
      updatedGuests[idx] = updatedGuest;

      const newLog: CheckInLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ticketId: guest.ticketId,
        guestName: guest.name,
        category: guest.category,
        gate: 'MUN Venue',
        scannerName: currentScannerName,
        timestamp: nowIso,
        type: isReEntry ? 'RE_ENTRY' : 'CHECK_IN',
        attemptCount: updatedGuest.scanCount,
        reason: isReEntry ? 'Manual re-entry check-in.' : 'Manual entry check-in.',
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

      const nowIso = new Date().toISOString();
      const currentScannerName = currentUser ? currentUser.name : 'Security Admin';

      const updatedGuest: Guest = {
        ...guest,
        status: 'Pending',
        scanCount: 0,
        deniedAttempts: [],
        checkedInTime: null,
        checkedInBy: null,
        checkedInGate: null,
        lastExitedTime: null,
        lastExitedBy: null,
      };

      const updatedGuests = [...guests];
      updatedGuests[idx] = updatedGuest;

      const newLog: CheckInLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ticketId: guest.ticketId,
        guestName: guest.name,
        category: guest.category,
        gate: 'MUN Venue',
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

      const incidentLog: CheckInLogEntry = {
        id: `incident-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ticketId: guest.ticketId,
        guestName: guest.name,
        category: guest.category,
        gate: 'MUN Venue',
        scannerName: currentScannerName,
        timestamp: nowIso,
        type: 'SECURITY_FLAG',
        reason: reason || 'Counterfeit or shared QR screenshot flagged for interception.',
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
    (newGuests: Partial<Guest>[]): { added: number; updated: number } => {
      let added = 0;
      let updated = 0;
      const currentGuests = [...guests];

      newGuests.forEach((item) => {
        if (!item.name || !item.ticketId) return;
        const existingIdx = currentGuests.findIndex(
          (g) => g.ticketId.toLowerCase() === item.ticketId!.toLowerCase()
        );

        if (existingIdx >= 0) {
          currentGuests[existingIdx] = {
            ...currentGuests[existingIdx],
            ...item,
          };
          updated++;
        } else {
          currentGuests.push({
            id: `g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: item.name,
            ticketId: item.ticketId,
            category: item.category || 'General Admission',
            tableOrSeat: item.tableOrSeat || 'MUN Venue',
            notes: item.notes || '',
            status: item.status || 'Pending',
            scanCount: item.scanCount || 0,
            deniedAttempts: [],
          });
          added++;
        }
      });

      setGuests(currentGuests);
      broadcastUpdate(currentGuests, logs);
      return { added, updated };
    },
    [guests, logs, broadcastUpdate]
  );

  const resetAllCheckIns = useCallback(() => {
    const resetGuests = guests.map((g) => ({
      ...g,
      status: 'Pending' as const,
      scanCount: 0,
      deniedAttempts: [],
      checkedInTime: null,
      checkedInBy: null,
      checkedInGate: null,
      lastExitedTime: null,
      lastExitedBy: null,
    }));
    setGuests(resetGuests);
    setLogs([]);
    broadcastUpdate(resetGuests, []);
  }, [guests, broadcastUpdate]);

  const loadSampleData = useCallback(() => {
    setGuests(INITIAL_GUESTS);
    setLogs([]);
    broadcastUpdate(INITIAL_GUESTS, []);
  }, [broadcastUpdate]);

  const addStaffMember = useCallback((staffData: Omit<StaffMember, 'id'>): StaffMember => {
    const canScan = isScannerOrAdminRole(staffData.role);
    const accessPin = staffData.accessKey || String(Math.floor(1000 + Math.random() * 9000));
    const ticketId = staffData.ticketId || `MUN-STAFF-${staffData.role.substring(0, 3).toUpperCase()}-${accessPin}`;
    const roleTitle = staffData.customTitle || ROLE_LABELS[staffData.role]?.title || staffData.role;

    const newStaff: StaffMember = {
      ...staffData,
      id: `staff-${Date.now()}`,
      customTitle: roleTitle,
      accessKey: accessPin,
      ticketId,
      assignedGate: staffData.assignedGate || 'MUN Venue',
      canScan,
      canManualCheckIn: canScan,
      canRevokeCheckIn: canScan,
      canManageStaff: canScan,
      canExportData: true,
      isActive: true,
      lastActiveTime: new Date().toISOString(),
    };
    setStaffMembers((prev) => [...prev, newStaff]);

    setGuests((prev) => [
      ...prev,
      {
        id: `g-staff-${newStaff.id}`,
        name: newStaff.name,
        ticketId,
        category: newStaff.role === 'media_and_press' ? 'Press' : 'Staff',
        tableOrSeat: newStaff.assignedGate || 'MUN Venue',
        notes: `${roleTitle} Credential Pass`,
        status: 'Pending',
        scanCount: 0,
      },
    ]);

    return newStaff;
  }, []);

  const updateStaffMember = useCallback((id: string, updates: Partial<StaffMember>) => {
    setStaffMembers((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const effectiveRole = updates.role || s.role;
          const canScan = isScannerOrAdminRole(effectiveRole);
          return {
            ...s,
            ...updates,
            ...(updates.role
              ? {
                  role: effectiveRole,
                  customTitle: updates.customTitle || ROLE_LABELS[effectiveRole]?.title || effectiveRole,
                  canScan,
                  canManualCheckIn: canScan,
                  canRevokeCheckIn: canScan,
                  canManageStaff: canScan,
                }
              : {}),
          };
        }
        return s;
      })
    );

    // Synchronize guest record if existing
    setGuests((prev) =>
      prev.map((g) => {
        if (g.id === `g-staff-${id}`) {
          const newRole = updates.role;
          const roleTitle = updates.customTitle || (newRole ? ROLE_LABELS[newRole]?.title : g.role);
          return {
            ...g,
            name: updates.name || g.name,
            role: roleTitle || g.role,
            category: newRole === 'media_and_press' ? 'Press' : 'Staff',
            notes: `${roleTitle || 'Staff'} Credential Pass`,
          };
        }
        return g;
      })
    );
  }, []);

  const removeStaffMember = useCallback((id: string) => {
    setStaffMembers((prev) => prev.filter((s) => s.id !== id));
    setGuests((prev) => prev.filter((g) => g.id !== `g-staff-${id}`));
  }, []);

  const updateSettings = useCallback((updates: Partial<VenueSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearLastScanResult = useCallback(() => {
    setLastScanResult(null);
  }, []);

  const stats = useMemo(() => {
    const totalGuests = guests.length;
    // CheckedInCount reflects who is CURRENTLY INSIDE MUN Venue
    const checkedInCount = guests.filter((g) => g.status === 'Checked-In').length;
    const leftCount = guests.filter((g) => g.status === 'Left').length;
    const pendingCount = guests.filter((g) => g.status === 'Pending').length;
    const capacity = settings.totalCapacity || 1200;
    const capacityRemaining = Math.max(0, capacity - checkedInCount);
    const capacityPercent = Math.min(100, Math.round((checkedInCount / capacity) * 100));

    const vipTotal = guests.filter((g) => g.category === 'VIP').length;
    const vipCheckedIn = guests.filter((g) => g.category === 'VIP' && g.status === 'Checked-In').length;

    const recentCheckIns = logs.slice(0, 10);

    return {
      totalGuests,
      checkedInCount,
      leftCount,
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
        authenticateByIdentifier,
        resetStaffPassword,
        generateNewStaffPassword,
        register,
        logout,
        switchAccountFast,
        loginAsStaffMember,
        processScan,
        markGuestLeft,
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
