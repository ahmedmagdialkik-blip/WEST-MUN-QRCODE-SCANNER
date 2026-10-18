import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { playFreshmanNurseryRhyme } from '../../utils/easterEggAudio';
import { Sparkles, Heart, Star, ArrowRight } from 'lucide-react';

interface DanaFreshmanEasterEggProps {
  onComplete: () => void;
}

export const DanaFreshmanEasterEgg: React.FC<DanaFreshmanEasterEggProps> = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const audioCleanupRef = useRef<(() => void) | null>(null);
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;

    // Clean up audio immediately
    if (audioCleanupRef.current) {
      audioCleanupRef.current();
      audioCleanupRef.current = null;
    }

    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  useEffect(() => {
    // 1. Play cheerful nursery rhyme instrumental with soft baby giggle at end
    try {
      audioCleanupRef.current = playFreshmanNurseryRhyme();
    } catch (e) {
      console.warn('Easter egg audio error:', e);
    }

    // 2. Launch pastel confetti celebration
    const pastelColors = ['#FFB6C1', '#BAE6FD', '#FEF08A', '#DDD6FE', '#FBCFE8', '#A7F3D0'];

    try {
      confetti({
        particleCount: 50,
        spread: 90,
        origin: { y: 0.6 },
        colors: pastelColors,
        scalar: 1.2,
        disableForReducedMotion: false,
      });

      // Second gentle wave at 1.8s
      const timerConfetti2 = setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 70,
          origin: { x: 0.1, y: 0.5 },
          colors: pastelColors,
          scalar: 1.1,
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 70,
          origin: { x: 0.9, y: 0.5 },
          colors: pastelColors,
          scalar: 1.1,
        });
      }, 1800);

      // Third wave at giggle time
      const timerConfetti3 = setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 100,
          origin: { y: 0.4 },
          colors: pastelColors,
          scalar: 1.3,
        });
      }, 4800);

      return () => {
        clearTimeout(timerConfetti2);
        clearTimeout(timerConfetti3);
      };
    } catch {
      // ignore
    }

    // 3. Auto-transition to dashboard after ~6.2s total duration
    const exitTimer = setTimeout(() => {
      handleFinish();
    }, 6200);

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
      aria-label="Freshman Welcome Easter Egg"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-hidden select-none transition-opacity duration-600 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: `
          radial-gradient(circle at 20% 20%, rgba(255, 209, 220, 0.8) 0%, transparent 45%),
          radial-gradient(circle at 80% 20%, rgba(186, 230, 253, 0.85) 0%, transparent 45%),
          radial-gradient(circle at 50% 80%, rgba(254, 240, 138, 0.75) 0%, transparent 55%),
          radial-gradient(circle at 80% 80%, rgba(244, 208, 245, 0.8) 0%, transparent 50%),
          linear-gradient(135deg, #FFF1F2 0%, #FEF9C3 30%, #E0F2FE 70%, #FDF2F8 100%)
        `,
      }}
    >
      {/* Playful Floating Cartoon Clouds Background */}
      {/* Cloud 1 - Top Left */}
      <div className="absolute -top-6 -left-8 sm:top-6 sm:left-10 animate-[floatCloud1_7s_ease-in-out_infinite] opacity-90 pointer-events-none">
        <CuteCloud scale={1.2} blush="#FFB6C1" />
      </div>

      {/* Cloud 2 - Top Right */}
      <div className="absolute top-4 -right-10 sm:top-10 sm:right-14 animate-[floatCloud2_8s_ease-in-out_infinite] opacity-90 pointer-events-none">
        <CuteCloud scale={1.35} blush="#BAE6FD" />
      </div>

      {/* Cloud 3 - Bottom Left */}
      <div className="absolute -bottom-8 left-4 sm:bottom-8 sm:left-16 animate-[floatCloud3_6.5s_ease-in-out_infinite] opacity-85 pointer-events-none">
        <CuteCloud scale={1.1} blush="#FEF08A" />
      </div>

      {/* Cloud 4 - Bottom Right */}
      <div className="absolute -bottom-6 right-2 sm:bottom-6 sm:right-20 animate-[floatCloud1_9s_ease-in-out_infinite] opacity-90 pointer-events-none">
        <CuteCloud scale={1.25} blush="#FBCFE8" />
      </div>

      {/* Floating Animated Baby Items (Bottles, Rattles, Pacifiers, Stars, Hearts) */}
      {/* Floating Baby Bottle 1 */}
      <div className="absolute top-[18%] left-[8%] sm:left-[14%] animate-[floatSlow_3.8s_ease-in-out_infinite] pointer-events-none">
        <BabyBottle color="#FFB6C1" />
      </div>

      {/* Floating Pacifier 1 */}
      <div className="absolute top-[22%] right-[10%] sm:right-[15%] animate-[floatWobble_4.2s_ease-in-out_infinite] pointer-events-none">
        <Pacifier color="#38BDF8" />
      </div>

      {/* Floating Rattle */}
      <div className="absolute bottom-[24%] left-[10%] sm:left-[16%] animate-[floatWobble_3.6s_ease-in-out_infinite] pointer-events-none">
        <BabyRattle color="#F472B6" />
      </div>

      {/* Floating Baby Bottle 2 */}
      <div className="absolute bottom-[20%] right-[12%] sm:right-[18%] animate-[floatSlow_4.5s_ease-in-out_infinite] pointer-events-none">
        <BabyBottle color="#60A5FA" />
      </div>

      {/* Floating Stars & Hearts in Background */}
      <div className="absolute top-[35%] left-[5%] animate-[twinkle_2s_ease-in-out_infinite] pointer-events-none">
        <span className="text-3xl filter drop-shadow">⭐</span>
      </div>
      <div className="absolute top-[28%] right-[6%] animate-[twinkle_2.4s_ease-in-out_infinite] pointer-events-none">
        <span className="text-4xl filter drop-shadow">✨</span>
      </div>
      <div className="absolute bottom-[36%] left-[6%] animate-[bobHeart_3s_ease-in-out_infinite] pointer-events-none">
        <span className="text-3xl filter drop-shadow">💖</span>
      </div>
      <div className="absolute bottom-[32%] right-[8%] animate-[bobHeart_2.7s_ease-in-out_infinite] pointer-events-none">
        <span className="text-3xl filter drop-shadow">🍼</span>
      </div>
      <div className="absolute top-[12%] left-[45%] animate-[floatSlow_3s_ease-in-out_infinite] pointer-events-none">
        <span className="text-3xl filter drop-shadow">🧸</span>
      </div>

      {/* Skip Button */}
      <button
        onClick={handleFinish}
        className="absolute top-5 right-5 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-pink-600 font-sans font-bold text-xs shadow-md border border-pink-200 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
      >
        <span>Skip</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Main Center Baby Stage */}
      <div className="relative z-10 max-w-xl w-full flex flex-col items-center text-center">
        {/* Baby Icon Header with bouncing pacifier & rattle */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-pink-200 via-yellow-100 to-sky-200 p-2 shadow-[0_12px_35px_rgba(244,114,182,0.35)] border-4 border-white flex items-center justify-center animate-[babyBounce_1.2s_ease-in-out_infinite]">
            <span className="text-5xl sm:text-6xl filter drop-shadow-md select-none">
              👶
            </span>
          </div>

          {/* Little Floating Bow / Diadem */}
          <div className="absolute -top-3 -right-2 text-3xl animate-[wiggle_1.5s_ease-in-out_infinite]">
            🎀
          </div>
          <div className="absolute -bottom-1 -left-2 text-2xl animate-[twinkle_1.8s_ease-in-out_infinite]">
            🍼
          </div>
        </div>

        {/* Large Bouncing Bubble Text */}
        {/* Line 1: 👶 Aww... Freshman! 👶 */}
        <div className="relative my-2">
          <div className="inline-block animate-[bubbleBounce_1.1s_cubic-bezier(0.34,1.56,0.64,1)_infinite]">
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-pink-500 drop-shadow-[0_4px_0_#FFF] select-none"
              style={{
                fontFamily:
                  'system-ui, -apple-system, BlinkMacSystemFont, "Comic Sans MS", "Fredoka One", "Nunito", sans-serif',
                WebkitTextStroke: '2px #FFFFFF',
                filter: 'drop-shadow(0 6px 12px rgba(236, 72, 153, 0.35))',
              }}
            >
              <span className="inline-block hover:scale-110 transition-transform mr-1">👶</span>
              <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 bg-clip-text text-transparent">
                Aww... Freshman!
              </span>
              <span className="inline-block hover:scale-110 transition-transform ml-1">👶</span>
            </h1>
          </div>
        </div>

        {/* Line 2: Welcome to WEST MUN! */}
        <div className="relative mt-2 mb-3">
          <div className="inline-block animate-[bubbleWiggle_1.4s_ease-in-out_infinite]">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide select-none"
              style={{
                fontFamily:
                  'system-ui, -apple-system, BlinkMacSystemFont, "Comic Sans MS", "Fredoka One", "Nunito", sans-serif',
                WebkitTextStroke: '1.5px #FFFFFF',
                filter: 'drop-shadow(0 4px 8px rgba(14, 165, 233, 0.3))',
              }}
            >
              <span className="bg-gradient-to-r from-sky-500 via-teal-400 to-amber-400 bg-clip-text text-transparent">
                Welcome to WEST MUN!
              </span>
            </h2>
          </div>
        </div>

        {/* Subtitle Badge: Head of Female Press */}
        <div className="mt-2 px-5 py-2 rounded-full bg-white/90 border-2 border-pink-300 shadow-md backdrop-blur-sm flex items-center gap-2 animate-[pulseBadge_2s_ease-in-out_infinite]">
          <span className="text-base">📸</span>
          <span className="text-xs sm:text-sm font-bold text-pink-600 tracking-wide font-sans">
            Dana Alnajar · Head of Female Press
          </span>
          <span className="text-base">🍼</span>
        </div>

        {/* Playful humor footer note */}
        <p className="mt-3 text-xs sm:text-sm font-semibold text-pink-800/80 font-sans tracking-wide">
          Our favorite little freshman in the press room! 💕✨
        </p>

        {/* Cute Progress Bar for Auto-Transition (~6s) */}
        <div className="w-48 h-2.5 mt-5 rounded-full bg-white/70 p-0.5 border border-pink-200 overflow-hidden shadow-inner">
          <div className="h-full rounded-full bg-gradient-to-r from-pink-400 via-yellow-300 to-sky-400 animate-[freshmanProgress_6s_linear_forwards]" />
        </div>
      </div>

      {/* Embedded High-Fidelity CSS Animations */}
      <style>{`
        @keyframes bubbleBounce {
          0%, 100% {
            transform: translateY(0) scale(1) rotate(0deg);
          }
          30% {
            transform: translateY(-16px) scale(1.08) rotate(-2deg);
          }
          60% {
            transform: translateY(-8px) scale(1.03) rotate(2deg);
          }
        }

        @keyframes bubbleWiggle {
          0%, 100% {
            transform: rotate(-1.5deg) scale(1);
          }
          50% {
            transform: rotate(1.5deg) scale(1.05);
          }
        }

        @keyframes babyBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-12px) scale(1.06);
          }
        }

        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-18px) rotate(6deg);
          }
        }

        @keyframes floatWobble {
          0%, 100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          50% {
            transform: translateY(-14px) rotate(-8deg) scale(1.08);
          }
        }

        @keyframes floatCloud1 {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          50% {
            transform: translateX(25px) translateY(-10px);
          }
        }

        @keyframes floatCloud2 {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          50% {
            transform: translateX(-30px) translateY(-12px);
          }
        }

        @keyframes floatCloud3 {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          50% {
            transform: translateX(20px) translateY(8px);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            transform: scale(0.9) rotate(0deg);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.25) rotate(15deg);
            opacity: 1;
          }
        }

        @keyframes bobHeart {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-12px) scale(1.2);
          }
        }

        @keyframes wiggle {
          0%, 100% {
            transform: rotate(-8deg);
          }
          50% {
            transform: rotate(8deg);
          }
        }

        @keyframes pulseBadge {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
        }

        @keyframes freshmanProgress {
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

// -------------------------------------------------------------
// Playful Vector Baby Cartoon Elements
// -------------------------------------------------------------

function CuteCloud({ scale = 1, blush = '#FFB6C1' }: { scale?: number; blush?: string }) {
  return (
    <svg
      width={120 * scale}
      height={70 * scale}
      viewBox="0 0 120 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="filter drop-shadow-[0_8px_16px_rgba(255,182,193,0.35)]"
    >
      <path
        d="M25 55C16.7157 55 10 48.2843 10 40C10 32.1895 15.9877 25.7766 23.6353 25.076C25.6888 15.0135 34.5264 7.5 45.2 7.5C53.4756 7.5 60.6729 12.0003 64.4449 18.6655C67.625 16.3533 71.5541 15 75.8 15C85.7411 15 93.8 23.0589 93.8 33C93.8 33.7224 93.7573 34.4348 93.6744 35.1345C99.4934 36.4357 103.8 41.6548 103.8 47.9C103.8 55.1349 97.9349 61 90.7 61H25C25 55 25 55 25 55Z"
        fill="#FFFFFF"
      />
      {/* Cartoon Smiling Face */}
      {/* Left Eye */}
      <circle cx="46" cy="38" r="2.2" fill="#4A4A4A" />
      {/* Right Eye */}
      <circle cx="64" cy="38" r="2.2" fill="#4A4A4A" />
      {/* Smile */}
      <path
        d="M51 43C53 46 57 46 59 43"
        stroke="#4A4A4A"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Left Rosy Cheek */}
      <ellipse cx="40" cy="42" rx="4" ry="2.5" fill={blush} opacity="0.75" />
      {/* Right Rosy Cheek */}
      <ellipse cx="70" cy="42" rx="4" ry="2.5" fill={blush} opacity="0.75" />
    </svg>
  );
}

function BabyBottle({ color = '#FFB6C1' }: { color?: string }) {
  return (
    <svg
      width="44"
      height="68"
      viewBox="0 0 44 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.12)]"
    >
      {/* Teat / Nipple */}
      <path
        d="M18 10C18 6 20 2 22 2C24 2 26 6 26 10H18Z"
        fill="#FDE68A"
        stroke="#F59E0B"
        strokeWidth="1.5"
      />
      {/* Bottle Ring / Collar */}
      <rect x="13" y="10" width="18" height="6" rx="2" fill={color} />
      {/* Glass Body */}
      <rect
        x="10"
        y="16"
        width="24"
        height="44"
        rx="6"
        fill="#FFFFFF"
        fillOpacity="0.85"
        stroke={color}
        strokeWidth="2"
      />
      {/* Milk Fill */}
      <path
        d="M12 30C15 28 19 32 24 30C28 28 30 31 32 30V54C32 57.3137 29.3137 60 26 60H18C14.6863 60 12 57.3137 12 54V30Z"
        fill="#FEF3C7"
      />
      {/* Measurement Marks */}
      <line x1="14" y1="36" x2="19" y2="36" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="42" x2="21" y2="42" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="48" x2="19" y2="48" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Pacifier({ color = '#38BDF8' }: { color?: string }) {
  return (
    <svg
      width="52"
      height="52"
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.15)]"
    >
      {/* Teat */}
      <ellipse cx="26" cy="14" rx="8" ry="10" fill="#FDE68A" />
      {/* Shield Base */}
      <path
        d="M10 24C10 19 16 17 26 17C36 17 42 19 42 24C42 30 36 32 26 32C16 32 10 30 10 24Z"
        fill={color}
        stroke="#FFFFFF"
        strokeWidth="2"
      />
      {/* Center Button */}
      <circle cx="26" cy="24.5" r="5" fill="#FFFFFF" />
      {/* Ring Handle */}
      <path
        d="M20 28C20 35 23 44 26 44C29 44 32 35 32 28"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BabyRattle({ color = '#F472B6' }: { color?: string }) {
  return (
    <svg
      width="46"
      height="66"
      viewBox="0 0 46 66"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.14)]"
    >
      {/* Top Head Rattle Ring */}
      <circle cx="23" cy="20" r="16" fill="#FFFFFF" stroke={color} strokeWidth="3" />
      <circle cx="23" cy="20" r="10" fill="#FEF08A" />
      {/* Colorful Beads inside */}
      <circle cx="20" cy="18" r="2.5" fill="#38BDF8" />
      <circle cx="26" cy="17" r="2.5" fill="#F472B6" />
      <circle cx="23" cy="23" r="2.5" fill="#A855F7" />
      {/* Ribbon Bow */}
      <ellipse cx="17" cy="38" rx="4" ry="2.5" fill="#F43F5E" />
      <ellipse cx="29" cy="38" rx="4" ry="2.5" fill="#F43F5E" />
      <circle cx="23" cy="38" r="2" fill="#FFE4E6" />
      {/* Rattle Handle */}
      <rect x="20" y="38" width="6" height="20" rx="3" fill={color} />
      {/* Bottom Ring */}
      <circle cx="23" cy="58" r="4.5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  );
}
