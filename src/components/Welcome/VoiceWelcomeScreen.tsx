import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Volume2, VolumeX, ArrowRight, Shield, Calendar, Music } from 'lucide-react';
import officialLogoImage from '../../assets/images/west_mun_logo_official.jpg';
import { StaffMember, ROLE_LABELS } from '../../types/venue';
import { getTimeOfDayGreeting, isVoiceMuted, setVoiceMuted } from '../../utils/speech';
import { playMozartWelcomeMusic } from '../../utils/mozartMusic';
import { playClickSound } from '../../utils/audio';

interface VoiceWelcomeScreenProps {
  user: StaffMember;
  onComplete: () => void;
}

export const VoiceWelcomeScreen: React.FC<VoiceWelcomeScreenProps> = ({
  user,
  onComplete,
}) => {
  const [muted, setMuted] = useState<boolean>(isVoiceMuted);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  const musicControlRef = useRef<{ fadeOut: (dur?: number) => void; stop: () => void } | null>(null);
  const hasFinishedRef = useRef<boolean>(false);

  // Dynamic time-based greeting calculation (never hardcoded)
  const displayName = user?.name?.trim() || 'Delegate';
  const { salutation } = getTimeOfDayGreeting(displayName);

  // Format today's date in formal diplomatic style
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Role metadata
  const roleMeta = ROLE_LABELS[user.role];
  const roleDisplayTitle = user.customTitle || roleMeta?.title || 'Diplomatic Delegate';

  const handleFinish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    // Fade music smoothly
    if (musicControlRef.current) {
      musicControlRef.current.fadeOut(500);
    }

    setIsExiting(true);
    setTimeout(() => {
      if (musicControlRef.current) {
        musicControlRef.current.stop();
      }
      onComplete();
    }, 450); // smooth fade-out duration
  }, [onComplete]);

  // Start Mozart background music and schedule gentle completion
  useEffect(() => {
    let fadeTimer: NodeJS.Timeout | null = null;
    let endTimer: NodeJS.Timeout | null = null;

    // 1. Play Mozart classical chamber strings
    if (!muted) {
      try {
        musicControlRef.current = playMozartWelcomeMusic(0.22);
      } catch (err) {
        console.warn('Could not start Mozart audio:', err);
      }
    }

    // 2. Allow Mozart's iconic theme to play gracefully for ~4.6 seconds, then fade out
    fadeTimer = setTimeout(() => {
      if (musicControlRef.current) {
        musicControlRef.current.fadeOut(1400);
      }
    }, 4600);

    endTimer = setTimeout(() => {
      handleFinish();
    }, 6000);

    return () => {
      if (fadeTimer) clearTimeout(fadeTimer);
      if (endTimer) clearTimeout(endTimer);
      if (musicControlRef.current) musicControlRef.current.stop();
    };
  }, [handleFinish, muted]);

  // Toggle Mute / Unmute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    const nextMuted = !muted;
    setMuted(nextMuted);
    setVoiceMuted(nextMuted);

    if (nextMuted) {
      if (musicControlRef.current) musicControlRef.current.stop();
    } else {
      try {
        musicControlRef.current = playMozartWelcomeMusic(0.22);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-label="West MUN Mozart Welcome Screen"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#070605] text-[#F5F2EA] px-4 select-none transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-[0.99] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 30%, rgba(176, 141, 87, 0.12) 0%, transparent 65%),
          radial-gradient(circle at 50% 85%, rgba(110, 78, 46, 0.08) 0%, transparent 70%)
        `,
      }}
    >
      {/* Top Controls: Mozart Audio Mute & Skip */}
      <div className="absolute top-6 left-0 right-0 max-w-4xl mx-auto px-6 flex items-center justify-between z-20">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute Mozart music' : 'Mute Mozart music'}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xs border border-[#B08D57]/30 bg-[#120f0d]/80 text-[#B08D57] hover:text-[#F5F2EA] hover:border-[#B08D57]/60 transition-colors text-xs font-serif cursor-pointer shadow-sm"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {muted ? (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider">Music Muted</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 animate-pulse text-[#E5C578]" />
              <span className="text-[10px] uppercase tracking-wider">Mozart Music On</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            playClickSound();
            handleFinish();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs border border-[#B08D57]/30 bg-[#120f0d]/80 text-[#B08D57] hover:text-[#F5F2EA] hover:border-[#B08D57]/60 transition-colors text-xs font-serif cursor-pointer shadow-sm"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <span className="text-[10px] uppercase tracking-wider">Skip</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Main Diplomatic Welcome Medallion & Greeting Card */}
      <div className="relative w-full max-w-lg mx-auto flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">
        {/* Subtle decorative engraved crown header */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#B08D57]/60" />
          <span
            className="text-[11px] uppercase tracking-[0.3em] text-[#B08D57] font-serif"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            West MUN • Protocol
          </span>
          <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#B08D57]/60" />
        </div>

        {/* Official West MUN Seal Medallion */}
        <div className="relative flex items-center justify-center mb-6">
          {/* Outer Antique Gold Ring with Warm Ambient Glow */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-[2px] bg-gradient-to-b from-[#E5C578] via-[#B08D57] to-[#6E4E2E] shadow-[0_0_40px_rgba(176,141,87,0.3)] relative">
            {/* Inner Dark Rim Framing Official Seal */}
            <div className="w-full h-full rounded-full bg-[#120f0d] p-1.5 flex items-center justify-center overflow-hidden border border-[#B08D57]/40">
              <img
                src={officialLogoImage}
                alt="West MUN Official Emblem"
                className="w-full h-full rounded-full object-cover filter contrast-110 brightness-100"
              />
            </div>

            {/* Subtle Mozart music pulse ring */}
            {!muted && (
              <span className="absolute -inset-1.5 rounded-full border border-[#D4AF37]/30 animate-pulse pointer-events-none" />
            )}
          </div>
        </div>

        {/* Mozart Classical Music Live Indicator */}
        <div className="h-5 flex items-center justify-center gap-2 mb-3">
          {!muted ? (
            <div className="flex items-center gap-2 text-[#E5C578] px-3 py-0.5 rounded-full bg-[#16120E] border border-[#B08D57]/30">
              <div className="flex items-center gap-1">
                <span className="w-1 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-3.5 bg-[#E5C578] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-2.5 bg-[#B08D57] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <Music className="w-3 h-3 text-[#E5C578]" />
              <span
                className="text-[10px] uppercase tracking-wider text-[#B08D57] font-serif"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Mozart • Eine kleine Nachtmusik
              </span>
            </div>
          ) : (
            <span
              className="text-[10px] uppercase tracking-[0.22em] text-[#B08D57]/80 font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Diplomatic Session Authenticated
            </span>
          )}
        </div>

        {/* Salutation & Dynamic Greeting Text */}
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-[0.06em] text-[#F5F2EA] mb-2 leading-tight"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {salutation}
        </h1>

        {/* Subtitle Message */}
        <p
          className="text-base sm:text-lg text-[#CFC7B4] font-serif italic max-w-md mx-auto mb-4 leading-relaxed"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          &ldquo;Welcome back to the West MUN Executive Portal.&rdquo;
        </p>

        {/* Diplomatic Role Badge & Today's Date */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-[#B08D57]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xs bg-[#1A1512] border border-[#B08D57]/30">
            <Shield className="w-3.5 h-3.5 text-[#B08D57] shrink-0" />
            <span
              className="font-serif uppercase tracking-wider text-[11px] text-[#F5F2EA]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {roleDisplayTitle}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-neutral-400 font-serif text-[12px]">
            <Calendar className="w-3 h-3 text-[#B08D57]" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Bottom Antique Gold Atmospheric Shimmer Line */}
        <div className="w-48 h-[1px] bg-neutral-800 mt-8 relative overflow-hidden rounded-full">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5C578] to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  );
};
