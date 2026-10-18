import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { generateGreeting } from '../../utils/voiceGreeting';
import officialLogoUrl from '../../assets/images/west_mun_logo_official.jpg';
import ahmedMagdiFaceUrl from '../../assets/images/ahmed_magdi_face.jpg';

interface WelcomeGreetingOverlayProps {
  displayName: string;
  userRole?: string;
  onComplete: () => void;
}

export const WelcomeGreetingOverlay: React.FC<WelcomeGreetingOverlayProps> = ({
  displayName,
  userRole,
  onComplete,
}) => {
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const completedRef = useRef<boolean>(false);

  // Generate dynamic greeting based on user's local clock
  const { salutation } = generateGreeting(displayName);

  // Check if user has uploaded profile photo (Ahmed Magdi)
  const isAhmed =
    displayName.toLowerCase().includes('ahmed magdi') &&
    !displayName.toLowerCase().includes('volunteer');

  const profilePhotoUrl = isAhmed ? ahmedMagdiFaceUrl : null;

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;

    // Ensure any audio is stopped
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  useEffect(() => {
    // Ensure speech synthesis is cancelled immediately
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    // Auto-advance smoothly after ~2 seconds (as requested: "Display: Welcome back, <Display Name> for approximately 2 seconds. Then smoothly transition to the homepage.")
    const timer = setTimeout(() => {
      handleFinish();
    }, 2200);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0e0c0a] select-none cursor-pointer transition-opacity duration-500 overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Soft Warm Light Beam */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 30%, rgba(176, 141, 87, 0.12) 0%, transparent 65%),
            linear-gradient(to bottom, #110e0c 0%, #080706 100%)
          `,
        }}
      />

      {/* Medieval Corner Accents Overlay */}
      <div className="absolute inset-4 pointer-events-none border border-[#B08D57]/20">
        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#B08D57]/60" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#B08D57]/60" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#B08D57]/60" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#B08D57]/60" />
      </div>

      {/* Center Welcome Card */}
      <div className="relative z-10 w-full max-w-md text-center p-6 sm:p-8 bg-[#161311] border border-[#B08D57]/60 shadow-[0_20px_60px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-500">
        {/* West MUN Official Emblem */}
        <div className="flex justify-center mb-4">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md border border-[#B08D57]/60 p-0.5 bg-[#120f0d] shadow-md overflow-hidden">
            <img
              src={officialLogoUrl}
              alt="West MUN"
              className="w-full h-full object-cover filter contrast-125"
            />
          </div>
        </div>

        {/* User Profile Avatar / Photograph */}
        <div className="flex justify-center mb-4">
          {profilePhotoUrl ? (
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-b from-[#B08D57] via-[#6E4E2E] to-[#B08D57] shadow-lg">
              <img
                src={profilePhotoUrl}
                alt={displayName}
                className="w-full h-full rounded-full object-cover filter brightness-[1.02]"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-950 border border-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          ) : (
            <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full border border-[#B08D57] bg-[#221b16] flex items-center justify-center shadow-lg">
              <span
                className="text-2xl sm:text-3xl font-bold text-[#F5F2EA] font-serif"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {displayName.charAt(0)}
              </span>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-950 border border-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Spoken Greeting as Text */}
        <div className="space-y-1 mb-5">
          <div
            className="text-xs sm:text-sm tracking-[0.2em] text-[#B08D57] uppercase font-serif"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {salutation},
          </div>
          <h1
            className="text-xl sm:text-2xl font-bold tracking-wider text-[#F5F2EA] font-serif"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {displayName}
          </h1>
          <p
            className="text-xs sm:text-sm text-[#F5F2EA]/80 font-serif italic pt-1"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Welcome back to West MUN.
          </p>
          {userRole && (
            <div className="pt-1">
              <span className="text-[10px] uppercase tracking-widest text-[#B08D57]/70 font-mono">
                {userRole}
              </span>
            </div>
          )}
        </div>

        {/* Thin Decorative Divider */}
        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#B08D57]/50 to-transparent mx-auto mb-5" />

        {/* Enter Portal Action & Auto-transition indicator */}
        <div className="flex flex-col items-center gap-3 pt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFinish();
            }}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-[#6E4E2E] hover:bg-[#B08D57] text-[#120f0d] text-xs font-serif font-bold uppercase tracking-wider transition cursor-pointer border border-[#B08D57] shadow-md"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <span>Enter Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <div className="w-36 h-1 bg-[#1f1914] rounded-full overflow-hidden border border-[#B08D57]/30">
            <div className="h-full bg-gradient-to-r from-[#6E4E2E] via-[#B08D57] to-[#e5c578] animate-[welcomeProgress_2.2s_linear_forwards]" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes welcomeProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};
