import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useVenue } from '../../context/VenueContext';
import { ROLE_LABELS } from '../../types/venue';
import {
  Shield,
  ShieldCheck,
  Building2,
  MapPin,
  CheckCircle2,
  Copy,
  Check,
  LogOut,
  Lock,
  RefreshCw,
  Crown,
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';
import officialLogoUrl from '../../assets/images/west_mun_logo_official.jpg';

export const StaffPassScreen: React.FC = () => {
  const {
    currentUser,
    guests,
    logout,
    switchAccountFast,
    staffMembers,
  } = useVenue();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [liveTime, setLiveTime] = useState<string>('');

  const roleMeta = currentUser ? ROLE_LABELS[currentUser.role] : null;

  const staffTicketCode =
    currentUser?.ticketId ||
    `MUN-STAFF-${currentUser?.role.toUpperCase()}-${currentUser?.accessKey || '0000'}`;

  const guestRecord = guests.find(
    (g) => g.ticketId.toLowerCase() === staffTicketCode.toLowerCase()
  );

  const isCheckedIn = guestRecord?.status === 'Checked-In';
  const hasLeft = guestRecord?.status === 'Left';

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(staffTicketCode, {
      width: 400,
      margin: 2,
      color: {
        dark: '#120f0d',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR code for staff pass:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [staffTicketCode]);

  const copyCode = () => {
    playClickSound();
    navigator.clipboard?.writeText(staffTicketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-65px)] px-3 sm:px-4 py-5 flex flex-col items-center justify-start pb-20 select-none text-[#F5F2EA]">
      {/* Top Security Restriction Banner */}
      <div className="w-full max-w-sm mb-4 p-3 bg-[#161210] border border-[#B08D57]/40 flex items-start gap-2.5 shadow-md">
        <Lock className="w-4 h-4 text-[#B08D57] shrink-0 mt-0.5" />
        <div className="text-left text-xs leading-relaxed font-serif">
          <span
            className="font-bold text-[#F5F2EA] block"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Diplomatic Credential Pass
          </span>
          <span className="text-neutral-300 text-[11px]">
            Your account ({roleMeta?.title}) provides entrance clearance. Scanner consoles are restricted to{' '}
            <strong className="text-[#B08D57]">Security & IT Administrators</strong>.
          </span>
        </div>
      </div>

      {/* Main Handcrafted Staff Badge Card */}
      <div className="w-full max-w-sm bg-[#161311] border border-[#B08D57]/70 p-5 shadow-2xl relative text-center">
        {/* Medieval Corner Accents */}
        <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-[#B08D57]/70" />
        <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-[#B08D57]/70" />
        <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-[#B08D57]/70" />
        <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-[#B08D57]/70" />

        {/* Live Watermark Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#B08D57]/20 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-sm overflow-hidden border border-[#B08D57]/40">
              <img
                src={officialLogoUrl}
                alt="West MUN"
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className="text-xs font-bold tracking-widest text-[#B08D57] uppercase font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              WEST MUN
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0f0c0a] border border-[#B08D57]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-[#D4AF37] font-semibold">
              LIVE {liveTime}
            </span>
          </div>
        </div>

        {/* Staff Identity Header */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-14 h-14 rounded-full bg-[#201813] border border-[#B08D57] flex items-center justify-center mb-2 shadow-sm">
            <span
              className="text-xl font-bold text-[#F5F2EA] font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {currentUser?.name?.charAt(0) || 'D'}
            </span>
          </div>

          <h2
            className="text-lg font-bold tracking-wide text-[#F5F2EA] font-serif mb-0.5"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {currentUser?.name}
          </h2>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#201814] border border-[#B08D57]/40 text-[#B08D57] text-xs font-serif mt-0.5">
            <Shield className="w-3 h-3 text-[#B08D57]" />
            <span>{roleMeta?.title}</span>
            <span>•</span>
            <span className="text-[10px] font-mono">{roleMeta?.badge}</span>
          </div>
        </div>

        {/* QR Code Presentation Box */}
        <div className="relative mx-auto bg-white p-3 rounded-none border-2 border-[#B08D57] shadow-lg w-[200px] h-[200px] flex items-center justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Official Access QR Code"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-800">
              <RefreshCw className="w-6 h-6 animate-spin text-[#B08D57] mb-1" />
              <span className="text-xs font-serif">Generating Pass...</span>
            </div>
          )}
        </div>

        {/* Ticket ID & Copy Action */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="font-mono text-xs font-bold text-[#D4AF37] bg-[#0d0a08] px-3 py-1 border border-[#B08D57]/40">
            {staffTicketCode}
          </span>
          <button
            onClick={copyCode}
            className="p-1.5 bg-[#181310] hover:bg-[#251e19] border border-[#B08D57]/40 text-[#B08D57] transition cursor-pointer"
            title="Copy Pass Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Current Door Status */}
        <div className="mt-4 pt-3 border-t border-[#B08D57]/20 flex items-center justify-between text-xs font-serif">
          <span className="text-neutral-400">Current Status:</span>
          <span
            className={`font-semibold flex items-center gap-1.5 ${
              isCheckedIn ? 'text-emerald-400' : hasLeft ? 'text-amber-400' : 'text-[#B08D57]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCheckedIn ? 'bg-emerald-400' : hasLeft ? 'bg-amber-400' : 'bg-neutral-500'
              }`}
            />
            <span>
              {isCheckedIn
                ? 'Inside Venue (Validated)'
                : hasLeft
                ? 'Departed (Re-entry Allowed)'
                : 'Pending Entrance Scan'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
