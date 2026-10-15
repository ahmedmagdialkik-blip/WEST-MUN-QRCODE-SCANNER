import React, { useEffect, useState } from 'react';
import { ScanResult } from '../../types/venue';
import { useVenue } from '../../context/VenueContext';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  User,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Ban,
  Check,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface ScanFeedbackOverlayProps {
  result: ScanResult;
  onDismiss: () => void;
}

export const ScanFeedbackOverlay: React.FC<ScanFeedbackOverlayProps> = ({ result, onDismiss }) => {
  const { currentUser, manualCheckIn, markGuestLeft, flagSecurityIncident, settings } = useVenue();
  const [flagged, setFlagged] = useState(false);
  const [markedLeft, setMarkedLeft] = useState(false);

  useEffect(() => {
    // For duplicate re-scans, give door staff more time to inspect the denial
    const delay = result.type === 'ALREADY_CHECKED_IN' ? 8000 : (settings.autoResetScanDelayMs || 4000);
    const timer = setTimeout(() => {
      onDismiss();
    }, delay);

    return () => clearTimeout(timer);
  }, [onDismiss, settings.autoResetScanDelayMs, result.type]);

  const isSuccess = result.type === 'SUCCESS';
  const isReEntry = result.type === 'RE_ENTRY_SUCCESS';
  const isExit = result.type === 'EXIT_SUCCESS';
  const isAlready = result.type === 'ALREADY_CHECKED_IN';
  const isInvalid = result.type === 'INVALID_TICKET';
  const isNotCheckedIn = result.type === 'NOT_CHECKED_IN';

  const guest = result.guest;

  const handleMarkAsLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    if (guest) {
      markGuestLeft(guest.id);
      setMarkedLeft(true);
      setTimeout(() => {
        onDismiss();
      }, 900);
    }
  };

  const handleFlagSecurity = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    if (guest) {
      flagSecurityIncident(
        guest.id,
        `Flagged at MUN Venue by ${currentUser?.name}. Re-scan attempt #${result.attemptNumber || 2}. Already admitted previously.`
      );
      setFlagged(true);
    }
  };

  const isPositive = isSuccess || isReEntry || isExit;

  return (
    <div
      onClick={onDismiss}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer select-none backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 ${
        isPositive
          ? 'bg-black/92'
          : isAlready
          ? 'bg-red-950/95'
          : 'bg-rose-950/92'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-3xl p-6 border text-center shadow-2xl relative overflow-hidden transition-transform duration-300 ${
          isSuccess
            ? 'bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.35)]'
            : isReEntry
            ? 'bg-gradient-to-b from-neutral-900 via-emerald-950 to-black border-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.35)]'
            : isExit
            ? 'bg-gradient-to-b from-neutral-900 via-amber-950 to-black border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.35)]'
            : isAlready
            ? 'bg-gradient-to-b from-neutral-950 via-red-950 to-black border-2 border-red-500 shadow-[0_0_70px_rgba(239,68,68,0.55)]'
            : 'bg-gradient-to-b from-neutral-950 via-rose-950 to-black border-rose-500 shadow-[0_0_60px_rgba(244,63,94,0.35)]'
        }`}
      >
        {/* Glow orb */}
        <div
          className={`absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-50 pointer-events-none ${
            isReEntry ? 'bg-emerald-500' : isSuccess || isExit ? 'bg-amber-400' : 'bg-red-600'
          }`}
        />

        {/* Status Icon */}
        <div className="flex justify-center mb-4 relative z-10">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-2 ${
              isReEntry
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-neutral-950 border-emerald-200 animate-bounce'
                : isSuccess
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-neutral-950 border-yellow-200 animate-bounce'
                : isExit
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-600 text-neutral-950 border-amber-300'
                : isAlready
                ? 'bg-red-600 text-white border-red-400 animate-pulse ring-4 ring-red-500/30'
                : 'bg-rose-600 text-white border-rose-400 animate-pulse'
            }`}
          >
            {isReEntry && <Sparkles className="w-12 h-12 stroke-[2.5]" />}
            {isSuccess && <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />}
            {isExit && <LogOut className="w-11 h-11 stroke-[2.5]" />}
            {isAlready && <Ban className="w-12 h-12 stroke-[2.5]" />}
            {(isInvalid || isNotCheckedIn) && <XCircle className="w-12 h-12 stroke-[2.5]" />}
          </div>
        </div>

        {/* Status Title */}
        <div className="relative z-10">
          <h2
            className={`text-2xl font-black tracking-wider uppercase leading-tight ${
              isReEntry
                ? 'text-emerald-300'
                : isSuccess || isExit
                ? 'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent'
                : isAlready
                ? 'text-red-400'
                : 'text-rose-300'
            }`}
          >
            {isReEntry && 'Re-Entry Granted'}
            {isSuccess && 'Access Granted'}
            {isExit && 'Departure Confirmed'}
            {isAlready && 'Entry Denied: Already Inside'}
            {isInvalid && 'Invalid Ticket'}
            {isNotCheckedIn && 'Not Checked In'}
          </h2>

          {isAlready && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-bold uppercase tracking-wider animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Duplicate QR Scan Attempt #{result.attemptNumber || 2}</span>
            </div>
          )}

          {isExit && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold tracking-wider">
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>Cleared for Re-Entry Scan</span>
            </div>
          )}

          <p className="text-xs text-amber-300/80 mt-1 mb-4 font-mono font-bold">
            CODE: {result.scannedCode}
          </p>
        </div>

        {/* Guest Details Card */}
        {guest ? (
          <div className="bg-black/90 rounded-2xl p-4 border border-amber-500/40 text-left space-y-3 relative z-10 mb-5 shadow-inner">
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider">
                Attendee Name
              </p>
              <p className="text-lg font-black text-white leading-tight">{guest.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-neutral-800">
              <div>
                <p className="text-[10px] uppercase font-bold text-amber-400/80">Category</p>
                <span
                  className={`inline-block mt-0.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    guest.category === 'VIP'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50'
                      : guest.category === 'Artist' || guest.category === 'Backstage'
                      ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                      : 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                  }`}
                >
                  {guest.category}
                </span>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-amber-400/80">Location</p>
                <p className="text-xs font-semibold text-white mt-0.5">{guest.tableOrSeat || 'MUN Venue'}</p>
              </div>
            </div>

            {/* DUPLICATE RE-SCAN DETAILS */}
            {isAlready && (
              <div className="p-3 rounded-xl bg-red-950/80 border-2 border-red-500/50 space-y-1.5 text-xs text-red-200">
                <div className="flex items-center gap-1.5 font-black text-red-300 uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Single-Scan Policy: Already Admitted</span>
                </div>

                <div className="pt-1 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-neutral-200">
                    <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>
                      Original Admittance:{' '}
                      <strong className="text-white">
                        {result.previousCheckIn?.time !== 'Unknown' && result.previousCheckIn?.time
                          ? new Date(result.previousCheckIn.time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : 'Earlier today'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-300">
                    <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>Admitted By: {result.previousCheckIn?.scanner || 'Security'}</span>
                  </div>

                  <div className="pt-1.5 border-t border-red-500/30 text-[10px] text-amber-300 font-semibold leading-relaxed">
                    Rule: A QR code can only be scanned once unless the person leaves first. If this person has stepped outside or is leaving, tap below to mark them as left and allow re-scan.
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-black/90 rounded-2xl p-4 border border-rose-500/40 text-left relative z-10 mb-5">
            <p className="text-xs text-rose-200 font-bold">
              Barcode not listed in MUN Venue manifest.
            </p>
            <p className="text-[11px] text-neutral-400 mt-2">
              Security notice: Potential counterfeit pass. Flag attendee for door supervisor.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 relative z-10">
          {/* USER REQUIREMENT: When re-scan is blocked, provide instant "Mark as Left" to allow re-scan! */}
          {isAlready && (
            <button
              onClick={handleMarkAsLeft}
              disabled={markedLeft}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 border ${
                markedLeft
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 cursor-default'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-950 border-amber-400 shadow-lg shadow-amber-500/25'
              }`}
            >
              {markedLeft ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Exit Logged - Re-Scan Enabled!</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 text-neutral-950" />
                  <span>Person Is Leaving (Allow Re-Scan)</span>
                </>
              )}
            </button>
          )}

          {/* Flag Duplicate Alert */}
          {isAlready && (
            <button
              onClick={handleFlagSecurity}
              disabled={flagged}
              className={`w-full py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 border ${
                flagged
                  ? 'bg-red-900/60 border-red-500/60 text-white cursor-default'
                  : 'bg-red-950/60 hover:bg-red-900 border-red-500/40 text-red-300'
              }`}
            >
              {flagged ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Incident Logged to Security</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Flag Duplicate Screenshot Alert</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => {
              playClickSound();
              onDismiss();
            }}
            className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
              isPositive
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 shadow-lg shadow-amber-500/30'
                : 'bg-neutral-800 hover:bg-neutral-700 text-white'
            }`}
          >
            <span>Scan Next Attendee</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] text-neutral-400 mt-3 relative z-10">
          Auto-clearing in a few seconds • Tap anywhere to dismiss
        </p>
      </div>
    </div>
  );
};
