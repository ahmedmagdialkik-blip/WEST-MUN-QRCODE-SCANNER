import React, { useEffect, useState, useRef, useCallback } from 'react';
import officialLogoImage from '../../assets/images/west_mun_logo_official.jpg';

interface LuxuryIntroProps {
  onComplete: () => void;
}

/**
 * Bespoke West MUN Luxury Intro Animation
 * 
 * Powered by the official WEST MUN Logo (Golden Oscar-style statuette,
 * azimuthal globe grid, celestial 5-point star, and warm bronze leather background).
 * 
 * Sequence:
 * 1. Deep bronze-black textured background
 * 2. Fine golden line draws itself horizontally across screen
 * 3. Official WEST MUN Logo reveals itself with rich metallic reflections
 * 4. Warm radiant light sheen sweeps gracefully across the golden statue and globe
 * 5. WEST MUN title illuminates in Cinzel font with bronze-gold accents
 * 6. "Developed by Ahmed Magdi" accreditation badge fades in softly
 * 7. Smooth crossfade into the next stage (Login or Homepage)
 */
export const LuxuryIntro: React.FC<LuxuryIntroProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const hasFinishedRef = useRef<boolean>(false);

  const handleFinish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsFadingOut(true);

    try {
      localStorage.setItem('west_mun_intro_viewed', 'true');
    } catch {
      // ignore
    }

    setTimeout(() => {
      onComplete();
    }, 500);
  }, [onComplete]);

  // Keyboard shortcut to skip (Escape, Space, or Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFinish]);

  // Precision Luxury Sequence: ~2.8s total
  useEffect(() => {
    // 0.25s: Thin antique-gold line draws across the screen
    const t1 = setTimeout(() => setStep(1), 250);
    // 0.70s: Official West MUN logo reveals itself
    const t2 = setTimeout(() => setStep(2), 700);
    // 1.30s: Radiant light sheen sweeps across golden statuette & globe
    const t3 = setTimeout(() => setStep(3), 1300);
    // 1.80s: WEST MUN typography appears beneath in Cinzel
    const t4 = setTimeout(() => setStep(4), 1800);
    // 2.80s: Smooth fade into next view
    const tEnd = setTimeout(() => handleFinish(), 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tEnd);
    };
  }, [handleFinish]);

  return (
    <div
      onClick={handleFinish}
      role="region"
      aria-label="West MUN Official Logo Intro Animation"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer transition-opacity duration-600 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#120b07',
        backgroundImage: `
          radial-gradient(circle at 50% 45%, rgba(61, 40, 28, 0.45) 0%, transparent 70%),
          radial-gradient(circle at 50% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 55%),
          linear-gradient(to bottom, #170f0a 0%, #0c0704 100%)
        `,
      }}
    >
      {/* Subtle Leather Texture Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#a87944_1px,transparent_1px)] [background-size:28px_28px]" />

      {/* Skip Button Hint */}
      <div className="absolute top-6 right-6 text-[10px] uppercase tracking-[0.25em] text-[#c99b58]/50 hover:text-[#e5c578] transition-colors font-serif z-20">
        Click anywhere to skip
      </div>

      <div className="relative w-full max-w-md px-6 flex flex-col items-center justify-center">
        {/* Step 1: Thin Antique-Gold Line Draws Horizontally */}
        <div
          className={`h-[1.5px] bg-gradient-to-r from-transparent via-[#e5c578] to-transparent transition-all duration-700 ease-out mb-7 ${
            step >= 1 ? 'w-64 opacity-90' : 'w-0 opacity-0'
          }`}
        />

        {/* Step 2: Official West MUN Logo Reveal */}
        <div
          className={`relative transition-all duration-900 ease-out flex flex-col items-center ${
            step >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.96]'
          }`}
        >
          {/* Outer Engraved Metallic Gold & Bronze Frame with Ambient Glow */}
          <div className="relative p-1 bg-gradient-to-b from-[#e5c578]/80 via-[#a87944]/50 to-[#6d4825]/80 shadow-[0_15px_50px_rgba(0,0,0,0.95)] rounded-lg">
            {/* Ambient Golden Halo behind Logo */}
            <div className="absolute -inset-6 bg-[radial-gradient(ellipse_at_center,rgba(229,197,120,0.25)_0%,rgba(168,121,68,0.1)_50%,transparent_75%)] blur-lg pointer-events-none -z-10" />

            {/* Medieval Arch Corner Accents */}
            <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#e5c578]" />
            <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#e5c578]" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#e5c578]" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#e5c578]" />

            {/* Logo Image Container showcasing the Official West MUN Logo */}
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 bg-[#160f0a] overflow-hidden flex items-center justify-center border border-[#a87944]/60 rounded">
              <img
                src={officialLogoImage}
                alt="West MUN Official Emblem"
                className="w-full h-full object-contain filter contrast-110 brightness-105"
              />

              {/* Step 3: Warm Radiant Light Sweep Across the Golden Statuette & Globe */}
              {step >= 3 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(115deg, transparent 15%, rgba(255, 245, 215, 0.45) 50%, transparent 85%)',
                    animation: 'logoLightSweep 1.05s cubic-bezier(0.2, 0.9, 0.3, 1) forwards',
                  }}
                />
              )}
            </div>
          </div>

          {/* Thin Engraved Divider Underneath */}
          <div
            className={`w-32 h-[1px] bg-gradient-to-r from-transparent via-[#c99b58]/70 to-transparent mt-6 mb-3 transition-opacity duration-500 ${
              step >= 4 ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Step 4: WEST MUN Typography Appears in Cinzel Font */}
          <div
            className={`text-center transition-all duration-700 ease-out ${
              step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-[0.28em] text-[#F7F2EA] uppercase font-serif"
              style={{
                fontFamily: "'Cinzel', serif",
                letterSpacing: '0.28em',
              }}
            >
              WEST MUN
            </h1>
            <p
              className="text-[10px] sm:text-[11px] tracking-[0.35em] text-[#c99b58] uppercase font-serif mt-1 font-semibold"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Executive Portal
            </p>
          </div>
        </div>
      </div>

      {/* Prominent Developer Attribution Badge */}
      <div
        className={`absolute bottom-6 left-0 right-0 text-center select-none pointer-events-none transition-all duration-700 ease-out ${
          step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1b120c]/90 border border-[#c99b58]/60 shadow-[0_4px_25px_rgba(0,0,0,0.85)] backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#e5c578] animate-pulse" />
          <span
            className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-[#F7F2EA] uppercase font-serif"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Developed by <span className="text-[#e5c578] font-bold">Ahmed Magdi</span>
          </span>
        </div>
      </div>

      <style>{`
        @keyframes logoLightSweep {
          0% {
            transform: translateX(-160%);
            opacity: 0;
          }
          30% {
            opacity: 0.95;
          }
          100% {
            transform: translateX(160%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
