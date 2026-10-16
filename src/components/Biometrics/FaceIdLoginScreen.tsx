import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Shield, Lock, Sparkles } from 'lucide-react';
import { playSuccessChime } from '../../utils/audio';
import { vibrateSuccess } from '../../utils/haptics';
import enrolledFaceImage from '../../assets/images/ahmed_magdi_face.jpg';

interface FaceIdLoginScreenProps {
  onSuccess: () => void;
  onManualLogin?: () => void;
}

type ScanStatus = 'scanning' | 'analyzing' | 'verified';

export const FaceIdLoginScreen: React.FC<FaceIdLoginScreenProps> = ({
  onSuccess,
  onManualLogin,
}) => {
  const [status, setStatus] = useState<ScanStatus>('scanning');
  const [statusText, setStatusText] = useState('Acquiring Biometric Telemetry...');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Scan progress sequence (1.5 - 2.0 seconds total)
  useEffect(() => {
    // Stage 1: Scanning facial vectors (0.0s - 1.0s)
    const t1 = setTimeout(() => {
      setStatus('analyzing');
      setStatusText('Analyzing Facial Geometry & Vector Mesh...');
    }, 900);

    // Stage 2: Verified with checkmark (1.8s)
    const t2 = setTimeout(() => {
      setStatus('verified');
      setStatusText('Identity Verified • Executive Clearance Level 1');
      playSuccessChime();
      vibrateSuccess();
    }, 1850);

    // Stage 3: Smooth automatic transition to homepage (2.7s)
    const t3 = setTimeout(() => {
      onSuccess();
    }, 2850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onSuccess]);

  // Canvas visual biometric grid overlay and telemetry dots
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let scanLineY = 0.15;
    let scanDir = 1;

    const render = () => {
      const width = (canvas.width = canvas.clientWidth);
      const height = (canvas.height = canvas.clientHeight);

      ctx.clearRect(0, 0, width, height);

      if (status !== 'verified') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = width * 0.44;

        // Subtle biometric grid dots
        ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
        const cols = 7;
        const rows = 8;
        const stepX = (radius * 1.6) / cols;
        const stepY = (radius * 1.7) / rows;
        const startX = centerX - radius * 0.8;
        const startY = centerY - radius * 0.85;

        for (let r = 0; r <= rows; r++) {
          for (let c = 0; c <= cols; c++) {
            const px = startX + c * stepX;
            const py = startY + r * stepY;
            const dist = Math.hypot(px - centerX, py - centerY);
            if (dist < radius * 0.88) {
              ctx.beginPath();
              ctx.arc(px, py, 1.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Soft moving scan line (blue/white laser beam)
        scanLineY += 0.016 * scanDir;
        if (scanLineY > 0.88) scanDir = -1;
        if (scanLineY < 0.12) scanDir = 1;

        const currentY = centerY - radius + radius * 2 * scanLineY;
        const chordHalfWidth = Math.sqrt(Math.max(0, radius * radius - Math.pow(currentY - centerY, 2)));

        if (chordHalfWidth > 10) {
          const grad = ctx.createLinearGradient(
            centerX - chordHalfWidth,
            currentY,
            centerX + chordHalfWidth,
            currentY
          );
          grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
          grad.addColorStop(0.3, 'rgba(186, 230, 253, 0.7)');
          grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
          grad.addColorStop(0.7, 'rgba(186, 230, 253, 0.7)');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

          ctx.fillStyle = grad;
          ctx.fillRect(centerX - chordHalfWidth, currentY - 1.5, chordHalfWidth * 2, 3);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [status]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0a09] text-[#F5F2EA] flex flex-col items-center justify-between p-6 sm:p-8 select-none overflow-hidden">
      {/* Background Subtle Watermark & Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(176, 141, 87, 0.18) 0%, rgba(110, 78, 46, 0.06) 50%, transparent 80%)',
        }}
      />

      {/* Diplomatic Institution Top Header */}
      <div className="w-full max-w-sm flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#B08D57]" />
          <span
            className="text-[11px] uppercase tracking-[0.22em] text-[#B08D57]/90 font-display"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Diplomatic Security Clearance
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
          <Lock className="w-3 h-3 text-[#B08D57]/70" />
          <span>PORTAL SECURE</span>
        </div>
      </div>

      {/* Central Face ID Scanner Container */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm z-10 py-6">
        {/* The Modern Circular Biometric Scanner */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center mb-7">
          
          {/* Outer Pulsing Glow */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-700 blur-lg ${
              status === 'verified'
                ? 'bg-emerald-500/25 scale-105'
                : 'bg-sky-500/15 scale-100'
            }`}
          />

          {/* Rotating Blue/White Circular Scanning Light Arc */}
          <div
            className={`absolute -inset-2 rounded-full border border-sky-400/30 transition-opacity duration-500 ${
              status === 'verified' ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              animation: 'spin 3s linear infinite',
              background:
                'conic-gradient(from 0deg, transparent 65%, rgba(125, 211, 252, 0.3) 80%, rgba(255, 255, 255, 0.85) 96%, transparent 100%)',
              maskImage: 'radial-gradient(circle, transparent 67%, black 69%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 67%, black 69%)',
            }}
          />

          {/* Thin Engraved Antique Gold Bezel */}
          <div
            className={`absolute -inset-1 rounded-full border transition-all duration-500 ${
              status === 'verified'
                ? 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                : 'border-[#B08D57]/60 shadow-[0_0_20px_rgba(176,141,87,0.2)]'
            }`}
          />

          {/* Circular Face Portrait Window */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-2 border-neutral-800 bg-black flex items-center justify-center">
            {/* The Registered User Image: Ahmed Magdi */}
            <img
              src={enrolledFaceImage}
              alt="Ahmed Magdi"
              className={`w-full h-full object-cover transition-all duration-500 ${
                status === 'verified' ? 'brightness-105 scale-100' : 'brightness-95 contrast-105 scale-102'
              }`}
            />

            {/* Canvas Biometric Reticle & Scan Lines Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none z-10"
            />

            {/* Corner Target Markers */}
            <div className="absolute inset-4 pointer-events-none z-15 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-3.5 h-3.5 border-t-2 border-l-2 border-sky-400/70" />
                <div className="w-3.5 h-3.5 border-t-2 border-r-2 border-sky-400/70" />
              </div>
              <div className="flex justify-between">
                <div className="w-3.5 h-3.5 border-b-2 border-l-2 border-sky-400/70" />
                <div className="w-3.5 h-3.5 border-b-2 border-r-2 border-sky-400/70" />
              </div>
            </div>

            {/* Green Verification Overlay Checkmark */}
            {status === 'verified' && (
              <div className="absolute inset-0 z-20 bg-emerald-950/45 backdrop-blur-[1.5px] flex flex-col items-center justify-center animate-in zoom-in-75 duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.7)]">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.4]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Identity Details as Requested */}
        <div className="text-center px-4">
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-[0.08em] text-[#F5F2EA] mb-1"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Ahmed Magdi
          </h1>
          <p
            className="text-xs sm:text-sm font-semibold tracking-[0.24em] uppercase text-[#B08D57]"
            style={{ fontFamily: "'Cinzel', 'Marcellus', serif" }}
          >
            West MUN Executive Portal
          </p>

          {/* Diagnostic Status Indicator */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'verified'
                  ? 'bg-emerald-400 animate-none shadow-[0_0_8px_#34d399]'
                  : 'bg-sky-400 animate-ping'
              }`}
            />
            <span
              className={`text-xs tracking-wider transition-colors duration-300 ${
                status === 'verified'
                  ? 'text-emerald-400 font-bold'
                  : 'text-neutral-300 font-sans'
              }`}
            >
              {statusText}
            </span>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Controls & Signature */}
      <div className="w-full max-w-sm flex flex-col items-center gap-3 z-10 pb-2">
        {onManualLogin && (
          <button
            onClick={onManualLogin}
            className="text-[11px] text-neutral-400 hover:text-amber-300 font-serif tracking-wider underline underline-offset-4 transition cursor-pointer"
          >
            Alternative Staff / Delegate Login
          </button>
        )}

        {/* Subtle Artist Signature */}
        <div className="pt-2 select-none text-center">
          <span
            className="text-[9px] uppercase tracking-[0.28em] italic"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: '#B08D57',
              opacity: 0.18,
            }}
          >
            Developed by Ahmed Magdi
          </span>
        </div>
      </div>
    </div>
  );
};
