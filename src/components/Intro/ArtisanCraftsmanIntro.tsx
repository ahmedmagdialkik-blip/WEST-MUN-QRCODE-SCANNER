import React, { useEffect, useRef, useState, useCallback } from 'react';
import emblemImage from '../../assets/images/west_mun_emblem.jpg';

interface ArtisanCraftsmanIntroProps {
  onComplete: () => void;
  onSkip?: () => void;
}

type SceneStage = 'scene1_line' | 'scene2_engraving' | 'scene3_still' | 'scene4_dissolve';

export const ArtisanCraftsmanIntro: React.FC<ArtisanCraftsmanIntroProps> = ({
  onComplete,
  onSkip,
}) => {
  const [stage, setStage] = useState<SceneStage>('scene1_line');
  const [isSkipping, setIsSkipping] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasFinishedRef = useRef<boolean>(false);

  // Safe completion trigger
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
      if (onSkip) onSkip();
      onComplete();
    }, 400);
  }, [onComplete, onSkip]);

  // Keyboard navigation listener (Esc to skip)
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

  // Master Timeline of the 4 Scenes
  useEffect(() => {
    // Scene 1: Black screen. Single golden line draws across (0ms - 1300ms)
    // Scene 2: Engraving craftsman outline (1300ms - 3600ms)
    const t2 = setTimeout(() => {
      setStage('scene2_engraving');
    }, 1300);

    // Scene 3: Finished logo sits in silence, warm light sweeps across it, WEST MUN in Cinzel fades in (3600ms - 5200ms)
    const t3 = setTimeout(() => {
      setStage('scene3_still');
    }, 3600);

    // Scene 4: Logo gently dissolves into fine golden dust flowing upward (5200ms - 6800ms)
    const t4 = setTimeout(() => {
      setStage('scene4_dissolve');
    }, 5200);

    // Complete and naturally transform into homepage (6800ms)
    const tEnd = setTimeout(() => {
      handleFinish();
    }, 6800);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tEnd);
    };
  }, [handleFinish]);

  // Canvas Particle System for Scene 4: Engraved logo dissolves into fine golden dust flowing upward
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Dust particles
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      decay: number;
      life: number;
    }

    const particles: Particle[] = [];
    const centerX = width / 2;
    const centerY = height * 0.45;
    const emblemRadius = Math.min(width * 0.22, 130);

    // Spawn dust particles
    const spawnDust = (count: number) => {
      for (let i = 0; i < count; i++) {
        // Sample points from concentric circles of the emblem
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * emblemRadius;
        particles.push({
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.6 - Math.random() * 1.6, // flowing upward
          size: Math.random() * 1.8 + 0.6,
          alpha: Math.random() * 0.8 + 0.2,
          decay: 0.006 + Math.random() * 0.008,
          life: 1,
        });
      }
    };

    let frameCount = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // When reaching Scene 4 (dissolve), continuously spawn dust particles from the logo
      if (stage === 'scene4_dissolve') {
        if (frameCount < 70) {
          spawnDust(18);
        }
      }

      // Update and draw fine golden dust
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.015; // upward gentle acceleration
        p.life -= p.decay;

        if (p.life <= 0 || p.y < -10) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(176, 141, 87, ${p.alpha * p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      frameCount++;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [stage]);

  return (
    <div
      ref={containerRef}
      onClick={handleFinish}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black select-none overflow-hidden cursor-pointer transition-opacity duration-700 ${
        isSkipping ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Canvas for fine golden dust particles flowing upward in Scene 4 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />

      {/* Skip Hint (Very subtle, minimal) */}
      <div className="absolute bottom-6 right-6 z-30 opacity-40 hover:opacity-80 transition text-[10px] tracking-[0.2em] uppercase font-serif text-[#B08D57]/70">
        Click or [Esc] to Skip
      </div>

      {/* Scene 1: Single golden line slowly drawing itself across the screen */}
      {stage === 'scene1_line' && (
        <div className="relative w-full max-w-xl px-8 flex items-center justify-center">
          <div className="relative w-full h-[1px]">
            {/* The golden line with artisan stylus tip */}
            <div
              className="h-full bg-gradient-to-r from-transparent via-[#D4AF37] to-[#B08D57] shadow-[0_0_8px_rgba(212,175,55,0.4)]"
              style={{
                animation: 'goldenLineDraw 1.25s cubic-bezier(0.25, 1, 0.5, 1) forwards',
              }}
            />
          </div>
        </div>
      )}

      {/* Scene 2, 3, & 4: Engraving outline -> Silent logo with warm light sweep -> Golden dust dissolve */}
      {stage !== 'scene1_line' && (
        <div
          className={`relative flex flex-col items-center justify-center transition-all duration-1000 ${
            stage === 'scene4_dissolve' ? 'opacity-0 scale-105 filter blur-[1px]' : 'opacity-100 scale-100'
          }`}
        >
          {/* Master Engraved Logo Container */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            {/* Handcrafted Engraved SVG Stencil of the West MUN Crest */}
            <svg
              viewBox="0 0 240 240"
              className="w-full h-full text-[#B08D57]"
              fill="none"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Chiseled Bezel Circle */}
              <circle
                cx="120"
                cy="120"
                r="104"
                strokeWidth="1.5"
                strokeDasharray="660"
                strokeDashoffset={stage === 'scene2_engraving' ? '0' : '0'}
                className="transition-all duration-[2200ms] ease-out opacity-85"
                style={{
                  strokeDashoffset: stage === 'scene2_engraving' ? '0' : '0',
                  animation: stage === 'scene2_engraving' ? 'engravePath 2.2s ease-out forwards' : 'none',
                }}
              />

              {/* Inner Concentric Engraved Ring */}
              <circle
                cx="120"
                cy="120"
                r="94"
                strokeWidth="0.75"
                strokeDasharray="600"
                className="opacity-60"
                style={{
                  animation: stage === 'scene2_engraving' ? 'engravePath 2.4s ease-out forwards' : 'none',
                }}
              />

              {/* Left Diplomatic Laurel / Olive Branch */}
              <path
                d="M 50 150 C 44 120 54 85 78 60 C 80 72 74 90 68 110 C 62 128 58 142 50 150 Z
                   M 58 120 C 45 105 48 90 52 82 C 58 92 63 105 60 118 Z
                   M 66 94 C 58 78 64 68 70 62 C 73 72 74 84 68 93 Z"
                strokeWidth="1"
                fill="currentColor"
                fillOpacity={stage === 'scene3_still' ? '0.15' : '0.08'}
                className="transition-all duration-[2200ms]"
                style={{
                  animation: stage === 'scene2_engraving' ? 'engravePath 2s ease-out forwards' : 'none',
                }}
              />

              {/* Right Diplomatic Laurel / Olive Branch */}
              <path
                d="M 190 150 C 196 120 186 85 162 60 C 160 72 166 90 172 110 C 178 128 182 142 190 150 Z
                   M 182 120 C 195 105 192 90 188 82 C 182 92 177 105 180 118 Z
                   M 174 94 C 182 78 176 68 170 62 C 167 72 166 84 172 93 Z"
                strokeWidth="1"
                fill="currentColor"
                fillOpacity={stage === 'scene3_still' ? '0.15' : '0.08'}
                className="transition-all duration-[2200ms]"
                style={{
                  animation: stage === 'scene2_engraving' ? 'engravePath 2s ease-out forwards' : 'none',
                }}
              />

              {/* Central Diplomatic Shield & Globe Lines */}
              <path
                d="M 120 58 L 160 74 C 160 125 142 165 120 182 C 98 165 80 125 80 74 Z"
                strokeWidth="1.25"
                className="opacity-90"
                style={{
                  animation: stage === 'scene2_engraving' ? 'engravePath 2.3s ease-out forwards' : 'none',
                }}
              />

              {/* Globe Latitude & Longitude Coordinate Filigree */}
              <circle
                cx="120"
                cy="114"
                r="30"
                strokeWidth="0.8"
                strokeDasharray="200"
                className="opacity-70"
                style={{
                  animation: stage === 'scene2_engraving' ? 'engravePath 2.1s ease-out forwards' : 'none',
                }}
              />
              <ellipse
                cx="120"
                cy="114"
                rx="14"
                ry="30"
                strokeWidth="0.75"
                className="opacity-60"
              />
              <line
                x1="90"
                y1="114"
                x2="150"
                y2="114"
                strokeWidth="0.75"
                className="opacity-60"
              />
              <line
                x1="95"
                y1="102"
                x2="145"
                y2="102"
                strokeWidth="0.6"
                className="opacity-50"
              />
              <line
                x1="95"
                y1="126"
                x2="145"
                y2="126"
                strokeWidth="0.6"
                className="opacity-50"
              />

              {/* Diplomatic Star Emblem at top of shield */}
              <polygon
                points="120,44 123,52 131,52 125,57 127,65 120,60 113,65 115,57 109,52 117,52"
                strokeWidth="0.75"
                fill="currentColor"
                fillOpacity="0.3"
                className="opacity-85"
              />
            </svg>

            {/* High-Fidelity Official West MUN Seal Centerpiece */}
            <div
              className={`absolute w-32 h-32 rounded-full overflow-hidden transition-opacity duration-1000 ${
                stage === 'scene3_still' || stage === 'scene4_dissolve'
                  ? 'opacity-85'
                  : 'opacity-40'
              }`}
            >
              <img
                src={emblemImage}
                alt="West MUN Seal"
                className="w-full h-full object-cover filter contrast-125 brightness-90 grayscale-[0.2]"
              />
            </div>

            {/* Scene 3: Warm Light Slowly Sweeps Across the Finished Logo */}
            {stage === 'scene3_still' && (
              <div
                className="absolute inset-0 pointer-events-none rounded-full overflow-hidden"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 20%, rgba(255, 248, 220, 0.4) 48%, rgba(212, 175, 55, 0.6) 52%, transparent 75%)',
                  animation: 'warmLightSweep 1.6s ease-in-out forwards',
                }}
              />
            )}
          </div>

          {/* Scene 3: The words "WEST MUN" fade in underneath using Cinzel */}
          <div
            className={`mt-6 text-center transition-opacity duration-1000 ${
              stage === 'scene3_still' || stage === 'scene4_dissolve'
                ? 'opacity-100'
                : 'opacity-0'
            }`}
          >
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-[0.3em] text-[#B08D57] uppercase font-serif"
              style={{
                fontFamily: "'Cinzel', serif",
                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              }}
            >
              WEST MUN
            </h1>
            <div
              className="text-[10px] sm:text-[11px] tracking-[0.4em] text-[#F5F2EA]/70 uppercase font-serif mt-2"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Executive Delegation Portal
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for pristine craftsmanship animations */}
      <style>{`
        @keyframes goldenLineDraw {
          0% {
            width: 0%;
            margin-left: 50%;
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            width: 100%;
            margin-left: 0%;
            opacity: 0.9;
          }
        }

        @keyframes engravePath {
          0% {
            stroke-dasharray: 600;
            stroke-dashoffset: 600;
            opacity: 0.2;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0.85;
          }
        }

        @keyframes warmLightSweep {
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
