import React, { useState, useRef } from 'react';
import { useVenue } from '../../context/VenueContext';
import { Guest } from '../../types/venue';
import { AddGuestModal } from './AddGuestModal';
import { TicketBadgeModal } from './TicketBadgeModal';
import { parseGuestCSV, exportGuestsToCSV, generateSampleCSVTemplate } from '../../utils/csv';
import {
  Search,
  UserPlus,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  QrCode,
  RotateCcw,
  Trash2,
  FileText,
  Check,
  X,
  AlertTriangle,
  Crown,
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

export const GuestListView: React.FC = () => {
  const {
    guests,
    manualCheckIn,
    undoCheckIn,
    removeGuest,
    importGuests,
    resetAllCheckIns,
    currentUser,
  } = useVenue();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Checked-In' | 'VIP'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeBadgeGuest, setActiveBadgeGuest] = useState<Guest | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isSecretaryOrAdmin =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'secretary' ||
    currentUser?.role === 'ceremony_director' ||
    currentUser?.role === 'pr';

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.tableOrSeat && g.tableOrSeat.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'Pending') return g.status === 'Pending';
    if (statusFilter === 'Checked-In') return g.status === 'Checked-In';
    if (statusFilter === 'VIP') return g.category === 'VIP';
    return true;
  });

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const { guests: parsed, errors } = parseGuestCSV(text);
      if (errors.length > 0 && parsed.length === 0) {
        setImportNotification(`Error: ${errors.join(', ')}`);
        return;
      }

      const res = importGuests(parsed);
      setImportNotification(`Successfully imported! Added: ${res.added}, Updated: ${res.updated}`);
      setTimeout(() => setImportNotification(null), 5000);
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportCSV = () => {
    playClickSound();
    const csvContent = exportGuestsToCSV(guests);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `WestMun_Gold_Manifest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    playClickSound();
    const templateContent = generateSampleCSVTemplate();
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'WestMun_Sample_Gold_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4 pb-28 text-white">
      <AddGuestModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <TicketBadgeModal guest={activeBadgeGuest} onClose={() => setActiveBadgeGuest(null)} />

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-neutral-950 border border-red-500/50 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Reset All Door Check-Ins?</h3>
            <p className="text-xs text-neutral-300 mb-5">
              This will set all {guests.length} guest records back to &apos;Pending&apos; status. Recorded in the venue log.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  resetAllCheckIns();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Crown className="w-4 h-4 text-amber-400" />
            <h1 className="text-xl font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              West Mun Guest Manifest
            </h1>
          </div>
          <p className="text-xs text-neutral-400">
            {guests.length} total attendees •{' '}
            <span className="text-amber-300 font-bold">
              {guests.filter((g) => g.status === 'Checked-In').length} checked in
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentUser?.canManualCheckIn && (
            <button
              onClick={() => {
                playClickSound();
                setIsAddModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Guest</span>
            </button>
          )}

          {isSecretaryOrAdmin && (
            <>
              <label className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 border border-amber-500/30">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Upload CSV</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 border border-amber-500/30"
                title="Export guest list with check-in status"
              >
                <Download className="w-4 h-4 text-yellow-400" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                onClick={handleDownloadTemplate}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 transition cursor-pointer border border-amber-500/30"
                title="Download CSV Template"
              >
                <FileText className="w-4 h-4 text-amber-400" />
              </button>
            </>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 transition cursor-pointer border border-amber-500/30"
              title="Reset All Check-Ins"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {importNotification && (
        <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{importNotification}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-gradient-to-b from-neutral-950 to-black border border-amber-500/35 rounded-2xl p-3 space-y-3 shadow-lg">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by Guest Name, Ticket Code, or Table Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-neutral-800 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[10px] text-amber-400/80 uppercase font-bold">Filter:</span>
          {(['All', 'Pending', 'Checked-In', 'VIP'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                playClickSound();
                setStatusFilter(filter);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                statusFilter === filter
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 shadow-sm shadow-amber-500/30'
                  : 'bg-black text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {filter}
            </button>
          ))}
          <span className="text-xs text-neutral-400 ml-auto font-mono">
            {filteredGuests.length} results
          </span>
        </div>
      </div>

      {/* Guest Cards */}
      <div className="space-y-2.5">
        {filteredGuests.length === 0 ? (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 text-center">
            <p className="text-sm font-semibold text-neutral-300">No guests match this criteria</p>
            <p className="text-xs text-neutral-500 mt-1">
              Try adjusting your search query or filter.
            </p>
          </div>
        ) : (
          filteredGuests.map((guest) => {
            const isChecked = guest.status === 'Checked-In';

            return (
              <div
                key={guest.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isChecked
                    ? 'bg-neutral-950/70 border-neutral-800'
                    : 'bg-gradient-to-b from-neutral-950 to-black border-amber-500/25 hover:border-amber-400/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white truncate">{guest.name}</span>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          guest.category === 'VIP'
                            ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50'
                            : guest.category === 'Artist' || guest.category === 'Backstage'
                            ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                            : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                        }`}
                      >
                        {guest.category}
                      </span>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isChecked
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-amber-400' : 'bg-neutral-500'}`}
                        ></span>
                        {guest.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs mt-1 text-neutral-400 font-mono">
                      <span className="font-bold text-amber-300">{guest.ticketId}</span>
                      {guest.tableOrSeat && (
                        <span className="text-neutral-300 font-sans">• {guest.tableOrSeat}</span>
                      )}
                    </div>

                    {isChecked && (
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400/80" />
                          <span>
                            Checked in at{' '}
                            {guest.checkedInTime
                              ? new Date(guest.checkedInTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'earlier'}{' '}
                            by <span className="text-amber-200">{guest.checkedInBy || 'Door Staff'}</span>
                          </span>
                        </p>

                        {guest.scanCount > 1 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 border border-red-500/50 text-red-300 flex items-center gap-1">
                            <span>Blocked Re-scans: {guest.scanCount - 1}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {guest.notes && (
                      <p className="text-[11px] text-neutral-400 italic mt-0.5">{guest.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        playClickSound();
                        setActiveBadgeGuest(guest);
                      }}
                      className="p-2 rounded-xl bg-neutral-900 border border-amber-500/20 hover:border-amber-400 text-amber-300 transition cursor-pointer active:scale-95"
                      title="View Pass & QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    {!isChecked ? (
                      currentUser?.canManualCheckIn && (
                        <button
                          onClick={() => {
                            playClickSound();
                            manualCheckIn(guest.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-sm shadow-amber-500/20"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Check-In</span>
                        </button>
                      )
                    ) : (
                      (isSuperAdmin || currentUser?.canRevokeCheckIn) && (
                        <button
                          onClick={() => {
                            playClickSound();
                            undoCheckIn(guest.id);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-400 text-amber-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer active:scale-95"
                          title="Undo Check-In"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden sm:inline">Undo</span>
                        </button>
                      )
                    )}

                    {isSuperAdmin && (
                      <button
                        onClick={() => {
                          playClickSound();
                          removeGuest(guest.id);
                        }}
                        className="p-2 rounded-xl text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition cursor-pointer"
                        title="Delete Guest"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
