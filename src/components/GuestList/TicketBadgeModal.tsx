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
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [guest]);

  if (!guest) return null;

  const isCheckedIn = guest.status === 'Checked-In';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-2 border-amber-500/50 rounded-3xl max-w-sm w-full p-6 shadow-[0_0_50px_rgba(212,175,55,0.2)] relative text-center text-white">
        <button
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Pass Header */}
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black tracking-widest text-amber-300 uppercase">WEST MUN</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
            GOLD PASS
          </span>
        </div>

        <h3 className="text-xl font-black text-white mt-1">{guest.name}</h3>

        <div className="mt-2 flex items-center justify-center gap-2">
          <span
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              guest.category === 'VIP'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50'
                : guest.category === 'Artist'
                ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                : 'bg-neutral-800 text-neutral-200 border border-neutral-700'
            }`}
          >
            {guest.category}
          </span>

          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isCheckedIn
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isCheckedIn ? 'bg-red-400' : 'bg-amber-400'}`}></span>
            {guest.status}
          </span>
        </div>

        {/* QR Code Frame */}
        <div className="mt-5 p-3 bg-white rounded-2xl shadow-xl inline-block border-4 border-amber-400">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`Ticket QR for ${guest.name}`} className="w-48 h-48 object-contain" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-neutral-400">
              <QrCode className="w-12 h-12 animate-pulse" />
            </div>
          )}
        </div>

        <p className="mt-3 text-sm font-mono font-black text-amber-300">{guest.ticketId}</p>

        {guest.tableOrSeat && (
          <p className="text-xs text-neutral-300 mt-1">
            Seating: <span className="font-bold text-amber-200">{guest.tableOrSeat}</span>
          </p>
        )}

        {guest.notes && <p className="text-[11px] text-neutral-400 italic mt-1">{guest.notes}</p>}

        {isCheckedIn && (
          <div className="mt-3 p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400">
            Checked in by <span className="text-white font-medium">{guest.checkedInBy || 'Door Staff'}</span> at{' '}
            <span className="text-white font-medium">
              {guest.checkedInTime
                ? new Date(guest.checkedInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'earlier'}
            </span>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`WestMun-${guest.name.replace(/\s+/g, '_')}-${guest.ticketId}.png`}
              className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-amber-400 text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Pass</span>
            </a>
          )}
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 text-xs font-black uppercase tracking-wider transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
