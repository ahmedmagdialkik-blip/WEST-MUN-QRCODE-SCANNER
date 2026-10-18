import React, { useEffect, useState, useRef } from 'react';
import { playUnderSecretaryFanfare } from '../../utils/underSecretaryFanfareAudio';
import officialLogoUrl from '../../assets/images/west_mun_logo_official.jpg';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface UnderSecretaryWelcomeEasterEggProps {
  onComplete: () => void;
}

export const UnderSecretaryWelcomeEasterEgg: React.FC<UnderSecretaryWelcomeEasterEggProps> = ({
  onComplete,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const audioCleanupRef = useRef<(() => void) | null>(null);
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;

    if (audioCleanupRef.current) {
      audioCleanupRef.current();
      audioCleanupRef.current = null;
    }

    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 550);
  };

  useEffect(() => {
    // 1. Play grand orchestral fanfare (~5s)
    try {
      audioCleanupRef.current = playUnderSecretaryFanfare();
    } catch (e) {
      console.warn('Fanfare audio failed:', e);
    }

    // 2. Auto-transition to dashboard after ~5.6s
    const exitTimer = setTimeout(() => {
      handleFinish();
    }, 5600);

    return () => {
      clearTimeout(exitTimer);
      if (audioCleanupRef.current) {
        audioCleanupRef.current();
      }
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-label="Under Secretary-General Welcome"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 select-none overflow-hidden transition-opacity duration-600 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#070D18',
        backgroundImage: `
          radial-gradient(circle at 50% 30%, rgba(26, 47, 82, 0.75) 0%, transparent 60%),
          radial-gradient(circle at 20% 80%, rgba(212, 175, 55, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(212, 175, 55, 0.08) 0%, transparent 50%),
          linear-gradient(to bottom, #091222 0%, #050810 100%)
        `,
      }}
    >
      {/* Subtle Classical Grid Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:32px_32px]" />

      {/* Floating Golden Particles (WEST MUN Stardust) */}
      {[...Array(18)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#D4AF37] pointer-events-none animate-[usgParticle_6s_ease-in-out_infinite]"
          style={{
            width: `${(i % 3) + 2}px`,
            height: `${(i % 3) + 2}px`,
            left: `${(i * 19) % 96}%`,
            top: `${(i * 23) % 92}%`,
            opacity: 0.45 + (i % 5) * 0.1,
            animationDelay: `${(i * 0.35) % 4}s`,
            animationDuration: `${4.5 + (i % 3)}s`,
          }}
        />
      ))}

      {/* Skip Button */}
      <button
        onClick={handleFinish}
        className="absolute top-5 right-5 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#0D1A30]/80 hover:bg-[#14284A] text-[#D4AF37] font-serif text-xs uppercase tracking-widest border border-[#D4AF37]/40 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        <span>Proceed</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Central Majestic Stage */}
      <div className="relative z-10 max-w-lg w-full flex flex-col items-center text-center animate-[usgZoomGlow_5.5s_ease-out_forwards]">
        {/* Outer Diplomatic Gold & Navy Crest Frame */}
        <div className="relative p-1 bg-gradient-to-b from-[#F3E5AB] via-[#D4AF37] to-[#8C6D23] shadow-[0_20px_60px_rgba(0,0,0,0.9)] rounded-lg mb-6">
          {/* Ambient Golden Halo */}
          <div className="absolute -inset-8 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.3)_0%,rgba(11,27,51,0.2)_50%,transparent_75%)] blur-xl pointer-events-none -z-10 animate-pulse" />

          {/* Arch Corner Accents */}
          <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#F3E5AB]" />
          <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#F3E5AB]" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#F3E5AB]" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#F3E5AB]" />

          {/* West MUN Official Emblem */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-[#091222] overflow-hidden flex items-center justify-center border border-[#D4AF37]/60 rounded">
            <img
              src={officialLogoUrl}
              alt="WEST MUN Official Emblem"
              className="w-full h-full object-contain filter contrast-115 brightness-105"
            />
            {/* Shimmer Light Sweep */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(115deg, transparent 20%, rgba(255, 245, 215, 0.5) 50%, transparent 80%)',
                animation: 'usgLightSweep 1.6s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        {/* Polished Diplomatic Typography */}
        {/* Line 1: 🎖️ Welcome Back! */}
        <div className="flex items-center justify-center gap-2 mb-2 animate-[usgFadeIn_0.8s_ease-out_forwards]">
          <span className="text-2xl filter drop-shadow">🎖️</span>
          <span
            className="text-sm sm:text-base tracking-[0.3em] uppercase text-[#D4AF37] font-serif font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Welcome Back!
          </span>
        </div>

        {/* Line 2: Zain Firas */}
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.16em] uppercase text-[#FFFFFF] font-serif my-1"
          style={{
            fontFamily: "'Cinzel', serif",
            textShadow: '0 0 25px rgba(212, 175, 55, 0.6), 0 2px 4px rgba(0,0,0,0.9)',
          }}
        >
          Zain Firas
        </h1>

        {/* Thin Gold Engraved Accent Line */}
        <div className="w-40 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent my-3 shadow-[0_0_8px_#D4AF37]" />

        {/* Line 3: Under Secretary-General */}
        <div
          className="text-base sm:text-lg tracking-[0.25em] uppercase text-[#F3E5AB] font-serif font-bold"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Under Secretary-General
        </div>

        {/* Line 4: WEST MUN */}
        <div
          className="text-xs sm:text-sm tracking-[0.45em] uppercase text-[#D4AF37]/90 font-serif font-semibold mt-1"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          WEST MUN
        </div>

        {/* Executive Clearance Badge */}
        <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0E1A30]/90 border border-[#D4AF37]/50 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-[11px] uppercase tracking-widest text-[#F7F2EA] font-serif">
            Executive Board • Senior Leadership
          </span>
        </div>

        {/* Progress Bar for Smooth Transition (~5.6s) */}
        <div className="w-48 h-1.5 mt-6 rounded-full bg-[#0D1A30] border border-[#D4AF37]/30 overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-[#8C6D23] via-[#D4AF37] to-[#F3E5AB] animate-[usgProgress_5.6s_linear_forwards]" />
        </div>
      </div>

      {/* Embedded CSS Animations */}
      <style>{`
        @keyframes usgZoomGlow {
          0% {
            transform: scale(0.96);
            opacity: 0.85;
          }
          100% {
            transform: scale(1.03);
            opacity: 1;
          }
        }

        @keyframes usgFadeIn {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes usgParticle {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-25px) scale(1.4);
          }
        }

        @keyframes usgLightSweep {
          0% {
            transform: translateX(-150%);
          }
          50% {
            transform: translateX(150%);
          }
          100% {
            transform: translateX(150%);
          }
        }

        @keyframes usgProgress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
