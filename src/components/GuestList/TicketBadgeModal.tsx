import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Guest } from '../../types/venue';
import { X, Download, Crown, QrCode } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface TicketBadgeModalProps {
  guest: Guest | null;
  onClose: () => void;
}

export const TicketBadgeModal: React.FC<TicketBadgeModalProps> = ({ guest, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!guest) return;
    QRCode.toDataURL(guest.ticketId, {
      width: 320,
      margin: 1,
      color: {
        dark: '#080103',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [guest]);

  if (!guest) return null;

  const isCheckedIn = guest.status === 'Checked-In';
  const isLeft = guest.status === 'Left';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#1b0307] via-[#100104] to-[#080103] border-2 border-amber-500/60 rounded-3xl max-w-sm w-full p-6 shadow-[0_0_50px_rgba(220,38,38,0.35),0_0_30px_rgba(245,158,11,0.2)] relative text-center text-white">
        <button
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-red-950/50 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Pass Header */}
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black tracking-widest text-amber-300 uppercase font-display">WEST MUN</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/80 text-amber-300 font-bold border border-amber-500/40">
            OFFICIAL PASS
          </span>
        </div>

        <h3 className="text-xl font-black text-white mt-1 font-display">{guest.name}</h3>
        {guest.role && (
          <div className="mt-1">
            <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-red-950/70 text-amber-300 border border-amber-400/50 inline-block font-display">
              Role: {guest.role}
            </span>
          </div>
        )}

        <div className="mt-2 flex items-center justify-center gap-2">
          <span
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              guest.category === 'VIP'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50'
                : guest.category === 'Artist' || guest.category === 'Staff'
                ? 'bg-red-950/60 text-amber-200 border border-amber-500/40'
                : 'bg-[#150205] text-neutral-200 border border-red-900/60'
            }`}
          >
            {guest.category}
          </span>

          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
              isCheckedIn
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : isLeft
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-[#150205] text-neutral-300 border border-red-900/60'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCheckedIn ? 'bg-emerald-400' : isLeft ? 'bg-amber-400' : 'bg-neutral-500'
              }`}
            ></span>
            {isCheckedIn ? 'Inside Venue' : isLeft ? 'Left Venue (Cleared)' : 'Pending'}
          </span>
        </div>

        {/* QR Code Frame */}
        <div className="mt-5 p-3 bg-white rounded-2xl shadow-xl inline-block border-4 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`Ticket QR for ${guest.name}`} className="w-48 h-48 object-contain" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-neutral-400">
              <QrCode className="w-12 h-12 animate-pulse text-amber-500" />
            </div>
          )}
        </div>

        <p className="mt-3 text-sm font-mono font-black text-amber-300">{guest.ticketId}</p>

        {guest.tableOrSeat && (
          <p className="text-xs text-neutral-300 mt-1">
            Location: <span className="font-bold text-amber-200">{guest.tableOrSeat}</span>
          </p>
        )}

        {guest.notes && <p className="text-[11px] text-neutral-400 italic mt-1">{guest.notes}</p>}

        {isCheckedIn && (
          <div className="mt-3 p-2 rounded-xl bg-[#140205] border border-red-900/60 text-[11px] text-neutral-300">
            Checked in by <span className="text-white font-medium">{guest.checkedInBy || 'Security'}</span> at{' '}
            <span className="text-white font-medium">
              {guest.checkedInTime
                ? new Date(guest.checkedInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'earlier'}
            </span>
          </div>
        )}

        {isLeft && (
          <div className="mt-3 p-2 rounded-xl bg-[#140205] border border-amber-500/40 text-[11px] text-amber-300">
            Departed West Mun • Unlocked for re-scan upon return.
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`West_Mun-${guest.name.replace(/\s+/g, '_')}-${guest.ticketId}.png`}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:via-amber-500 text-neutral-950 text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4 text-neutral-950" />
              <span>Download Badge</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
