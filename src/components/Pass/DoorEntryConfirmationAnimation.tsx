/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DoorEntryConfirmationAnimation: Full-screen diplomatic entry celebration
 *
 * Choreography:
 * 1. Key smoothly glides toward the locked mahogany door
 * 2. Key inserts into the lock escutcheon and turns 90 degrees
 * 3. Lock clicks open (mechanical sound effect)
 * 4. Double doors slowly swing open into golden light rays
 * 5. Large glowing green checkmark appears
 * 6. Displays:
 *    🔓 You Have Been Allowed Entry
 *    Welcome to WEST MUN!
 *    Enjoy the event!
 * 7. Automatically returns to the attendee dashboard after ~4.8 seconds
 */

import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Sparkles, Key, Lock, Unlock, ArrowRight } from 'lucide-react';
import { playLockClickSound, playDoorUnlockChime } from '../../utils/audio';
import officialLogoUrl from '../../assets/images/west_mun_logo_official.jpg';

interface DoorEntryConfirmationAnimationProps {
  guestName: string;
  ticketId: string;
  scannerName?: string;
  scanTime?: string;
  onComplete: () => void;
}

type AnimStep =
  | 'approaching' // Key glides toward lock (0 - 1.2s)
  | 'inserting'   // Key enters lock and rotates (1.2s - 2.0s)
  | 'unlocking'   // Lock clicks open (2.0s - 2.6s)
  | 'opening'     // Doors swing open with light rays (2.6s - 3.4s)
  | 'revealed';   // Green checkmark & Welcome text (3.4s - end)

export const DoorEntryConfirmationAnimation: React.FC<DoorEntryConfirmationAnimationProps> = ({
  guestName,
  ticketId,
  scannerName = 'Security Command',
  scanTime,
  onComplete,
}) => {
  const [step, setStep] = useState<AnimStep>('approaching');
  const [isDismissing, setIsDismissing] = useState(false);
  const soundPlayedRef = useRef(false);
  const chimePlayedRef = useRef(false);

  const displayTime = scanTime
    ? new Date(scanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  useEffect(() => {
    // Stage 1: Key approaches lock
    const t1 = setTimeout(() => {
      setStep('inserting');
    }, 1100);

    // Stage 2: Key inserts and turns
    const t2 = setTimeout(() => {
      setStep('unlocking');
      if (!soundPlayedRef.current) {
        soundPlayedRef.current = true;
        playLockClickSound();
      }
    }, 2000);

    // Stage 3: Door swings open
    const t3 = setTimeout(() => {
      setStep('opening');
      if (!chimePlayedRef.current) {
        chimePlayedRef.current = true;
        playDoorUnlockChime();
      }
    }, 2700);

    // Stage 4: Checkmark & welcome message revealed
    const t4 = setTimeout(() => {
      setStep('revealed');
    }, 3400);

    // Stage 5: Automatically return to attendee dashboard
    const t5 = setTimeout(() => {
      handleClose();
    }, 5400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  const handleClose = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 select-none overflow-hidden transition-opacity duration-500 ${
        isDismissing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: '#0a0705',
        backgroundImage: `
          radial-gradient(circle at 50% 40%, rgba(176, 141, 87, 0.22) 0%, transparent 70%),
          radial-gradient(circle at 50% 90%, rgba(16, 185, 129, 0.12) 0%, transparent 60%),
          linear-gradient(to bottom, #0f0a07 0%, #060403 100%)
        `,
      }}
    >
      {/* Background Medieval Arch Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-15 bg-[radial-gradient(#c99b58_1.5px,transparent_1.5px)] [background-size:28px_28px]" />

      {/* Atmospheric Golden Light Rays behind the door */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-1000 flex items-center justify-center ${
          step === 'opening' || step === 'revealed'
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-75'
        }`}
      >
        <div className="w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(245,215,130,0.35)_0%,rgba(212,175,55,0.18)_40%,transparent_70%)] animate-pulse" />
        <div className="absolute w-[700px] h-32 bg-gradient-to-r from-transparent via-[#ffd700]/20 to-transparent rotate-45 transform pointer-events-none blur-sm" />
        <div className="absolute w-[700px] h-32 bg-gradient-to-r from-transparent via-[#ffd700]/20 to-transparent -rotate-45 transform pointer-events-none blur-sm" />
      </div>

      {/* Main Diplomatic Stage Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
        {/* West MUN Emblem Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-sm border border-[#B08D57]/60 overflow-hidden bg-[#160f0a] shadow-md">
            <img src={officialLogoUrl} alt="West MUN" className="w-full h-full object-cover" />
          </div>
          <span
            className="text-xs font-bold tracking-[0.3em] uppercase text-[#B08D57]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            WEST MUN • ACCESS VERIFIED
          </span>
        </div>

        {/* The Grand Diplomatic Door & Key Stage */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 my-2 flex items-center justify-center perspective-[1000px]">
          {/* Door Frame Arch */}
          <div className="absolute inset-0 border-2 border-[#B08D57]/60 rounded-t-full bg-[#120d09] shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Glowing Light Burst inside doorway */}
            <div
              className={`absolute inset-0 bg-gradient-to-b from-[#ffd978] via-[#e5c578] to-[#10b981]/50 transition-opacity duration-1000 flex items-center justify-center ${
                step === 'opening' || step === 'revealed' ? 'opacity-95' : 'opacity-0'
              }`}
            >
              {/* Ethereal light beam particles */}
              <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.9)_0%,transparent_70%)]" />
            </div>

            {/* Left Door Leaf */}
            <div
              className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#2a1a11] via-[#3d2719] to-[#25170e] border-r border-[#1a100a] shadow-2xl origin-left transition-transform duration-1000 ease-out z-10 ${
                step === 'opening' || step === 'revealed'
                  ? '-rotate-y-80 scale-x-90 opacity-60'
                  : 'rotate-y-0 scale-x-100 opacity-100'
              }`}
            >
              {/* Door Wood Grain Panels */}
              <div className="absolute inset-2 border border-[#B08D57]/30 rounded-t-full pointer-events-none" />
              <div className="absolute bottom-4 left-3 right-3 h-24 border border-[#B08D57]/20 pointer-events-none" />
              <div className="absolute top-1/2 right-1.5 w-1.5 h-6 bg-[#d4af37] rounded-sm shadow-md" />
            </div>

            {/* Right Door Leaf */}
            <div
              className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#2a1a11] via-[#3d2719] to-[#25170e] border-l border-[#1a100a] shadow-2xl origin-right transition-transform duration-1000 ease-out z-10 ${
                step === 'opening' || step === 'revealed'
                  ? 'rotate-y-80 scale-x-90 opacity-60'
                  : 'rotate-y-0 scale-x-100 opacity-100'
              }`}
            >
              {/* Door Wood Grain Panels */}
              <div className="absolute inset-2 border border-[#B08D57]/30 rounded-t-full pointer-events-none" />
              <div className="absolute bottom-4 left-3 right-3 h-24 border border-[#B08D57]/20 pointer-events-none" />
              <div className="absolute top-1/2 left-1.5 w-1.5 h-6 bg-[#d4af37] rounded-sm shadow-md" />

              {/* Brass Escutcheon / Keyhole Centerpiece */}
              <div
                className={`absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-12 bg-gradient-to-b from-[#f3e5ab] via-[#d4af37] to-[#aa8222] border border-[#ffe082] rounded-md shadow-lg flex items-center justify-center transition-opacity duration-300 ${
                  step === 'opening' || step === 'revealed' ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {step === 'unlocking' ? (
                  <Unlock className="w-4 h-4 text-[#3d2719] animate-bounce" />
                ) : (
                  <Lock className="w-4 h-4 text-[#3d2719]" />
                )}
              </div>
            </div>
          </div>

          {/* Golden Key Actor: Glides into lock, turns 90deg, disappears as door opens */}
          <div
            className={`absolute z-30 transition-all duration-700 pointer-events-none ${
              step === 'approaching'
                ? 'translate-x-16 -translate-y-2 scale-125 opacity-90'
                : step === 'inserting'
                ? 'translate-x-0 translate-y-0 scale-100 rotate-90 opacity-100'
                : step === 'unlocking'
                ? 'translate-x-0 translate-y-0 scale-95 rotate-90 opacity-100'
                : 'translate-x-0 translate-y-0 scale-50 opacity-0'
            }`}
          >
            <div className="relative p-2 rounded-full bg-[#18110a]/90 border border-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.7)]">
              <Key className="w-10 h-10 text-[#ffd700] drop-shadow-[0_2px_8px_rgba(212,175,55,0.9)]" />
              <Sparkles className="w-4 h-4 text-[#fff3b0] absolute -top-1 -right-1 animate-spin" />
            </div>
          </div>

          {/* Stage 5: Grand Green Checkmark Revealed in Doorway */}
          <div
            className={`absolute z-20 flex flex-col items-center justify-center transition-all duration-700 ${
              step === 'revealed'
                ? 'scale-100 opacity-100'
                : 'scale-50 opacity-0 pointer-events-none'
            }`}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-400 flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.8)] backdrop-blur-md animate-in zoom-in-75 duration-500">
              <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-300 drop-shadow-md" />
            </div>
            <div className="mt-2 px-3 py-1 bg-emerald-950/80 border border-emerald-400/60 text-emerald-200 text-[11px] font-mono font-bold tracking-wider rounded-sm shadow-md">
              STATUS: ENTRY APPROVED
            </div>
          </div>
        </div>

        {/* Text Message Content */}
        <div className="mt-3 space-y-2 px-4 max-w-sm">
          {/* Unlock Icon & Allowed Entry Headline */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">🔓</span>
            <h1
              className="text-xl sm:text-2xl font-bold tracking-[0.1em] text-[#F5F2EA] uppercase font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              You Have Been Allowed Entry
            </h1>
          </div>

          <div
            className="text-base sm:text-lg font-bold text-[#D4AF37] font-serif tracking-wide"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Welcome to WEST MUN!
          </div>

          <p className="text-xs text-neutral-300 font-serif italic">
            Enjoy the event!
          </p>

          {/* Attendee Details Card */}
          <div className="mt-3 p-3 bg-[#18120d] border border-[#B08D57]/40 shadow-inner text-left font-serif text-xs space-y-1">
            <div className="flex items-center justify-between text-[#F5F2EA]">
              <span className="text-neutral-400">Attendee:</span>
              <strong className="text-[#D4AF37]">{guestName}</strong>
            </div>
            <div className="flex items-center justify-between text-[#F5F2EA]">
              <span className="text-neutral-400">Credential Pass:</span>
              <span className="font-mono text-[11px] text-[#F5F2EA]">{ticketId}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-300 text-[11px]">
              <span className="text-neutral-400">Verified By:</span>
              <span>{scannerName}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-300 text-[11px]">
              <span className="text-neutral-400">Time of Scan:</span>
              <span className="font-mono">{displayTime}</span>
            </div>
          </div>

          {/* Immediate Continue Button */}
          <div className="pt-2">
            <button
              onClick={handleClose}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#2b1f17] via-[#423023] to-[#2b1f17] hover:from-[#3a2a1f] hover:to-[#3a2a1f] border border-[#B08D57] text-[#D4AF37] text-xs font-serif font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-95"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
