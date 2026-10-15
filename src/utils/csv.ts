import { Guest, TicketCategory, TicketStatus } from '../types/venue';

/**
 * Parses CSV text into Guest records
 */
export function parseGuestCSV(csvText: string): { guests: Partial<Guest>[]; errors: string[] } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: string[] = [];
  if (lines.length < 2) {
    return { guests: [], errors: ['CSV file is empty or missing headers.'] };
  }

  // Parse header line respecting quotes
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  // Detect column indices
  const nameIdx = headers.findIndex((h) => h.includes('name') || h === 'guest');
  const ticketIdx = headers.findIndex(
    (h) => h.includes('ticket') || h.includes('qr') || h.includes('code') || h.includes('barcode') || h.includes('id')
  );
  const statusIdx = headers.findIndex((h) => h.includes('status'));
  const timeIdx = headers.findIndex((h) => h.includes('time') || h.includes('checked-in time') || h.includes('timestamp'));
  const byIdx = headers.findIndex((h) => h.includes('by') || h.includes('scanner') || h.includes('staff'));
  const categoryIdx = headers.findIndex((h) => h.includes('category') || h.includes('tier') || h.includes('type'));
  const tableIdx = headers.findIndex((h) => h.includes('table') || h.includes('seat'));
  const notesIdx = headers.findIndex((h) => h.includes('note') || h.includes('comment'));

  if (nameIdx === -1 && ticketIdx === -1) {
    return {
      guests: [],
      errors: ['Could not find "Guest Name" or "Ticket ID / QR Code Value" column headers in the CSV.'],
    };
  }

  const parsedGuests: Partial<Guest>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (!row || row.length === 0 || (row.length === 1 && !row[0].trim())) continue;

    const guestName = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : `Attendee #${i}`;
    let ticketId = ticketIdx !== -1 && row[ticketIdx] ? row[ticketIdx].trim() : '';

    if (!ticketId) {
      ticketId = `WM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    const rawStatus = statusIdx !== -1 && row[statusIdx] ? row[statusIdx].trim().toLowerCase() : 'pending';
    const status: TicketStatus = rawStatus.includes('check') ? 'Checked-In' : 'Pending';

    const checkedInTime = timeIdx !== -1 && row[timeIdx] ? row[timeIdx].trim() : status === 'Checked-In' ? new Date().toISOString() : null;
    const checkedInBy = byIdx !== -1 && row[byIdx] ? row[byIdx].trim() : status === 'Checked-In' ? 'Import' : null;

    let category: TicketCategory = 'General Admission';
    if (categoryIdx !== -1 && row[categoryIdx]) {
      const rawCat = row[categoryIdx].trim().toLowerCase();
      if (rawCat.includes('vip')) category = 'VIP';
      else if (rawCat.includes('backstage')) category = 'Backstage';
      else if (rawCat.includes('artist')) category = 'Artist';
      else if (rawCat.includes('press')) category = 'Press';
      else if (rawCat.includes('staff')) category = 'Staff';
    }

    const tableOrSeat = tableIdx !== -1 && row[tableIdx] ? row[tableIdx].trim() : undefined;
    const notes = notesIdx !== -1 && row[notesIdx] ? row[notesIdx].trim() : undefined;

    parsedGuests.push({
      name: guestName,
      ticketId,
      status,
      scanCount: status === 'Checked-In' ? 1 : 0,
      deniedAttempts: [],
      checkedInTime,
      checkedInBy,
      category,
      tableOrSeat,
      notes,
    });
  }

  return { guests: parsedGuests, errors };
}

/**
 * Helper to parse a single line of CSV taking into account quotes and commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      if (inQuotes && line[i + 1] === char) {
        current += char;
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Generates CSV string from guest list
 */
export function exportGuestsToCSV(guests: Guest[]): string {
  const headers = [
    'Guest Name',
    'Ticket ID/QR Code Value',
    'Category',
    'Status [Pending/Checked-In]',
    'Scan Count/Attempts',
    'Checked-In Time',
    'Checked-In By',
    'Gate',
    'Table/Seat',
    'Notes',
  ];

  const escapeCSV = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const clean = String(val).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = guests.map((g) => [
    escapeCSV(g.name),
    escapeCSV(g.ticketId),
    escapeCSV(g.category),
    escapeCSV(g.status),
    escapeCSV(g.scanCount || (g.status === 'Checked-In' ? 1 : 0)),
    escapeCSV(g.checkedInTime || ''),
    escapeCSV(g.checkedInBy || ''),
    escapeCSV(g.checkedInGate || ''),
    escapeCSV(g.tableOrSeat || ''),
    escapeCSV(g.notes || ''),
  ]);

  return [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Generates a ready-to-use sample CSV template for venue managers
 */
export function generateSampleCSVTemplate(): string {
  return [
    'Guest Name,Ticket ID/QR Code Value,Category,Status [Pending/Checked-In],Checked-In Time,Checked-In By,Table/Seat,Notes',
    'General Assembly Delegate 1,MUN-GA-101,General Admission,Pending,,,Row A Seat 1,General Assembly Committee',
    'Security Council Delegate,MUN-VIP-201,VIP,Pending,,,UNSC Chamber Desk 4,UNSC Diplomatic Pass',
    'Diplomatic Keynote Speaker,MUN-ART-401,Artist,Pending,,,Main Stage Podium,Opening Ceremony Speaker',
    'Layan Ahmed,MUN-STAFF-DESIGN-3301,Staff,Pending,,,Creative Studio,Lead Designer Official Pass',
    'Crisis Committee Delegate,MUN-VIP-301,VIP,Pending,,,Crisis Room Desk 8,Crisis Delegate Pass',
  ].join('\r\n');
}
