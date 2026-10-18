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
  Crown,
  Shield,
  Filter,
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

export const GuestListView: React.FC = () => {
  const {
    guests,
    manualCheckIn,
    markGuestLeft,
    undoCheckIn,
    removeGuest,
    importGuests,
    resetAllCheckIns,
    currentUser,
  } = useVenue();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Checked-In' | 'Left' | 'VIP'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeBadgeGuest, setActiveBadgeGuest] = useState<Guest | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isSecurityOrAdmin =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'security' ||
    currentUser?.role === 'it' ||
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
    if (statusFilter === 'Left') return g.status === 'Left';
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
      setImportNotification(`Manifest updated. Added: ${res.added}, Updated: ${res.updated}`);
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
    link.setAttribute('download', `West_Mun_Manifest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    playClickSound();
    const csvContent = generateSampleCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'West_Mun_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 text-[#F5F2EA] pb-10">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#B08D57]/30 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="text-lg sm:text-xl font-bold tracking-wider text-[#F5F2EA] uppercase font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Diplomatic Manifest
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-none bg-[#221a15] text-[#B08D57] border border-[#B08D57]/40 font-mono">
              {filteredGuests.length} Records
            </span>
          </div>
          <p
            className="text-xs text-[#B08D57]/80 font-serif mt-0.5"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Official delegate registry and access clearance records
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {isSecurityOrAdmin && (
            <button
              onClick={() => {
                playClickSound();
                setIsAddModalOpen(true);
              }}
              className="px-3 py-1.5 bg-[#6E4E2E] hover:bg-[#B08D57] text-[#120f0d] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-sm border border-[#B08D57]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <UserPlus className="w-3.5 h-3.5 text-[#120f0d]" />
              <span>Add Delegate</span>
            </button>
          )}

          {isSecurityOrAdmin && (
            <>
              <label className="px-2.5 py-1.5 bg-[#181310] hover:bg-[#251e19] text-[#B08D57] hover:text-[#F5F2EA] text-xs font-serif tracking-wider flex items-center gap-1.5 transition cursor-pointer border border-[#B08D57]/40">
                <Upload className="w-3.5 h-3.5 text-[#B08D57]" />
                <span className="hidden sm:inline">Import CSV</span>
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
                className="px-2.5 py-1.5 bg-[#181310] hover:bg-[#251e19] text-[#B08D57] hover:text-[#F5F2EA] text-xs font-serif tracking-wider flex items-center gap-1.5 transition cursor-pointer border border-[#B08D57]/40"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#B08D57]" />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                onClick={handleDownloadTemplate}
                className="p-1.5 bg-[#181310] hover:bg-[#251e19] text-[#B08D57] transition cursor-pointer border border-[#B08D57]/40"
                title="Download Template"
              >
                <FileText className="w-3.5 h-3.5 text-[#B08D57]" />
              </button>
            </>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-1.5 bg-[#201010] hover:bg-[#321515] text-red-400 border border-red-900/60 transition cursor-pointer"
              title="Reset All Check-Ins"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {importNotification && (
        <div className="p-2.5 bg-[#1a1512] border border-[#B08D57]/50 text-[#B08D57] text-xs flex items-center justify-between font-serif">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
      <div className="bg-[#14100e] border border-[#B08D57]/40 p-3 space-y-2.5 shadow-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#B08D57]/60" />
          <input
            type="text"
            placeholder="Search by Delegate Name, Ticket Code, or Committee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d0a08] border border-[#B08D57]/40 text-[#F5F2EA] pl-9 pr-4 py-2 text-xs tracking-wider rounded-none focus:outline-none focus:border-[#B08D57] placeholder:text-neutral-600 font-serif"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-serif">
          {(['All', 'Pending', 'Checked-In', 'Left', 'VIP'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                playClickSound();
                setStatusFilter(filter);
              }}
              className={`px-3 py-1 text-xs tracking-wider uppercase transition cursor-pointer whitespace-nowrap border ${
                statusFilter === filter
                  ? 'bg-[#6E4E2E] text-[#F5F2EA] border-[#B08D57]'
                  : 'bg-[#181310] text-[#B08D57]/70 border-[#B08D57]/20 hover:text-[#B08D57]'
              }`}
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Cards List (Replaces wide table on all screens) */}
      <div className="space-y-2.5">
        {filteredGuests.length === 0 ? (
          <div className="bg-[#14100e] border border-[#B08D57]/30 p-8 text-center">
            <p
              className="text-sm font-semibold text-[#F5F2EA] font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              No delegates match this query
            </p>
            <p
              className="text-xs text-[#B08D57]/60 font-serif mt-1"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Try adjusting your search criteria or filter.
            </p>
          </div>
        ) : (
          filteredGuests.map((guest) => {
            const isChecked = guest.status === 'Checked-In';
            const isLeft = guest.status === 'Left';

            return (
              <div
                key={guest.id}
                className={`p-3 sm:p-4 border transition-all duration-150 ${
                  isChecked
                    ? 'bg-[#121c15] border-emerald-500/40'
                    : isLeft
                    ? 'bg-[#1c160e] border-amber-500/40'
                    : 'bg-[#15110f] border-[#B08D57]/30 hover:border-[#B08D57]/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left Column: Delegate Information */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-sm sm:text-base font-bold text-[#F5F2EA] truncate tracking-wide"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        {guest.name}
                      </span>

                      {guest.role && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-none bg-[#241a14] text-[#B08D57] border border-[#B08D57]/40 font-serif">
                          {guest.role}
                        </span>
                      )}

                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-none border ${
                          guest.category === 'VIP'
                            ? 'bg-[#302315] text-amber-300 border-amber-400/50'
                            : 'bg-[#1a1410] text-[#B08D57]/80 border-[#B08D57]/30'
                        }`}
                      >
                        {guest.category}
                      </span>

                      {/* Status Tag */}
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-none flex items-center gap-1 border ${
                          isChecked
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : isLeft
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                            : 'bg-[#1a1410] text-neutral-400 border-[#B08D57]/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isChecked
                              ? 'bg-emerald-400'
                              : isLeft
                              ? 'bg-amber-400'
                              : 'bg-neutral-500'
                          }`}
                        />
                        <span>
                          {isChecked ? 'Inside Venue' : isLeft ? 'Departed' : 'Pending Clearance'}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs mt-1 text-[#B08D57]/80 font-mono">
                      <span className="font-bold text-[#D4AF37]">{guest.ticketId}</span>
                      {guest.tableOrSeat && (
                        <span className="text-neutral-400 font-serif">
                          • {guest.tableOrSeat}
                        </span>
                      )}
                    </div>

                    {isChecked && (
                      <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-1 font-serif">
                        <Clock className="w-3 h-3 text-[#B08D57]" />
                        <span>
                          Checked in at{' '}
                          {guest.checkedInTime
                            ? new Date(guest.checkedInTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'earlier'}{' '}
                          by <strong className="text-[#F5F2EA]">{guest.checkedInBy || 'Security'}</strong>
                        </span>
                      </p>
                    )}

                    {isLeft && (
                      <p className="text-[11px] text-amber-300/80 flex items-center gap-1 mt-1 font-serif">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>
                          Departed at{' '}
                          {guest.lastExitedTime
                            ? new Date(guest.lastExitedTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'earlier'}{' '}
                          (Unlocked for re-scan)
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {/* View Pass & QR */}
                    <button
                      onClick={() => {
                        playClickSound();
                        setActiveBadgeGuest(guest);
                      }}
                      className="p-2 bg-[#181310] hover:bg-[#251e19] border border-[#B08D57]/40 text-[#B08D57] transition cursor-pointer"
                      title="View Diplomatic Pass"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    {/* Status Toggle Actions */}
                    {isChecked ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            playClickSound();
                            markGuestLeft(guest.id);
                          }}
                          className="px-2.5 py-1.5 bg-[#251d14] hover:bg-[#34271a] border border-amber-500/40 text-amber-300 text-xs font-serif tracking-wider uppercase transition cursor-pointer"
                          title="Record Departure"
                        >
                          Mark Left
                        </button>

                        {(isSuperAdmin || currentUser?.canRevokeCheckIn) && (
                          <button
                            onClick={() => {
                              playClickSound();
                              undoCheckIn(guest.id);
                            }}
                            className="p-2 bg-[#1a1410] hover:bg-[#241a14] border border-[#B08D57]/30 text-neutral-400 hover:text-[#B08D57] transition cursor-pointer"
                            title="Reset to Pending"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      currentUser?.canManualCheckIn && (
                        <button
                          onClick={() => {
                            playClickSound();
                            manualCheckIn(guest.id);
                          }}
                          className={`px-3 py-1.5 text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-1 transition cursor-pointer border ${
                            isLeft
                              ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border-emerald-500/50'
                              : 'bg-gradient-to-r from-[#6E4E2E] via-[#B08D57] to-[#6E4E2E] text-[#120f0d] border-[#B08D57]'
                          }`}
                          style={{ fontFamily: "'Cinzel', serif" }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{isLeft ? 'Re-Enter' : 'Check-In'}</span>
                        </button>
                      )
                    )}

                    {isSuperAdmin && (
                      <button
                        onClick={() => {
                          playClickSound();
                          removeGuest(guest.id);
                        }}
                        className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition cursor-pointer"
                        title="Delete Delegate"
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

      {/* Add Guest Modal */}
      {isAddModalOpen && (
        <AddGuestModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Ticket Badge Modal */}
      {activeBadgeGuest && (
        <TicketBadgeModal
          guest={activeBadgeGuest}
          onClose={() => setActiveBadgeGuest(null)}
        />
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#161210] border border-[#B08D57]/60 p-5 shadow-2xl text-center space-y-3">
            <h3
              className="text-base font-bold text-[#F5F2EA] font-serif uppercase tracking-wider"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Reset All Check-Ins
            </h3>
            <p
              className="text-xs text-neutral-300 font-serif leading-relaxed"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Are you sure you want to reset all delegates back to Pending status? This action will clear current check-in timestamps.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 bg-[#1e1814] text-[#B08D57] text-xs font-serif tracking-wider uppercase border border-[#B08D57]/30 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  resetAllCheckIns();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-serif tracking-wider uppercase border border-red-500/50 transition"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
