import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { playFunnyTaDaSound } from '../../utils/easterEggAudio';
import { ArrowRight, Sparkles } from 'lucide-react';

interface DanaNameChangeEasterEggProps {
  onComplete: () => void;
}

export const DanaNameChangeEasterEgg: React.FC<DanaNameChangeEasterEggProps> = ({
  onComplete,
}) => {
  const fullText = "😂 See, Freshman... I changed your name! 😂";
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
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
    }, 500);
  };

  useEffect(() => {
    // 1. Play funny ta-da fanfare sound (~2.5s)
    try {
      audioCleanupRef.current = playFunnyTaDaSound();
    } catch (e) {
      console.warn('Audio error:', e);
    }

    // 2. Typing animation character-by-character
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      currentIndex++;
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);
        setIsBouncing(true);

        // 3. Launch celebratory confetti wave when typing finishes
        try {
          const colors = ['#F59E0B', '#EC4899', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444'];
          confetti({
            particleCount: 70,
            spread: 80,
            origin: { y: 0.55 },
            colors,
            scalar: 1.3,
          });

          // Second confetti pop
          setTimeout(() => {
            confetti({
              particleCount: 50,
              angle: 60,
              spread: 60,
              origin: { x: 0.15, y: 0.6 },
              colors,
            });
            confetti({
              particleCount: 50,
              angle: 120,
              spread: 60,
              origin: { x: 0.85, y: 0.6 },
              colors,
            });
          }, 600);
        } catch {
          // ignore
        }

        // 4. Keep message on screen for about 3 seconds after typing completes
        setTimeout(() => {
          handleFinish();
        }, 3000);
      }
    }, 45);

    return () => {
      clearInterval(typingInterval);
      if (audioCleanupRef.current) {
        audioCleanupRef.current();
      }
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-label="Exclusive Dana Al Najjar Welcome"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-hidden select-none transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: `
          radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.25) 0%, transparent 60%),
          radial-gradient(circle at 15% 70%, rgba(236, 72, 153, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 85% 70%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
          linear-gradient(to bottom, #18110a 0%, #0d0905 100%)
        `,
      }}
    >
      {/* Decorative Starry / Sparkle Backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:28px_28px]" />

      {/* Floating Laughing Emojis & Playful Elements */}
      <div className="absolute top-[14%] left-[10%] text-4xl sm:text-5xl animate-[bounce_2s_infinite] pointer-events-none">
        😂
      </div>
      <div className="absolute top-[20%] right-[12%] text-4xl sm:text-5xl animate-[bounce_2.4s_infinite] pointer-events-none">
        🤣
      </div>
      <div className="absolute bottom-[22%] left-[14%] text-3xl sm:text-4xl animate-[bounce_2.1s_infinite] pointer-events-none">
        🤭
      </div>
      <div className="absolute bottom-[18%] right-[15%] text-4xl sm:text-5xl animate-[bounce_2.6s_infinite] pointer-events-none">
        😜
      </div>
      <div className="absolute top-[10%] right-[35%] text-3xl animate-pulse pointer-events-none">
        ✨
      </div>
      <div className="absolute bottom-[28%] right-[32%] text-3xl animate-pulse pointer-events-none">
        ⭐
      </div>
      <div className="absolute top-[32%] left-[8%] text-3xl animate-pulse pointer-events-none">
        💫
      </div>

      {/* Skip Button */}
      <button
        onClick={handleFinish}
        className="absolute top-5 right-5 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#241a12]/90 hover:bg-[#342418] text-[#f5c369] font-sans font-bold text-xs shadow-md border border-[#c99b58]/50 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
      >
        <span>Continue</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Main Dialog Card */}
      <div className="relative z-10 w-full max-w-xl text-center px-4">
        {/* Playful Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-serif tracking-widest uppercase mb-4 shadow-sm animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Surprise Update</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>

        {/* Message Container with Bouncing Effect once typed */}
        <div
          className={`relative p-6 sm:p-8 rounded-2xl bg-[#1d140d]/90 border-2 border-[#e5c578]/80 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-md transition-transform duration-300 ${
            isBouncing ? 'scale-105 animate-[bounce_1.2s_ease-in-out_2]' : ''
          }`}
        >
          {/* Ornamental Gold Corner Accents */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#e5c578]" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#e5c578]" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#e5c578]" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#e5c578]" />

          {/* Typing Text Display */}
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#FDF8EE] tracking-wide leading-tight drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)] font-serif min-h-[3.8rem] flex items-center justify-center"
            style={{ fontFamily: "'Cinzel', Georgia, serif" }}
          >
            <span>{displayedText}</span>
            {!isTypingComplete && (
              <span className="inline-block w-1 h-7 sm:h-9 bg-amber-400 ml-1 animate-pulse" />
            )}
          </h1>

          <p
            className={`text-xs sm:text-sm text-[#e5c578]/85 font-serif italic mt-3 transition-opacity duration-300 ${
              isTypingComplete ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Freshman welcome ceremony initiating in 3... 2... 1...
          </p>
        </div>
      </div>
    </div>
  );
};
