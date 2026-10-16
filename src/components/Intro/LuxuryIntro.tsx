import React, { useEffect, useState, useRef, useCallback } from 'react';
import officialLogoImage from '../../assets/images/west_mun_logo_official.jpg';

interface LuxuryIntroProps {
  onComplete: () => void;
}

export const LuxuryIntro: React.FC<LuxuryIntroProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0);
  const [isSkipping, setIsSkipping] = useState<boolean>(false);
  const hasFinishedRef = useRef<boolean>(false);

  const handleFinish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsSkipping(true);

    try {
      localStorage.setItem('west_mun_intro_viewed', 'true');
    } catch {
      // ignore
    }

    setTimeout(() => {
      onComplete();
    }, 400);
  }, [onComplete]);

  // Keyboard and click to skip
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

  // Precision 2.8s Sequence (Think Apple or Rolex)
  useEffect(() => {
    // 0.3s: Thin antique gold line appears
    const t1 = setTimeout(() => setStep(1), 300);
    // 0.85s: Line gradually reveals the West MUN logo
    const t2 = setTimeout(() => setStep(2), 850);
    // 1.5s: Soft warm light moves across logo once
    const t3 = setTimeout(() => setStep(3), 1500);
    // 1.9s: Display WEST MUN in Cinzel
    const t4 = setTimeout(() => setStep(4), 1900);
    // 2.7s: Fade naturally into homepage
    const tEnd = setTimeout(() => handleFinish(), 2750);

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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070605] select-none overflow-hidden cursor-pointer transition-opacity duration-700 ${
        isSkipping ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative w-full max-w-sm px-6 flex flex-col items-center justify-center">
        {/* Step 1: Thin Antique Gold Line */}
        <div
          className={`h-[1px] bg-[#B08D57] transition-all duration-700 ease-out mb-6 ${
            step >= 1 ? 'w-48 opacity-90' : 'w-0 opacity-0'
          }`}
        />

        {/* Step 2: West MUN Logo Revealed */}
        <div
          className={`relative transition-all duration-800 ease-out flex flex-col items-center ${
            step >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* Logo Frame */}
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-md overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.85)] border border-[#B08D57]/40 bg-[#16120e]">
            <img
              src={officialLogoImage}
              alt="West MUN Official Emblem"
              className="w-full h-full object-cover filter contrast-110 brightness-100"
            />

            {/* Step 3: Soft warm light sweep across the logo once */}
            {step >= 3 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(110deg, transparent 25%, rgba(255, 245, 220, 0.35) 50%, transparent 75%)',
                  animation: 'warmSheenSweep 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards',
                }}
              />
            )}
          </div>

          {/* Thin separator line under logo */}
          <div
            className={`w-28 h-[1px] bg-[#B08D57]/50 mt-5 mb-3 transition-opacity duration-500 ${
              step >= 4 ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Step 4: WEST MUN in Cinzel */}
          <div
            className={`text-center transition-all duration-600 ease-out ${
              step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            }`}
          >
            <h1
              className="text-xl sm:text-2xl font-bold tracking-[0.28em] text-[#B08D57] uppercase font-serif"
              style={{
                fontFamily: "'Cinzel', serif",
                letterSpacing: '0.28em',
              }}
            >
              WEST MUN
            </h1>
            <p
              className="text-[9px] sm:text-[10px] tracking-[0.35em] text-[#F5F2EA]/60 uppercase font-serif mt-1"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Executive Delegation
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes warmSheenSweep {
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
