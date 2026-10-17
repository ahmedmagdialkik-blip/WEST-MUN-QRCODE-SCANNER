/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Official FaceAPI Facial Recognition Authentication Screen
 * Repository: https://github.com/vladmandic/face-api
 *
 * Authentication Flow:
 * Website Opens -> Load FaceAPI Models -> Request Camera Permission ->
 * Start Live Webcam -> Continuously Detect Faces (30 FPS) ->
 * Generate Face Descriptor -> Compare Against Enrolled Users ->
 * If Match Found -> Authenticate Session -> Play Welcome Voice ->
 * Show Intro Animation -> Homepage.
 * If no match is found: Remain on authentication screen.
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  ScanFace,
  ShieldCheck,
  AlertTriangle,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  FlipHorizontal,
  UserPlus,
  Camera,
  RefreshCw,
} from 'lucide-react';
import officialLogoImage from '../../assets/images/west_mun_logo_official.jpg';
import { useFaceRecognition } from '../../hooks/useFaceRecognition';
import { EnrolledUser } from '../../auth/types';
import { EnrollmentModal } from './EnrollmentModal';
import { playClickSound, playSuccessChime } from '../../utils/audio';
import { vibrateSuccess } from '../../utils/haptics';

interface FaceRecognitionAuthScreenProps {
  onAuthenticated: (user: EnrolledUser) => void;
}

export const FaceRecognitionAuthScreen: React.FC<FaceRecognitionAuthScreenProps> = ({
  onAuthenticated,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);

  // Official FaceAPI recognition hook running at ~30 FPS
  const { state, facingMode, cameraError, flipCamera, startWebcam } = useFaceRecognition({
    videoRef,
    canvasRef,
    enabled: true,
    onMatchFound: (user) => {
      playSuccessChime();
      vibrateSuccess();

      // Proceed to the Welcome Voice & Intro flow after showing matched recognition
      setTimeout(() => {
        onAuthenticated(user);
      }, 900);
    },
  });

  // Real-time Canvas HUD: Draws actual FaceAPI bounding box, 68 facial landmarks, and telemetry
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderOverlay = () => {
      const width = (canvas.width = video.clientWidth || canvas.clientWidth);
      const height = (canvas.height = video.clientHeight || canvas.clientHeight);

      ctx.clearRect(0, 0, width, height);

      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;

      const scaleX = width / videoWidth;
      const scaleY = height / videoHeight;

      // 1. Draw live FaceAPI 68-point biometric landmarks if detected
      if (state.landmarks && state.landmarks.length === 68) {
        ctx.save();
        for (const pt of state.landmarks) {
          const px = pt.x * scaleX;
          const py = pt.y * scaleY;

          ctx.beginPath();
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fillStyle =
            state.status === 'matched'
              ? '#10b981'
              : state.status === 'user_not_recognized'
              ? '#ef4444'
              : '#E5C578';
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Draw live FaceAPI Bounding Box if detected
      if (state.box) {
        const bx = state.box.x * scaleX;
        const by = state.box.y * scaleY;
        const bw = state.box.width * scaleX;
        const bh = state.box.height * scaleY;

        ctx.save();
        ctx.strokeStyle =
          state.status === 'matched'
            ? '#10b981'
            : state.status === 'user_not_recognized'
            ? '#ef4444'
            : '#B08D57';
        ctx.lineWidth = 2.5;

        // Corner bracket style
        const cLen = Math.min(24, bw * 0.25);
        // Top-left
        ctx.beginPath();
        ctx.moveTo(bx, by + cLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cLen, by);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + cLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(bx, by + bh - cLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + cLen, by + bh);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - cLen);
        ctx.stroke();

        // Status badge above face box
        ctx.fillStyle =
          state.status === 'matched'
            ? 'rgba(6, 78, 59, 0.9)'
            : state.status === 'user_not_recognized'
            ? 'rgba(127, 29, 29, 0.9)'
            : 'rgba(26, 21, 18, 0.9)';
        ctx.fillRect(bx, by - 24, Math.max(bw, 140), 22);

        ctx.font = '10px monospace';
        ctx.fillStyle = '#F5F2EA';
        const labelText =
          state.status === 'matched' && state.recognizedUser
            ? `ID: ${state.recognizedUser.fullName} (${state.confidence}%)`
            : state.status === 'user_not_recognized'
            ? `UNKNOWN (${state.confidence}%)`
            : `FACE DETECTED`;
        ctx.fillText(labelText, bx + 6, by - 9);

        ctx.restore();
      }

      // 3. Central targeting reticle if waiting for face
      if (state.status === 'waiting_for_face') {
        const cx = width / 2;
        const cy = height / 2;
        const rx = width * 0.28;
        const ry = height * 0.35;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(176, 141, 87, 0.4)';
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(renderOverlay);
    };

    renderOverlay();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state.box, state.landmarks, state.status, state.recognizedUser, state.confidence]);

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#F5F2EA] flex flex-col justify-between selection:bg-[#B08D57]/30 selection:text-[#E5C578] relative overflow-x-hidden font-sans">
      {/* Background illumination */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(176, 141, 87, 0.12) 0%, transparent 65%),
            radial-gradient(circle at 20% 50%, rgba(110, 78, 46, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(110, 78, 46, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 50% 100%, rgba(10, 9, 8, 0.95) 0%, transparent 80%)
          `,
        }}
      />

      {/* Diplomatic Header */}
      <header className="relative z-10 w-full border-b border-[#B08D57]/20 bg-[#0C0B0A]/85 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#B08D57]/60 p-0.5 overflow-hidden shadow-sm">
              <img
                src={officialLogoImage}
                alt="West MUN Official Seal"
                className="w-full h-full object-cover filter contrast-110"
              />
            </div>
            <div>
              <span
                className="text-xs font-bold tracking-[0.25em] text-[#F5F2EA] uppercase block font-serif"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                WEST MUN
              </span>
              <span
                className="text-[9px] tracking-[0.22em] text-[#B08D57] uppercase font-serif"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Biometric Facial Recognition Authentication
              </span>
            </div>
          </div>

          {/* Biometric Enrollment Action */}
          <button
            onClick={() => {
              playClickSound();
              setIsEnrollmentOpen(true);
            }}
            className="px-3 py-1.5 rounded-xs bg-[#1A1410] hover:bg-[#251D17] border border-[#B08D57]/40 text-[#E5C578] text-[10px] uppercase tracking-wider font-serif transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            style={{ fontFamily: "'Cinzel', serif" }}
            title="Enroll reference image and compute descriptor"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>Enroll Reference Photo</span>
          </button>
        </div>
      </header>

      {/* Main Authentication Flow Container */}
      <main className="relative z-10 flex-1 w-full max-w-lg mx-auto px-4 py-6 flex flex-col items-center justify-center">
        {/* Emblem & Portal Inscription */}
        <div className="text-center mb-5 animate-in fade-in duration-500">
          <div className="relative inline-flex items-center justify-center mb-3">
            <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-b from-[#E5C578] via-[#B08D57] to-[#6E4E2E] shadow-[0_0_30px_rgba(176,141,87,0.22)]">
              <div className="w-full h-full rounded-full bg-[#120F0D] p-1 flex items-center justify-center overflow-hidden border border-[#B08D57]/40">
                <img
                  src={officialLogoImage}
                  alt="West MUN Emblem"
                  className="w-full h-full rounded-full object-cover filter contrast-110"
                />
              </div>
            </div>
          </div>

          <h1
            className="text-xl sm:text-2xl font-bold tracking-[0.2em] text-[#F5F2EA] uppercase mb-1"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Facial Recognition Authentication
          </h1>
          <p
            className="text-[11px] tracking-[0.25em] text-[#B08D57] uppercase font-serif"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Official FaceAPI Pipeline • Continuous 30 FPS Verification
          </p>
        </div>

        {/* Live Camera Viewport with FaceAPI Detection */}
        <div className="w-full bg-[#100D0B] border border-[#B08D57]/50 rounded-xs overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.9)] flex flex-col">
          {/* Video & Canvas Viewport */}
          <div className="relative w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />

            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* Top Viewport Telemetry Bar */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-auto">
              <span className="px-2.5 py-1 rounded-xs text-[10px] font-mono uppercase bg-black/80 border border-[#B08D57]/50 text-[#E5C578] backdrop-blur-sm flex items-center gap-1.5 shadow-md">
                <span
                  className={`w-2 h-2 rounded-full ${
                    state.status === 'matched'
                      ? 'bg-emerald-400 animate-pulse'
                      : state.status === 'user_not_recognized'
                      ? 'bg-red-400'
                      : state.status === 'multiple_faces'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400 animate-ping'
                  }`}
                />
                <span>
                  {state.status === 'matched'
                    ? 'VERIFIED'
                    : state.status === 'user_not_recognized'
                    ? 'UNRECOGNIZED'
                    : state.status === 'multiple_faces'
                    ? 'MULTIPLE FACES'
                    : 'SCANNING 30 FPS'}
                </span>
              </span>

              <button
                type="button"
                onClick={flipCamera}
                className="p-1.5 rounded-xs bg-black/80 border border-[#B08D57]/50 text-[#E5C578] hover:text-white backdrop-blur-sm transition cursor-pointer"
                title="Flip camera"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Camera Access Warning */}
            {cameraError && (
              <div className="absolute inset-4 z-30 flex flex-col items-center justify-center p-4 rounded-xs bg-black/95 border border-amber-500/50 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                <p className="text-xs text-neutral-300 max-w-xs mb-3 font-serif leading-relaxed">
                  {cameraError}
                </p>
                <button
                  onClick={() => startWebcam(facingMode)}
                  className="px-4 py-1.5 rounded-xs bg-[#6E4E2E] hover:bg-[#B08D57] text-white text-xs font-serif uppercase tracking-wider transition cursor-pointer border border-[#E5C578]"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {/* Recognition Outcome: Welcome Back overlay */}
            {state.status === 'matched' && state.recognizedUser && (
              <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-300 bg-emerald-950/90 px-3 py-0.5 rounded-xs border border-emerald-500/40 mb-1.5">
                  Confidence: {state.confidence}%
                </span>
                <h3
                  className="text-xl sm:text-2xl font-bold font-serif text-[#F5F2EA] uppercase tracking-wider mb-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Welcome back,
                  <br />
                  <span className="text-[#E5C578]">{state.recognizedUser.fullName}</span>
                </h3>
                <p className="text-xs text-[#CFC7B4] font-serif mb-2">
                  Session Authenticated via FaceAPI Descriptor Match
                </p>
                <div className="px-3.5 py-1 rounded-xs bg-emerald-900/40 border border-emerald-500/60 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 font-serif">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Loading Voice Welcome & Executive Portal...</span>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Recognition Status & Messages */}
          <div className="px-4 py-3 bg-[#0E0C0A] border-t border-[#B08D57]/30">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] uppercase tracking-widest text-[#B08D57] font-serif font-bold"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Recognition Pipeline
              </span>
              <span className="text-[10px] font-mono text-[#E5C578]">
                {state.confidence > 0 ? `Confidence: ${state.confidence}%` : 'FaceAPI 30 FPS'}
              </span>
            </div>

            {/* Exact Required Status Message Box */}
            <div
              className={`p-3 rounded-xs border text-xs font-serif leading-relaxed flex items-center gap-2.5 transition-colors duration-200 ${
                state.status === 'matched'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : state.status === 'user_not_recognized'
                  ? 'bg-red-950/60 border-red-500/50 text-red-200'
                  : state.status === 'multiple_faces'
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                  : state.status === 'waiting_for_face'
                  ? 'bg-[#181310] border-[#B08D57]/40 text-[#E5C578]'
                  : 'bg-[#14100D] border-[#B08D57]/20 text-[#CFC7B4]'
              }`}
            >
              {state.status === 'matched' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {state.status === 'user_not_recognized' && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
              {state.status === 'multiple_faces' && <Users className="w-4 h-4 text-amber-400 shrink-0" />}
              {state.status === 'waiting_for_face' && <Eye className="w-4 h-4 text-[#E5C578] shrink-0" />}
              {state.status === 'loading_models' && <RefreshCw className="w-4 h-4 text-[#B08D57] animate-spin shrink-0" />}
              {state.status === 'requesting_camera' && <Camera className="w-4 h-4 text-[#B08D57] animate-pulse shrink-0" />}

              <div className="min-w-0">
                <span className="font-semibold block">{state.message}</span>
                {state.status === 'user_not_recognized' && (
                  <span className="text-[10px] text-red-300/80 block mt-0.5">
                    Live face does not match any enrolled reference descriptor. Authentication denied.
                  </span>
                )}
                {state.status === 'waiting_for_face' && (
                  <span className="text-[10px] text-[#B08D57] block mt-0.5">
                    Position your face within the camera frame for continuous biometric verification.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Clear Instructions */}
        <div className="w-full mt-3 p-3 rounded-xs bg-[#120F0D]/70 border border-[#B08D57]/20 text-center">
          <p className="text-[11px] text-[#A89F91] font-serif leading-relaxed">
            The webcam continuously scans at 30 FPS. Only real enrolled faces authenticated by FaceAPI are granted entry.
          </p>
        </div>
      </main>

      {/* Diplomatic Footer */}
      <footer className="relative z-10 w-full border-t border-[#B08D57]/20 bg-[#0C0B0A]/85 backdrop-blur-md px-4 py-3 text-center">
        <p
          className="text-[10px] uppercase tracking-[0.25em] text-[#B08D57]/70 font-serif"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Western Model United Nations • FaceAPI Neural Pipeline
        </p>
      </footer>

      {/* Enrollment Modal for Adding New Biometric Reference Images */}
      <EnrollmentModal
        isOpen={isEnrollmentOpen}
        onClose={() => setIsEnrollmentOpen(false)}
      />
    </div>
  );
};
