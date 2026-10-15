import React, { useState } from 'react';
import { useVenue } from '../../context/VenueContext';
import { TicketCategory } from '../../types/venue';
import { X, UserPlus, Sparkles } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddGuestModal: React.FC<AddGuestModalProps> = ({ isOpen, onClose }) => {
  const { addGuest } = useVenue();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState<TicketCategory>('General Admission');
  const [ticketId, setTicketId] = useState('');
  const [tableOrSeat, setTableOrSeat] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const generateTicketId = (cat: TicketCategory) => {
    const prefix = cat === 'VIP' ? 'MUN-VIP' : cat === 'Artist' ? 'MUN-ART' : cat === 'Press' ? 'MUN-PRS' : 'MUN-GA';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setTicketId(`${prefix}-${rand}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let finalTicketId = ticketId.trim();
    if (!finalTicketId) {
      const prefix = category === 'VIP' ? 'MUN-VIP' : category === 'Artist' ? 'MUN-ART' : 'MUN-GA';
      finalTicketId = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    addGuest({
      name: name.trim(),
      ticketId: finalTicketId,
      category,
      role: role.trim() || undefined,
      tableOrSeat: tableOrSeat.trim() || undefined,
      notes: notes.trim() || undefined,
      status: 'Pending',
      scanCount: 0,
    });

    playClickSound();
    onClose();
    setName('');
    setRole('');
    setTicketId('');
    setTableOrSeat('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-neutral-900 to-black border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-white">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-amber-200">Add Attendee to Manifest</h2>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-amber-200/90 mb-1">Guest Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Layan Ahmed, Karim, or GA Delegate"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-200/90 mb-1">
              Designated Role / Title (Written on Badge)
            </label>
            <input
              type="text"
              placeholder="e.g. Lead Designer, Security Lead, IT Specialist, General Assembly Delegate"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1">Ticket Category</label>
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value as TicketCategory;
                  setCategory(newCat);
                  if (!ticketId) generateTicketId(newCat);
                }}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-amber-300 focus:outline-none focus:border-amber-400"
              >
                <option value="General Admission">General Admission</option>
                <option value="VIP">VIP Gold Tier</option>
                <option value="Artist">Artist / Talent</option>
                <option value="Backstage">Backstage Pass</option>
                <option value="Press">Press / Media</option>
                <option value="Staff">Venue Staff</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1">Table / Seating</label>
              <input
                type="text"
                placeholder="e.g. Gold Table 14, Booth 3"
                value={tableOrSeat}
                onChange={(e) => setTableOrSeat(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-amber-200/90">Ticket ID / QR Code Value</label>
              <button
                type="button"
                onClick={() => generateTicketId(category)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Generate Gold Code</span>
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. WM-VIP-8891"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-amber-300 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-200/90 mb-1">Notes / Special Instructions</label>
            <input
              type="text"
              placeholder="e.g. Champagne service, sponsor delegate, +1 pass"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:via-amber-400 hover:to-yellow-400 text-neutral-950 text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-amber-500/25 active:scale-95"
            >
              Add Attendee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
