import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useVenue } from '../../context/VenueContext';
import { X, Sparkles, QrCode, Zap, Building2, LogOut, LogIn } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface TestTicketBadgesProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestTicketBadges: React.FC<TestTicketBadgesProps> = ({ isOpen, onClose }) => {
  const { guests, processScan, setActiveTab } = useVenue();
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (!isOpen) return;

    guests.slice(0, 30).forEach((guest) => {
      if (!qrCodeUrls[guest.ticketId]) {
        QRCode.toDataURL(guest.ticketId, {
          width: 240,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        })
          .then((url) => {
            setQrCodeUrls((prev) => ({ ...prev, [guest.ticketId]: url }));
          })
          .catch((err) => console.error(err));
      }
    });
  }, [isOpen, guests, qrCodeUrls]);

  if (!isOpen) return null;

  const filteredGuests =
    selectedCategory === 'All'
      ? guests
      : guests.filter((g) => g.category.toLowerCase() === selectedCategory.toLowerCase());

  const handleSimulate = (code: string, mode: 'entry' | 'exit' = 'entry') => {
    playClickSound();
    processScan(code, mode);
    setActiveTab('scanner');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#1b0307] via-[#100104] to-[#080103] border-2 border-amber-500/60 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-[0_0_60px_rgba(220,38,38,0.35),0_0_40px_rgba(245,158,11,0.2)] overflow-hidden text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-red-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-700 to-amber-600 border border-amber-300/60 flex items-center justify-center text-neutral-950 font-black shadow-md shadow-red-950/40">
              <Building2 className="w-4 h-4 text-neutral-950" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-400 uppercase tracking-wider">
                WEST MUN Official Passes & QR Codes
              </h2>
              <p className="text-xs text-neutral-400">
                Test the entrance check-in, duplicate re-scan block, and departure exit lifecycle
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-red-950/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter categories */}
        <div className="px-5 py-2.5 bg-black/60 border-b border-red-900/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['All', 'Staff', 'VIP', 'General Admission', 'Artist', 'Press'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playClickSound();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredGuests.map((guest) => {
              const qrUrl = qrCodeUrls[guest.ticketId];
              const isCheckedIn = guest.status === 'Checked-In';
              const isLeft = guest.status === 'Left';

              return (
                <div
                  key={guest.id}
                  className="relative rounded-2xl border border-amber-500/30 p-4 transition-all overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-black hover:border-amber-400/60 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        guest.category === 'VIP'
                          ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50'
                          : guest.category === 'Artist'
                          ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                          : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                      }`}
                    >
                      {guest.category}
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isCheckedIn
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isLeft
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isCheckedIn ? 'bg-emerald-400' : isLeft ? 'bg-amber-400' : 'bg-neutral-500'
                        }`}
                      ></span>
                      {isCheckedIn ? 'Inside Venue' : isLeft ? 'Left (Cleared)' : 'Pending (Valid)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 h-24 bg-white rounded-xl p-1 shrink-0 flex items-center justify-center shadow-lg border-2 border-amber-400/80">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt={`QR for ${guest.name}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <QrCode className="w-10 h-10 text-neutral-400 animate-pulse" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{guest.name}</p>
                      {guest.role && (
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-300 mt-0.5">
                          Role: {guest.role}
                        </p>
                      )}
                      <p className="text-xs font-mono text-amber-300 truncate mt-0.5 font-bold">
                        {guest.ticketId}
                      </p>
                      {guest.tableOrSeat && (
                        <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                          Location: <span className="text-amber-200">{guest.tableOrSeat}</span>
                        </p>
                      )}
                      {guest.notes && (
                        <p className="text-[10px] text-neutral-400 italic line-clamp-1 mt-0.5">
                          {guest.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-neutral-800 flex items-center justify-between gap-1.5">
                    {isCheckedIn ? (
                      <>
                        <button
                          onClick={() => handleSimulate(guest.ticketId, 'entry')}
                          className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 transition cursor-pointer active:scale-95"
                          title="Try scanning again while inside (Blocked)"
                        >
                          <Zap className="w-3 h-3 text-red-400" />
                          <span>Re-Scan (Block)</span>
                        </button>

                        <button
                          onClick={() => handleSimulate(guest.ticketId, 'exit')}
                          className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 transition cursor-pointer active:scale-95"
                          title="Log Departure (Unlocks re-scan)"
                        >
                          <LogOut className="w-3 h-3 text-amber-400" />
                          <span>Scan Exit</span>
                        </button>
                      </>
                    ) : isLeft ? (
                      <button
                        onClick={() => handleSimulate(guest.ticketId, 'entry')}
                        className="w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-black shadow-md shadow-emerald-500/20 transition cursor-pointer active:scale-95"
                      >
                        <LogIn className="w-3.5 h-3.5 fill-current" />
                        <span>Simulate Re-Entry Scan</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSimulate(guest.ticketId, 'entry')}
                        className="w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 font-black shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Simulate Entry Scan</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-3 bg-black border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>MUN Venue Access Manifest</span>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
