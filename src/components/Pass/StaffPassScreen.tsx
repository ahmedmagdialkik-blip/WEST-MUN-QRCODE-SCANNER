import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useVenue } from '../../context/VenueContext';
import { ROLE_LABELS, isScannerOrAdminRole } from '../../types/venue';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Clock,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  LogOut,
  UserCheck,
  Zap,
  Lock,
  RefreshCw,
  QrCode as QrIcon,
  Radio,
} from 'lucide-react';
import { playClickSound, playSuccessChime, playSecurityAlertSiren } from '../../utils/audio';

export const StaffPassScreen: React.FC = () => {
  const {
    currentUser,
    guests,
    processScan,
    logout,
    switchAccountFast,
    staffMembers,
  } = useVenue();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [liveTime, setLiveTime] = useState<string>('');

  const roleMeta = currentUser ? ROLE_LABELS[currentUser.role] : null;

  // The staff ticket code to be encoded in the QR code
  const staffTicketCode =
    currentUser?.ticketId ||
    `WM-STAFF-${currentUser?.role.toUpperCase()}-${currentUser?.accessKey || '0000'}`;

  // Find if this staff ticket is already registered / scanned in the venue manifest
  const guestRecord = guests.find(
    (g) => g.ticketId.toLowerCase() === staffTicketCode.toLowerCase()
  );

  const isCheckedIn = guestRecord?.status === 'Checked-In';
  const scanCount = guestRecord?.scanCount || 0;

  // Update real-time clock every second for dynamic anti-counterfeiting
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

  // Generate crisp, high-contrast QR code
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(staffTicketCode, {
      width: 400,
      margin: 2,
      color: {
        dark: '#050505',
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

  // Simulate an on-duty Security officer scanning this pass at the gate
  const handleSimulateSecurityScan = () => {
    playClickSound();
    setSimulating(true);

    // Call processScan with this staff code
    setTimeout(() => {
      processScan(staffTicketCode);
      setSimulating(false);
    }, 400);
  };

  // Find security staff member for quick switch demonstration
  const securityStaff = staffMembers.find((s) => s.role === 'security');
  const adminStaff = staffMembers.find((s) => s.role === 'super_admin');

  return (
    <div className="min-h-[calc(100vh-65px)] bg-black px-4 py-5 flex flex-col items-center justify-start pb-20 select-none">
      {/* Top Security Restriction Banner */}
      <div className="w-full max-w-sm mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 shadow-lg shadow-black">
        <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-left text-xs leading-relaxed">
          <span className="font-bold text-amber-300 block">Personal Credential Mode</span>
          <span className="text-neutral-300 text-[11px]">
            Your account ({roleMeta?.title}) is assigned a Staff QR Pass. Door scanning & venue administration are restricted to{' '}
            <strong className="text-amber-300 font-semibold">Security & Admins</strong>.
          </span>
        </div>
      </div>

      {/* Main Luxury Black & Gold Staff Badge Card */}
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-2 border-amber-500/40 p-5 shadow-[0_0_50px_rgba(212,175,55,0.22)] relative overflow-hidden text-center text-white">
        {/* Subtle Ambient Gold Gradients */}
        <div className="absolute top-0 -left-10 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-10 w-40 h-40 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Dynamic Holographic Watermark Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/25 mb-4">
          <div className="flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 uppercase">
              WEST MUN
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-950 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-amber-300 font-semibold">
              LIVE {liveTime}
            </span>
          </div>
        </div>

        {/* Staff Identity Header */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 p-[2px] shadow-lg shadow-amber-500/25">
              <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                <span className="text-2xl font-black bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
                  {currentUser?.name?.charAt(0) || 'S'}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-black border border-amber-400/50">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>

          <h2 className="text-xl font-black tracking-tight text-white mb-0.5">
            {currentUser?.name}
          </h2>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mt-0.5">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>{roleMeta?.title}</span>
            <span className="text-amber-500">•</span>
            <span className="text-[10px] font-normal uppercase tracking-wider text-amber-400/90">
              {roleMeta?.badge}
            </span>
          </div>

          <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-1 font-medium">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>{currentUser?.assignedGate || 'West Mun General Grounds'}</span>
          </p>
        </div>

        {/* QR Code Presentation Box */}
        <div className="relative mx-auto bg-white p-3.5 rounded-2xl border-4 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.35)] w-[230px] h-[230px] flex items-center justify-center transition-transform hover:scale-105 duration-200">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Official Staff Access QR Code"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-800">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-1" />
              <span className="text-xs font-semibold">Generating QR...</span>
            </div>
          )}
        </div>

        {/* Ticket ID & Copy Action */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="font-mono text-xs font-bold text-amber-300 bg-neutral-900 px-3 py-1 rounded-xl border border-amber-500/30">
            {staffTicketCode}
          </span>
          <button
            onClick={copyCode}
            className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-400 hover:text-white transition cursor-pointer"
            title="Copy QR Code value"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Live Admission Status Badge */}
        <div className="mt-4 pt-3 border-t border-neutral-800">
          {isCheckedIn ? (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-neutral-950 border border-emerald-500/50 text-left">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  Admitted • Verified Access
                </span>
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Scan #1
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 pl-6">
                Checked in at{' '}
                <strong className="text-white">
                  {guestRecord.checkedInTime
                    ? new Date(guestRecord.checkedInTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Gate'}
                </strong>{' '}
                by <span className="text-amber-300">{guestRecord.checkedInBy || 'Security Officer'}</span>
              </p>
              <p className="text-[10px] text-neutral-400 pl-6 mt-1 flex items-center gap-1 font-mono">
                <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Anti-Passback active: Re-scanning this QR is locked out.</span>
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-neutral-950 to-neutral-900 border border-amber-500/40 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Awaiting Gate Admission
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 pl-4 leading-snug">
                Present this screen to <strong className="text-amber-200">Security</strong> or <strong className="text-amber-200">Admins</strong> at the venue entrance.
              </p>
            </div>
          )}
        </div>

        {/* Anti-Passback & Verification Notice */}
        <div className="mt-3 text-[10px] text-neutral-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400/70" />
          <span>One-Time Scannable Official Event Credential</span>
        </div>
      </div>

      {/* Interactive Testing & Role Switching Helper */}
      <div className="w-full max-w-sm mt-5 space-y-2.5">
        <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Test & Scanner Access Options</span>
        </div>

        {/* 1. Simulate Security scanning this pass */}
        <button
          onClick={handleSimulateSecurityScan}
          disabled={simulating}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-95"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>
            {isCheckedIn
              ? 'Test Re-Scan Lockout (Triggers Anti-Passback Alert)'
              : 'Simulate Security Officer Scanning My Pass'}
          </span>
        </button>

        {/* 2. Switch to Security to test actual camera scanning */}
        {securityStaff && (
          <button
            onClick={() => {
              playClickSound();
              switchAccountFast(securityStaff.id);
            }}
            className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-400 text-neutral-200 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Switch to Security ({securityStaff.name})</span>
            </div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
              Has Scanner
            </span>
          </button>
        )}

        {/* 3. Switch to Admin */}
        {adminStaff && (
          <button
            onClick={() => {
              playClickSound();
              switchAccountFast(adminStaff.id);
            }}
            className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-400 text-neutral-200 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Switch to Admin ({adminStaff.name})</span>
            </div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
              Full Access
            </span>
          </button>
        )}

        {/* 4. Log out */}
        <button
          onClick={() => {
            playClickSound();
            logout();
          }}
          className="w-full py-2 px-3 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out / Change Password</span>
        </button>
      </div>
    </div>
  );
};
