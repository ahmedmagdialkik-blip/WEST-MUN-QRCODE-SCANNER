/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * West MUN Department Hierarchy & Team Delegation Utilities
 *
 * Allows all Heads and Co-Heads to:
 * - See who is with them on their team (co-heads and team members under them)
 * - Assign specific roles, directives, and stations for the people under them
 */

import { StaffMember, StaffRole, Guest, ROLE_LABELS } from '../types/venue';

export interface DepartmentMeta {
  role: StaffRole;
  title: string;
  shortName: string;
  description: string;
  badge: string;
  presetRoles: string[];
  suggestedStations: string[];
}

export const DEPARTMENTS: Record<StaffRole, DepartmentMeta> = {
  media_and_press: {
    role: 'media_and_press',
    title: 'Media & Press Department',
    shortName: 'Media & Press',
    description: 'Photography, journalism, live broadcasts, and media room operations.',
    badge: 'Press & Media',
    presetRoles: [
      'Lead Photographer',
      'Press Room Moderator',
      'Social Media Officer',
      'Red Carpet Anchor & Reporter',
      'Video & Film Director',
      'Interview Coordinator',
      'Photo Editor & Archiver',
      'Press Dispatcher',
      'Delegate Relations Reporter',
      'Media Tech Runner',
    ],
    suggestedStations: [
      'Media Gallery',
      'Press Room',
      'Red Carpet Zone',
      'Assembly Hall Camera Deck',
      'Editing Suite',
      'Main Stage Pit',
    ],
  },
  ceremonies: {
    role: 'ceremonies',
    title: 'Ceremonies Department',
    shortName: 'Ceremonies',
    description: 'Opening & closing ceremonies, stage direction, protocol, and dignitary reception.',
    badge: 'Ceremonies Pass',
    presetRoles: [
      'Stage Manager & Floor Director',
      'Audio-Visual & Lighting Director',
      'VIP Dignitary Protocol Officer',
      'National Anthem & Flag Ceremony Lead',
      'Keynote Speaker Liaison',
      'Awards & Certificates Coordinator',
      'Stage Usher & Escort Lead',
      'Ceremonial Floor Runner',
    ],
    suggestedStations: [
      'Ceremonies Main Stage',
      'Backstage Command',
      'VIP Holding Lounge',
      'Dignitary Reception Gate',
      'Audio-Visual Console',
    ],
  },
  designers: {
    role: 'designers',
    title: 'Design & Visual Arts Department',
    shortName: 'Designers',
    description: 'Visual branding, digital screen graphics, credentials design, and event aesthetics.',
    badge: 'Design Studio',
    presetRoles: [
      'Senior Graphic Designer',
      'Stage & Screen Visuals Lead',
      'Badge & Credential Designer',
      'Socials Brand Designer',
      'Print & Materials Coordinator',
      'Motion Graphics Specialist',
      'Signage & Wayfinding Artist',
    ],
    suggestedStations: [
      'Design Studio',
      'Media Command Center',
      'Printing & Credential Hub',
      'Assembly Hall Graphics Station',
    ],
  },
  marketing: {
    role: 'marketing',
    title: 'Marketing & Outreach Department',
    shortName: 'Marketing',
    description: 'Promotion, partner sponsorships, digital marketing, and delegate engagement.',
    badge: 'Marketing Hub',
    presetRoles: [
      'Outreach & Campaign Coordinator',
      'Sponsorship & Partner Liaison',
      'Digital Media Specialist',
      'Delegate Experience Lead',
      'Analytics & Engagement Officer',
      'Merchandising Specialist',
    ],
    suggestedStations: [
      'Marketing Hub',
      'Delegate Information Desk',
      'Partner Exhibition Hall',
      'Plenary Gallery',
    ],
  },
  dcc: {
    role: 'dcc',
    title: 'Digital Committee Control (DCC)',
    shortName: 'DCC',
    description: 'Digital resolution processing, screen broadcasting, and digital committee voting.',
    badge: 'DCC Control Room',
    presetRoles: [
      'Digital Systems Lead Operator',
      'Resolution Formatting Specialist',
      'Digital Voting Software Admin',
      'Committee Display Dispatcher',
      'Audio & Microphone Monitor',
      'Technical Committee Runner',
    ],
    suggestedStations: [
      'DCC Control Room',
      'Assembly Hall Tech Booth',
      'Committee Room 1',
      'Committee Room 2',
      'Security Tech Deck',
    ],
  },
  volunteers: {
    role: 'volunteers',
    title: 'Volunteers & Operations Department',
    shortName: 'Volunteers',
    description: 'Floor coordination, delegate assistance, logistics support, and session runners.',
    badge: 'Floor Operations',
    presetRoles: [
      'Assembly Hall Floor Lead',
      'VIP Escort & Dignitary Usher',
      'Registration Desk Coordinator',
      'Placard & Gavel Custodian',
      'Timer & Microphone Runner',
      'Delegate Hospitality Assistant',
      'Emergency Runner',
    ],
    suggestedStations: [
      'Floor Operations',
      'Grand Assembly Hall',
      'Registration Desk',
      'Diplomatic Corridors',
      'Dining & Refreshments Area',
    ],
  },
  logistics: {
    role: 'logistics',
    title: 'Logistics & Supply Department',
    shortName: 'Logistics',
    description: 'Venue physical operations, equipment, transport, catering, and supply distribution.',
    badge: 'Logistics Center',
    presetRoles: [
      'Catering & Hospitality Lead',
      'Venue Supplies Coordinator',
      'Signage & Wayfinding Lead',
      'Equipment & Tech Custodian',
      'Transport & Airport Liaison',
      'Emergency Supplies Runner',
    ],
    suggestedStations: [
      'Logistics Center',
      'Loading Dock',
      'Central Storage',
      'Main Hall Dispatch',
    ],
  },
  pr: {
    role: 'pr',
    title: 'Public Relations (PR) Department',
    shortName: 'PR',
    description: 'External diplomatic relations, embassy liaison, keynote speakers, and VIP hospitality.',
    badge: 'VIP Relations',
    presetRoles: [
      'Keynote Guest Host',
      'Embassy & Diplomatic Liaison',
      'Media & External Press Liaison',
      'VIP Relations Officer',
      'Executive Guest Concierge',
    ],
    suggestedStations: [
      'VIP Relations Suite',
      'Diplomatic Entrance',
      'Guest Lounge',
      'Executive Board Room',
    ],
  },
  hr: {
    role: 'hr',
    title: 'Human Resources (HR) Department',
    shortName: 'HR',
    description: 'Staff allocation, attendance monitoring, dispute mediation, and volunteer welfare.',
    badge: 'HR Operations',
    presetRoles: [
      'Staff Welfare & Health Officer',
      'Attendance & Roster Monitor',
      'Delegate Staffing Specialist',
      'Operations Conflict Mediator',
      'Shift Dispatch Coordinator',
    ],
    suggestedStations: [
      'HR Operations Office',
      'Staff Check-in Hub',
      'Volunteer Lounge',
    ],
  },
  security: {
    role: 'security',
    title: 'Security & Access Control Department',
    shortName: 'Security',
    description: 'Venue perimeter safety, door scan verification, access enforcement, and emergency response.',
    badge: 'Security Scanner',
    presetRoles: [
      'Main Gate Access Controller',
      'VIP Corridor Security Lead',
      'Door Scanner & Badge Validator',
      'Press Gallery Access Monitor',
      'Floor Patrol & Emergency Response',
      'Incident Dispatcher',
    ],
    suggestedStations: [
      'Main Entrance Gate',
      'Access Control Gate',
      'VIP Corridor Gate',
      'Diplomatic Main Gate',
      'Emergency Exit Checkpoints',
    ],
  },
  it: {
    role: 'it',
    title: 'IT & Technical Systems Department',
    shortName: 'IT Systems',
    description: 'Venue networking, scanner hardware, database servers, and system security.',
    badge: 'IT Hub',
    presetRoles: [
      'Network & Wi-Fi Engineer',
      'Scanner Hardware Specialist',
      'Audio-Visual Systems Tech',
      'Database & Systems Administrator',
      'Technical Helpdesk Lead',
    ],
    suggestedStations: [
      'Security & Tech Hub',
      'IT Command Center',
      'Server & Scanner Station',
    ],
  },
  executive: {
    role: 'executive',
    title: 'Executive Board & Leadership',
    shortName: 'Executive Board',
    description: 'Senior governance, crisis resolution, executive diplomatic oversight.',
    badge: 'Executive Pass',
    presetRoles: [
      'Deputy Secretary General',
      'Under Secretary-General',
      'Senior Advisor',
      'Chief of Staff',
      'Executive Liaison',
    ],
    suggestedStations: [
      'Executive Board Room',
      'Grand Assembly Hall Stage',
      'Dignitary Suite',
    ],
  },
  super_admin: {
    role: 'super_admin',
    title: 'Secretariat General Leadership',
    shortName: 'Secretary General',
    description: 'Supreme executive leadership across all conference departments and venue operations.',
    badge: 'Secretary General',
    presetRoles: [
      'Secretary General',
      'President of the Assembly',
      'Executive Director',
    ],
    suggestedStations: ['Executive Board Room', 'Grand Assembly Hall'],
  },
  secretary: {
    role: 'secretary',
    title: 'Secretariat Desk',
    shortName: 'Secretariat',
    description: 'Conference administrative desk and door scanning.',
    badge: 'Secretariat Pass',
    presetRoles: ['Secretariat Officer', 'Desk Administrator'],
    suggestedStations: ['Main Entrance Gate'],
  },
  doc_department: {
    role: 'doc_department',
    title: 'Documentation Department',
    shortName: 'Documentation',
    description: 'Draft resolutions editing, official archives, and committee records.',
    badge: 'Doc Department',
    presetRoles: ['Head of Documentation', 'Resolution Editor', 'Archive Specialist'],
    suggestedStations: ['Documentation Office', 'Assembly Hall Archives'],
  },
};

/**
 * Checks if a staff member or user is a Department Head or Co-Head.
 */
export function isHeadOrCoHead(user?: StaffMember | null): boolean {
  if (!user) return false;

  // Super Admin & HR heads have leadership status
  if (user.role === 'super_admin' || user.role === 'hr') return true;

  const title = (user.customTitle || '').toLowerCase();
  const name = (user.name || '').toLowerCase();

  const leadershipKeywords = [
    'head of',
    'co-head',
    'co-heads',
    'admin of',
    'secretary general',
    'deputy secretary general',
    'under secretary-general',
    'lead',
  ];

  if (leadershipKeywords.some((keyword) => title.includes(keyword))) {
    return true;
  }

  // Explicit known heads/co-heads
  const knownHeads = [
    'staff-med-fahad', // Fahad Alkendi
    'staff-med-dana', // Dana Al Najjar
    'staff-med-hashem', // Hashem
    'staff-med-selena', // Noor
    'staff-med-mohammed', // Mohammed Al Nahas
    'staff-cer-sultana', // Sultana Al Faraj
    'staff-des-mallak', // Mallak Abbas
    'staff-des-saud', // Saud Alanazi
    'staff-mkt-naya', // Naya
    'staff-mkt-sama', // Sama Sameh
    'staff-dcc-majd', // Majd
    'staff-dcc-lily', // Lily Rabia
    'staff-log-ahmed', // Ahmed El Amir
    'staff-pr-mazen', // Mazen Alaa
    'staff-hr-hoorein', // Hoorein
    'staff-hr-seif', // Seif Ayman
    'staff-vol-saad', // Saad Usman
    'staff-vol-maram', // Maram Ali
    'staff-vol-younis', // Younis
    'staff-sec-lead', // Security Lead
    'staff-sec-yusef', // Yusef Saad
    'staff-sec-najla', // Najla Rami
    'staff-sec-bushra', // Bushra Ismail
    'staff-it-ahmed', // Ahmed Magdi
    'staff-it-saleh', // Saleh Samaha
    'staff-rakan', // Rakan Almerbed
    'staff-yousef-saifi', // Yousef Saifi
    'staff-fahad-usg', // Zain Firas
    'staff-muaz', // Muaz El Amir
  ];

  if (knownHeads.includes(user.id)) return true;

  // Name check fallback
  if (
    name.includes('sultana') ||
    name.includes('fahad alkendi') ||
    name.includes('dana al najjar') ||
    name.includes('mallak') ||
    name.includes('saud') ||
    name.includes('naya') ||
    name.includes('hashem') ||
    name.includes('lily rabia') ||
    name.includes('ahmed magdi')
  ) {
    return true;
  }

  return false;
}

/**
 * Returns which department(s) this user is authorized to manage.
 * Executive Board & Super Admin can manage all or choose their own.
 */
export function getUserManagedDepartments(user?: StaffMember | null): StaffRole[] {
  if (!user) return [];

  if (user.role === 'super_admin' || user.role === 'executive') {
    // Leadership oversight: all departments available
    return [
      'media_and_press',
      'ceremonies',
      'designers',
      'marketing',
      'dcc',
      'volunteers',
      'logistics',
      'pr',
      'hr',
      'security',
      'it',
      'executive',
    ];
  }

  // HR can oversee staffing across all teams or HR
  if (user.role === 'hr') {
    return [
      'hr',
      'media_and_press',
      'ceremonies',
      'designers',
      'marketing',
      'dcc',
      'volunteers',
      'logistics',
      'pr',
    ];
  }

  return [user.role];
}

/**
 * Determine leadership tier:
 * 'head' | 'co_head' | 'member'
 */
export function getMemberLeadershipTier(member: StaffMember): 'head' | 'co_head' | 'member' {
  const title = (member.customTitle || '').toLowerCase();
  if (title.includes('co-head') || title.includes('co-heads')) return 'co_head';
  if (
    title.includes('head of') ||
    title.includes('admin of') ||
    title.includes('secretary general') ||
    member.role === 'super_admin'
  ) {
    return 'head';
  }
  return 'member';
}

/**
 * Check if a leader is authorized to assign specific roles to a member.
 * Rule: Heads & Co-Heads assign roles to people on their team (team members, coordinators, designers, etc.).
 * They cannot alter the Super Admin / Secretary General.
 */
export function canAssignRoleTo(leader: StaffMember | null, target: StaffMember): boolean {
  if (!leader || !target) return false;

  // Cannot modify Super Admin (Secretary General) unless you are Super Admin
  if (target.role === 'super_admin' && leader.role !== 'super_admin') {
    return false;
  }

  // Super Admin can assign to anyone
  if (leader.role === 'super_admin') return true;

  // HR can assign across teams
  if (leader.role === 'hr') return true;

  // Same department check
  if (leader.role === target.role) {
    return true;
  }

  return false;
}
