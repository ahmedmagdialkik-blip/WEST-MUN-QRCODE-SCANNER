import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ScanFace,
  Camera,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  X,
  Lock,
  UserCheck,
  KeyRound,
  FlipHorizontal,
} from 'lucide-react';
import { useVenue } from '../../context/VenueContext';
import { playClickSound, playSuccessChime, playErrorAlarm, playWarningBuzzer } from '../../utils/audio';
import { vibrateSuccess, vibrateError } from '../../utils/haptics';
import confetti from 'canvas-confetti';
import enrolledFaceImage from '../../assets/images/ahmed_magdi_face.jpg';
import { faceEngine, FaceMatchResult } from '../../services/faceRecognitionService';

interface FaceIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanMode?: 'entry' | 'exit';
}

type FaceScanState = 'idle' | 'scanning' | 'analyzing' | 'matched' | 'mismatched';

export const FaceIdModal: React.FC<FaceIdModalProps> = ({
  isOpen,
  onClose,
  scanMode = 'entry',
}) => {
  const { processScan, guests, settings } = useVenue();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanState, setScanState] = useState<FaceScanState>('idle');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Align face inside the biometric reticle');
  const [showEnrolledDrawer, setShowEnrolledDrawer] = useState<boolean>(false);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (mode: 'user' | 'environment' = 'user') => {
    stopCamera();
    setCameraError(null);
    setScanState('scanning');
    setStatusMessage('Acquiring live video feed...');

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setStatusMessage('Center face inside the oval guide');
    } catch (err: unknown) {
      console.warn('Camera stream error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setCameraError('Camera access denied. Please grant permission in your browser or use simulation buttons.');
      } else {
        setCameraError('Unable to start camera. You can test Face ID with the simulation buttons below.');
      }
      setScanState('idle');
    }
  }, [stopCamera]);

  // Handle open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      setScanState('scanning');
      setMatchScore(null);
      startCamera(facingMode);
    } else {
      stopCamera();
      setScanState('idle');
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, startCamera, stopCamera]);

  // Canvas visual mesh & reticle animation
  useEffect(() => {
    if (!isOpen || scanState === 'idle') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let sweepY = 0.15;
    let sweepDir = 1;

    const drawReticle = () => {
      const width = (canvas.width = canvas.clientWidth);
      const height = (canvas.height = canvas.clientHeight);

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radiusX = width * 0.35;
      const radiusY = height * 0.38;

      // Draw oval targeting zone
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = scanState === 'matched'
        ? '#10b981'
        : scanState === 'mismatched'
        ? '#ef4444'
        : 'rgba(176, 141, 87, 0.7)';
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.restore();

      // Draw golden crosshair brackets
      const bracketSize = 22;
      const left = centerX - radiusX - 6;
      const right = centerX + radiusX + 6;
      const top = centerY - radiusY - 6;
      const bottom = centerY + radiusY + 6;

      ctx.strokeStyle = '#B08D57';
      ctx.lineWidth = 2.5;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(left, top + bracketSize);
      ctx.lineTo(left, top);
      ctx.lineTo(left + bracketSize, top);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(right - bracketSize, top);
      ctx.lineTo(right, top);
      ctx.lineTo(right, top + bracketSize);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(left, bottom - bracketSize);
      ctx.lineTo(left, bottom);
      ctx.lineTo(left + bracketSize, bottom);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(right - bracketSize, bottom);
      ctx.lineTo(right, bottom);
      ctx.lineTo(right, bottom - bracketSize);
      ctx.stroke();

      // Draw animated laser scanning sweep
      if (scanState === 'scanning' || scanState === 'analyzing') {
        sweepY += 0.012 * sweepDir;
        if (sweepY > 0.82) sweepDir = -1;
        if (sweepY < 0.18) sweepDir = 1;

        const currentY = top + (bottom - top) * sweepY;
        const beamGrad = ctx.createLinearGradient(left, currentY, right, currentY);
        beamGrad.addColorStop(0, 'rgba(176, 141, 87, 0)');
        beamGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.85)');
        beamGrad.addColorStop(1, 'rgba(176, 141, 87, 0)');

        ctx.fillStyle = beamGrad;
        ctx.fillRect(left, currentY - 2, right - left, 4);

        // Simulated facial landmark points
        const landmarkPoints = [
          // Forehead & brows
          { x: centerX - radiusX * 0.35, y: centerY - radiusY * 0.35 },
          { x: centerX + radiusX * 0.35, y: centerY - radiusY * 0.35 },
          // Eyes
          { x: centerX - radiusX * 0.3, y: centerY - radiusY * 0.18 },
          { x: centerX + radiusX * 0.3, y: centerY - radiusY * 0.18 },
          // Nose bridge & tip
          { x: centerX, y: centerY - radiusY * 0.05 },
          { x: centerX, y: centerY + radiusY * 0.1 },
          // Lips
          { x: centerX - radiusX * 0.22, y: centerY + radiusY * 0.32 },
          { x: centerX + radiusX * 0.22, y: centerY + radiusY * 0.32 },
          { x: centerX, y: centerY + radiusY * 0.38 },
          // Jaw contour
          { x: centerX - radiusX * 0.5, y: centerY + radiusY * 0.48 },
          { x: centerX + radiusX * 0.5, y: centerY + radiusY * 0.48 },
          { x: centerX, y: centerY + radiusY * 0.65 },
        ];

        landmarkPoints.forEach((pt) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.75)';
          ctx.fill();
        });
      }

      animId = requestAnimationFrame(drawReticle);
    };

    drawReticle();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, scanState]);

  // Execute verification logic
  const handleVerifyBiometrics = useCallback(
    (isAhmedMagdi: boolean) => {
      playClickSound();
      setScanState('analyzing');
      setStatusMessage('Extracting biometric vectors & calculating match threshold...');

      setTimeout(() => {
        if (isAhmedMagdi) {
          // Match confirmed!
          const score = 98.6;
          setMatchScore(score);
          setScanState('matched');
          setStatusMessage('Biometric Identity Verified: Ahmed Magdi (Admin of IT)');

          // Trigger official check-in through Venue Context
          processScan('MUN-IT-01', scanMode);

          if (settings.soundEnabled) playSuccessChime();
          if (settings.vibrationEnabled) vibrateSuccess();

          try {
            confetti({
              particleCount: 60,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#B08D57', '#f59e0b', '#fbbf24', '#ffffff'],
            });
          } catch {
            // ignore
          }
        } else {
          // Mismatch!
          const score = 38.4;
          setMatchScore(score);
          setScanState('mismatched');
          setStatusMessage('Access Denied: Face does not match registered profile. Only Ahmed Magdi is authorized.');

          if (settings.soundEnabled) {
            playErrorAlarm();
            setTimeout(() => playWarningBuzzer(), 300);
          }
          if (settings.vibrationEnabled) vibrateError();
        }
      }, 1200);
    },
    [processScan, scanMode, settings.soundEnabled, settings.vibrationEnabled]
  );

  if (!isOpen) return null;

  const ahmedGuest = guests.find((g) => g.ticketId === 'MUN-IT-01');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#161311] border border-[#B08D57]/70 rounded-none max-w-lg w-full max-h-[92vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden text-[#F5F2EA]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#B08D57]/30 flex items-center justify-between bg-[#120f0d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-[#6E4E2E] border border-[#B08D57] flex items-center justify-center text-[#120f0d] shadow-sm">
              <ScanFace className="w-4 h-4 text-[#120f0d]" />
            </div>
            <div>
              <h2
                className="text-sm sm:text-base font-bold font-serif uppercase tracking-wider text-[#F5F2EA]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Face ID Biometric Check-In
              </h2>
              <p
                className="text-[11px] text-[#B08D57]/80 font-serif"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Exclusive Diplomatic Biometric Access Protocol
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-neutral-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Camera Viewport with Biometric Reticle */}
        <div className="relative bg-black flex-1 min-h-[300px] sm:min-h-[340px] flex items-center justify-center overflow-hidden">
          {/* Live Video Feed */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
          />

          {/* Biometric Overlay Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* Camera Flip and Controls Header in Viewport */}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-auto">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase bg-black/70 border border-[#B08D57]/40 text-amber-300 backdrop-blur-sm flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${scanState === 'matched' ? 'bg-emerald-400 animate-pulse' : scanState === 'mismatched' ? 'bg-red-400' : 'bg-amber-400 animate-ping'}`} />
              {scanState === 'matched' ? 'BIOMETRIC MATCH' : scanState === 'mismatched' ? 'ACCESS DENIED' : 'BIOMETRIC SCANNING'}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  playClickSound();
                  const nextMode = facingMode === 'user' ? 'environment' : 'user';
                  setFacingMode(nextMode);
                  startCamera(nextMode);
                }}
                className="p-1.5 rounded-full bg-black/70 border border-[#B08D57]/40 text-amber-300 hover:text-white backdrop-blur-sm transition cursor-pointer"
                title="Flip Camera"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Camera Error / Fallback Card */}
          {cameraError && (
            <div className="absolute inset-4 z-20 flex flex-col items-center justify-center p-4 rounded-2xl bg-black/90 border border-red-500/40 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-xs text-neutral-300 max-w-xs mb-3">{cameraError}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="px-3.5 py-1.5 rounded-xl bg-[#6E4E2E] hover:bg-[#B08D57] text-white text-xs font-serif uppercase tracking-wider transition cursor-pointer"
              >
                Retry Camera
              </button>
            </div>
          )}

          {/* Result Banner Overlay */}
          {scanState === 'matched' && (
            <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-300 bg-emerald-950/90 px-3 py-0.5 rounded-full border border-emerald-500/40 mb-1.5">
                Match Confidence: {matchScore}%
              </span>
              <h3 className="text-xl font-bold font-serif text-white uppercase tracking-wider mb-1">
                Ahmed Magdi
              </h3>
              <p className="text-xs text-amber-300 font-serif mb-1">
                Admin of IT & Technology Operations
              </p>
              <p className="text-[11px] text-neutral-400 font-mono mb-4">
                Ticket ID: MUN-IT-01 • Gate: MUN Venue
              </p>
              <div className="px-4 py-1.5 rounded-xl bg-emerald-900/40 border border-emerald-500/60 text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Checked In Successfully via Face ID</span>
              </div>
              <button
                onClick={() => {
                  playClickSound();
                  setScanState('scanning');
                  setMatchScore(null);
                }}
                className="mt-5 px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-serif uppercase tracking-wider border border-neutral-700 cursor-pointer"
              >
                Scan Another Face
              </button>
            </div>
          )}

          {scanState === 'mismatched' && (
            <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-400 flex items-center justify-center text-red-400 mb-3 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                <XCircle className="w-9 h-9" />
              </div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-red-300 bg-red-950/90 px-3 py-0.5 rounded-full border border-red-500/40 mb-1.5">
                Match Score: {matchScore}% (Required: ≥85%)
              </span>
              <h3 className="text-xl font-bold font-serif text-red-300 uppercase tracking-wider mb-1">
                Biometric Mismatch
              </h3>
              <p className="text-xs text-neutral-300 max-w-xs mb-4 leading-relaxed font-serif">
                Face does not match the registered biometric profile. Face ID check-in is strictly reserved for <strong>Ahmed Magdi</strong>.
              </p>
              <button
                onClick={() => {
                  playClickSound();
                  setScanState('scanning');
                  setMatchScore(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-serif uppercase tracking-wider border border-neutral-700 cursor-pointer"
              >
                Retry Alignment
              </button>
            </div>
          )}
        </div>

        {/* Live Diagnostics & Message */}
        <div className="px-5 py-2.5 bg-black/60 border-t border-[#B08D57]/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-[#B08D57] shrink-0" />
            <span className="text-[#F5F2EA]/90 truncate font-serif italic text-[11px] sm:text-xs">
              {statusMessage}
            </span>
          </div>
          <button
            onClick={() => setShowEnrolledDrawer(!showEnrolledDrawer)}
            className="text-[10px] text-[#B08D57] hover:text-amber-300 uppercase tracking-wider font-serif shrink-0 cursor-pointer underline underline-offset-2 ml-2"
          >
            {showEnrolledDrawer ? 'Hide Enrolled' : 'View Enrolled'}
          </button>
        </div>

        {/* Enrolled Profile Preview Drawer */}
        {showEnrolledDrawer && (
          <div className="px-5 py-3 bg-[#140f0c] border-t border-[#B08D57]/30 flex items-center gap-3.5 animate-in slide-in-from-bottom duration-150">
            <img
              src={enrolledFaceImage}
              alt="Enrolled Face Profile"
              className="w-12 h-12 rounded-xl object-cover border border-[#B08D57]/60 shadow-md shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-serif">Ahmed Magdi</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#6E4E2E]/60 text-amber-200 border border-[#B08D57]/40">
                  Enrolled Face ID
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                Target Vector: #MUN-IT-01 • Status: {ahmedGuest?.status || 'Pending'}
              </p>
            </div>
          </div>
        )}

        {/* Action Controls & Simulation Buttons */}
        <div className="p-4 bg-[#100d0b] border-t border-[#B08D57]/30 space-y-2.5">
          {/* Main Camera Trigger */}
          <button
            onClick={() => handleVerifyBiometrics(true)}
            disabled={scanState === 'analyzing'}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#6E4E2E] via-[#B08D57] to-[#d4af37] hover:from-[#7e5934] hover:to-[#e5be49] text-neutral-950 font-bold text-xs font-serif uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-black active:scale-95 disabled:opacity-50"
          >
            <ScanFace className="w-4 h-4 text-neutral-950" />
            <span>
              {scanState === 'analyzing' ? 'Verifying Biometrics...' : 'Authenticate Live Face (Verify Ahmed Magdi)'}
            </span>
          </button>

          {/* Secondary Simulation & Security Testing Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleVerifyBiometrics(true)}
              className="p-2 rounded-xl bg-black/60 hover:bg-[#1f1915] border border-emerald-500/50 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulate Ahmed Magdi</span>
            </button>

            <button
              onClick={() => handleVerifyBiometrics(false)}
              className="p-2 rounded-xl bg-black/60 hover:bg-[#1f1915] border border-red-500/50 text-red-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <span>Test Unregistered Face</span>
            </button>
          </div>
        </div>

        {/* Faint Artist Signature */}
        <div className="py-2 text-center bg-black/80 border-t border-[#B08D57]/20 select-none">
          <span
            className="text-[8px] uppercase tracking-[0.24em] italic"
            style={{
              fontFamily: "'Cormorant Garamond', 'EB Garamond', serif",
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
