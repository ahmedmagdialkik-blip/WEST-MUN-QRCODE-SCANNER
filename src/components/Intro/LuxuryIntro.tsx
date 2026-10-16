import React, { useEffect, useState, useRef, useCallback } from 'react';
import officialLogoImage from '../../assets/images/west_mun_logo_official.jpg';

interface LuxuryIntroProps {
  onComplete: () => void;
}

/**
 * Minimal Luxury Brand Intro Animation (Apple / Rolex / Patek Philippe aesthetic)
 * Duration: exactly 2.6 - 2.8 seconds.
 * 
 * Sequence:
 * 1. Black background
 * 2. Thin antique-gold line draws smoothly across the screen
 * 3. West MUN logo slowly fades in
 * 4. One soft warm light sweep across the logo
 * 5. WEST MUN appears beneath in Cinzel font
 * 6. Smooth fade into the homepage
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
    }, 450);
  }, [onComplete]);

  // Keyboard shortcut to skip (Escape or Enter)
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

  // Precision Luxury Sequence: Total ~2.7s
  useEffect(() => {
    // 0.25s: Thin antique-gold line draws across the screen
    const t1 = setTimeout(() => setStep(1), 250);
    // 0.75s: West MUN logo slowly fades in
    const t2 = setTimeout(() => setStep(2), 750);
    // 1.35s: One soft light sweep across the logo
    const t3 = setTimeout(() => setStep(3), 1350);
    // 1.80s: WEST MUN appears beneath in Cinzel font
    const t4 = setTimeout(() => setStep(4), 1800);
    // 2.65s: Smooth fade into homepage
    const tEnd = setTimeout(() => handleFinish(), 2650);

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
      aria-label="West MUN Luxury Intro Animation"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black select-none overflow-hidden cursor-pointer transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Skip Hint */}
      <div className="absolute top-6 right-6 text-[10px] uppercase tracking-[0.25em] text-[#B08D57]/40 hover:text-[#B08D57] transition-colors font-serif">
        Click anywhere to skip
      </div>

      <div className="relative w-full max-w-sm px-6 flex flex-col items-center justify-center">
        {/* Step 1: Thin Antique-Gold Line Draws Across Screen */}
        <div
          className={`h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition-all duration-700 ease-out mb-6 ${
            step >= 1 ? 'w-56 opacity-80' : 'w-0 opacity-0'
          }`}
        />

        {/* Step 2: West MUN Logo Slowly Fades In */}
        <div
          className={`relative transition-all duration-800 ease-out flex flex-col items-center ${
            step >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]'
          }`}
        >
          {/* Circular Architectural Medallion */}
          <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full p-[1.5px] bg-gradient-to-b from-[#D4AF37]/70 via-[#B08D57]/40 to-[#6E4E2E]/60 shadow-[0_0_40px_rgba(176,141,87,0.2)] overflow-hidden">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#0A0908] flex items-center justify-center relative">
              <img
                src={officialLogoImage}
                alt="West MUN Seal"
                className="w-full h-full object-cover filter contrast-110 brightness-100"
              />

              {/* Step 3: One Soft Light Sweep Across Logo */}
              {step >= 3 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(115deg, transparent 20%, rgba(255, 250, 235, 0.45) 50%, transparent 80%)',
                    animation: 'softLightSweep 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                  }}
                />
              )}
            </div>
          </div>

          {/* Thin Gold Hairline under logo */}
          <div
            className={`w-24 h-[1px] bg-gradient-to-r from-transparent via-[#B08D57]/60 to-transparent mt-6 mb-3 transition-opacity duration-500 ${
              step >= 4 ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Step 4: WEST MUN Appears Beneath in Cinzel Font */}
          <div
            className={`text-center transition-all duration-700 ease-out ${
              step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            }`}
          >
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-[0.3em] text-[#F5F2EA] uppercase font-serif"
              style={{
                fontFamily: "'Cinzel', serif",
                letterSpacing: '0.3em',
              }}
            >
              WEST MUN
            </h1>
            <p
              className="text-[9px] sm:text-[10px] tracking-[0.35em] text-[#B08D57] uppercase font-serif mt-1"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Executive Portal
            </p>
          </div>
        </div>
      </div>

      {/* Clear and Prominent Developer Attribution */}
      <div
        className={`absolute bottom-6 left-0 right-0 text-center select-none pointer-events-none transition-all duration-700 ease-out ${
          step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#120F0D]/90 border border-[#E5C578]/60 shadow-[0_4px_20px_rgba(0,0,0,0.8)] backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#E5C578] animate-pulse" />
          <span
            className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-[#F5F2EA] uppercase font-serif"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Developed by <span className="text-[#E5C578] font-bold">Ahmed Magdi</span>
          </span>
        </div>
      </div>

      <style>{`
        @keyframes softLightSweep {
          0% {
            transform: translateX(-150%);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translateX(150%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
