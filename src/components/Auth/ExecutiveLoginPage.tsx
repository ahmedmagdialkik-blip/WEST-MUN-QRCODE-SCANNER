import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  Sparkles,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { faceEngine, FaceMatchResult } from '../../services/faceRecognitionService';
import { playSuccessChime, playClickSound, playWarningBuzzer } from '../../utils/audio';
import { vibrateSuccess, vibrateWarning } from '../../utils/haptics';
import enrolledPhotoUrl from '../../assets/images/ahmed_magdi_face.jpg';
import officialLogoUrl from '../../assets/images/west_mun_logo_official.jpg';
import { useVenue } from '../../context/VenueContext';

interface ExecutiveLoginPageProps {
  onAuthenticated: () => void;
}

type FaceStatus =
  | 'loading_models'
  | 'camera_ready'
  | 'face_detected'
  | 'analyzing'
  | 'matching'
  | 'verified'
  | 'unrecognized'
  | 'camera_denied'
  | 'camera_error';

export const ExecutiveLoginPage: React.FC<ExecutiveLoginPageProps> = ({
  onAuthenticated,
}) => {
  const { isAuthenticated, currentUser, logout } = useVenue();

  const [faceStatus, setFaceStatus] = useState<FaceStatus>('loading_models');
  const [statusMessage, setStatusMessage] = useState<string>('Loading AI Models...');
  const [similarityScore, setSimilarityScore] = useState<number>(0);
  const [distanceScore, setDistanceScore] = useState<number | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Manual login fallback
  const [isManualLoginOpen, setIsManualLoginOpen] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [passcodeError, setPasscodeError] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const isVerifyingRef = useRef<boolean>(false);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Initialize Face-API Models and Enroll Reference Image
  useEffect(() => {
    let isMounted = true;

    async function initPipeline() {
      try {
        setFaceStatus('loading_models');
        setStatusMessage('Loading AI Models...');

        // Loads TinyFaceDetector, FaceLandmark68Net, and FaceRecognitionNet
        await faceEngine.initialize();

        if (!isMounted) return;

        setFaceStatus('camera_ready');
        setStatusMessage('Camera Ready - Starting Biometric Sensor...');

        // Automatically request webcam permission after models are initialized
        startWebcam();
      } catch (err) {
        if (!isMounted) return;
        console.error('Initialization error:', err);
        setFaceStatus('camera_error');
        setStatusMessage(
          'Model initialization failed. Please use manual authentication.'
        );
      }
    }

    initPipeline();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [stopCamera]);

  // Start Live Webcam
  const startWebcam = async () => {
    try {
      setCameraError(null);
      setStatusMessage('Requesting Webcam Permission...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        setFaceStatus('camera_ready');
        setStatusMessage('Camera Ready - Center face in view');
      }
    } catch (err: any) {
      console.warn('Webcam permission denied or unavailable:', err);
      setIsCameraActive(false);
      setFaceStatus('camera_denied');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera permission denied. Facial biometric recognition requires camera access. Please use manual credential login below.'
        );
        setStatusMessage('Camera Permission Denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError(
          'No camera device detected on this hardware. Please authenticate with manual login.'
        );
        setStatusMessage('No Camera Detected');
      } else {
        setCameraError(
          'Unable to access camera. Please proceed via manual credential login.'
        );
        setStatusMessage('Camera Unavailable');
      }
    }
  };

  // Continuous Live Facial Recognition Loop
  useEffect(() => {
    if (!isCameraActive || faceStatus === 'verified') return;

    let isScanning = true;
    let consecutiveMatches = 0;
    const REQUIRED_CONSECUTIVE_MATCHES = 2; // Require 2 consistent frame matches for anti-spoofing security

    const runDetection = async () => {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2 && !isVerifyingRef.current) {
        try {
          const result: FaceMatchResult | null = await faceEngine.verifyLiveFace(video);

          // Draw real-time landmarks on overlay canvas
          if (canvas) {
            canvas.width = video.videoWidth || video.clientWidth;
            canvas.height = video.videoHeight || video.clientHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              if (result && result.box) {
                const { x, y, width, height } = result.box;

                // Draw bounding box
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = result.isMatch
                  ? 'rgba(52, 211, 153, 0.9)' // Emerald if matched
                  : 'rgba(212, 175, 55, 0.7)'; // Antique gold if analyzing

                ctx.strokeRect(x, y, width, height);

                // Draw facial landmark points
                if (result.landmarks) {
                  const points = result.landmarks.positions;
                  ctx.fillStyle = result.isMatch
                    ? 'rgba(52, 211, 153, 0.85)'
                    : 'rgba(255, 248, 220, 0.75)';

                  points.forEach((pt) => {
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 1.4, 0, 2 * Math.PI);
                    ctx.fill();
                  });
                }
              }
            }
          }

          if (result) {
            setSimilarityScore(result.similarity);
            setDistanceScore(Number(result.distance.toFixed(3)));

            if (result.isMatch) {
              consecutiveMatches++;
              setFaceStatus('matching');
              setStatusMessage('Matching Identity...');

              // Verified when threshold passed consistently
              if (consecutiveMatches >= REQUIRED_CONSECUTIVE_MATCHES) {
                isVerifyingRef.current = true;
                setFaceStatus('verified');
                setStatusMessage('Identity Verified ✓');
                playSuccessChime();
                vibrateSuccess();

                setTimeout(() => {
                  setStatusMessage('Welcome Ahmed Magdi');
                }, 350);

                setTimeout(() => {
                  stopCamera();
                  onAuthenticated();
                }, 1200);

                return;
              }
            } else {
              consecutiveMatches = 0;
              setFaceStatus('unrecognized');
              setStatusMessage(
                `Face Detected (${result.similarity}%) - Unrecognized (Only Ahmed Magdi Authorized)`
              );
            }
          } else {
            consecutiveMatches = 0;
            setSimilarityScore(0);
            setDistanceScore(null);
            setFaceStatus('camera_ready');
            setStatusMessage('Face Detected? Center your face in camera frame');
          }
        } catch (err) {
          console.error('Detection frame error:', err);
        }
      }

      if (isScanning && !isVerifyingRef.current) {
        // Run at ~12 fps for smooth performance without heating CPU/GPU
        scanLoopRef.current = window.setTimeout(runDetection, 80);
      }
    };

    scanLoopRef.current = window.setTimeout(runDetection, 100);

    return () => {
      isScanning = false;
      if (scanLoopRef.current) {
        clearTimeout(scanLoopRef.current);
      }
    };
  }, [isCameraActive, faceStatus, onAuthenticated, stopCamera]);

  // Handle Manual Password Login
  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    const clean = passcode.trim();

    if (clean === '344' || clean === 'it6001') {
      playSuccessChime();
      vibrateSuccess();
      stopCamera();
      onAuthenticated();
    } else {
      playWarningBuzzer();
      vibrateWarning();
      setPasscodeError('Invalid confidential passcode. (Authorized pass: 344)');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-3 sm:p-4 overflow-x-hidden select-none bg-[#0e0c0a] text-[#F5F2EA]">
      {/* Background Subtle Moving Warm Light Gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 18%, rgba(176, 141, 87, 0.08) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(110, 78, 46, 0.05) 0%, transparent 50%),
            linear-gradient(to bottom, #0f0d0b 0%, #080706 100%)
          `,
        }}
      />

      {/* Medieval Arch Filigree Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#B08D57_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Centered Authentication Card */}
      <div className="relative z-10 w-full max-w-[440px] my-4">
        {/* Outer Engraved Metallic Border */}
        <div className="relative p-[1px] bg-gradient-to-b from-[#B08D57]/70 via-[#6E4E2E]/40 to-[#B08D57]/70 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
          {/* Inner Card */}
          <div className="relative bg-[#161311] px-5 py-6 sm:px-7 sm:py-8 text-center">
            {/* Medieval Corner Accents */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#B08D57]/80" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[#B08D57]/80" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[#B08D57]/80" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#B08D57]/80" />

            {/* Header: Official West MUN Logo & Title */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative mb-2">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-md border border-[#B08D57]/60 p-0.5 bg-[#120f0d] shadow-md flex items-center justify-center overflow-hidden">
                  <img
                    src={officialLogoUrl}
                    alt="West MUN Official Emblem"
                    className="w-full h-full object-cover filter contrast-125 brightness-100"
                  />
                </div>
              </div>

              <div
                className="text-[10px] tracking-[0.35em] uppercase text-[#B08D57] font-serif font-semibold"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Model United Nations
              </div>
              <h1
                className="text-lg sm:text-xl font-bold tracking-[0.2em] text-[#F5F2EA] uppercase font-serif mt-0.5"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Executive Portal
              </h1>

              {/* Thin Engraved Divider */}
              <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#B08D57]/60 to-transparent mt-2 mb-1" />
            </div>

            {/* User Enrolled Profile Identity */}
            <div className="flex items-center justify-center gap-3 p-2 rounded-sm bg-[#120e0c]/90 border border-[#B08D57]/30 mb-4">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border border-[#B08D57] shrink-0">
                <img
                  src={enrolledPhotoUrl}
                  alt="Ahmed Magdi"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left min-w-0">
                <div
                  className="text-xs sm:text-sm font-bold text-[#F5F2EA] truncate tracking-wide"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Ahmed Magdi
                </div>
                <div
                  className="text-[10px] text-[#B08D57] truncate font-serif"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Enrolled Reference • Head of IT & Security
                </div>
                <div className="text-[9px] text-[#B08D57]/60 font-mono tracking-wider">
                  PASS: MUN-IT-01
                </div>
              </div>
            </div>

            {/* Main Stage: Real Facial Recognition Preview or Manual Login */}
            {!isManualLoginOpen ? (
              <div className="space-y-4">
                {/* Live Webcam Preview Box */}
                <div className="relative w-full aspect-[4/3] max-w-[320px] mx-auto rounded-sm overflow-hidden bg-black border border-[#B08D57]/50 shadow-inner flex items-center justify-center">
                  {/* Video Stream */}
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${
                      isCameraActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Facial Landmark & Bounding Box Overlay Canvas */}
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100 z-10"
                  />

                  {/* Fallback Screen when Camera is Denied or Inactive */}
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-[#120f0d]">
                      {faceStatus === 'loading_models' ? (
                        <div className="flex flex-col items-center space-y-2">
                          <RefreshCw className="w-7 h-7 text-[#B08D57] animate-spin" />
                          <span
                            className="text-xs text-[#B08D57] font-serif tracking-wider"
                            style={{ fontFamily: "'Cinzel', serif" }}
                          >
                            Loading AI Models...
                          </span>
                        </div>
                      ) : faceStatus === 'camera_denied' ? (
                        <div className="flex flex-col items-center space-y-2">
                          <AlertTriangle className="w-8 h-8 text-amber-500" />
                          <span className="text-xs text-amber-200 font-serif font-semibold">
                            Webcam Access Denied
                          </span>
                          <p className="text-[10px] text-neutral-400 font-serif leading-relaxed px-2">
                            Real facial recognition requires live camera permission. Please grant permission or proceed with manual login.
                          </p>
                          <button
                            onClick={startWebcam}
                            className="mt-1 px-3 py-1 rounded-xs bg-[#241b14] border border-[#B08D57]/50 text-[#B08D57] text-[10px] font-serif uppercase tracking-wider hover:bg-[#322419] transition"
                          >
                            Retry Camera
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2">
                          <Camera className="w-7 h-7 text-[#B08D57]/60" />
                          <span
                            className="text-xs text-[#B08D57] font-serif"
                            style={{ fontFamily: "'Cinzel', serif" }}
                          >
                            Starting Sensor...
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verified Checkmark Overlay */}
                  {faceStatus === 'verified' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center z-20 animate-in fade-in duration-300">
                      <div className="w-14 h-14 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_25px_rgba(52,211,153,0.5)]">
                        <CheckCircle2 className="w-9 h-9 text-emerald-400 stroke-[2.5]" />
                      </div>
                      <span
                        className="text-xs font-bold text-emerald-300 font-serif uppercase tracking-widest mt-2"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        Identity Verified ✓
                      </span>
                    </div>
                  )}
                </div>

                {/* Real-time Status Display */}
                <div className="space-y-1.5">
                  <div
                    className={`text-xs tracking-wider font-serif font-semibold transition-colors duration-200 ${
                      faceStatus === 'verified'
                        ? 'text-emerald-400'
                        : faceStatus === 'unrecognized'
                        ? 'text-amber-400'
                        : 'text-[#B08D57]'
                    }`}
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {statusMessage}
                  </div>

                  {/* Real Biometric Similarity Telemetry */}
                  {isCameraActive && faceStatus !== 'loading_models' && (
                    <div className="flex items-center justify-center gap-3 text-[10px] font-mono text-[#F5F2EA]/70">
                      <span>
                        SIMILARITY:{' '}
                        <strong className="text-[#B08D57]">{similarityScore}%</strong>
                      </span>
                      {distanceScore !== null && (
                        <span>
                          DISTANCE:{' '}
                          <strong
                            className={
                              distanceScore <= 0.52
                                ? 'text-emerald-400'
                                : 'text-neutral-400'
                            }
                          >
                            {distanceScore}
                          </strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Informative Camera Error Notice */}
                  {cameraError && (
                    <div className="text-[10px] text-amber-400/90 font-serif italic bg-amber-950/20 border border-amber-900/40 p-2 rounded-xs mt-1">
                      {cameraError}
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-2 space-y-2.5">
                  {/* Authenticate Button */}
                  <button
                    onClick={() => {
                      playClickSound();
                      if (!isCameraActive) {
                        startWebcam();
                      }
                    }}
                    disabled={faceStatus === 'verified'}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#6E4E2E] via-[#B08D57] to-[#6E4E2E] text-[#12100e] font-serif font-bold tracking-[0.16em] uppercase text-xs transition duration-300 hover:brightness-110 active:scale-[0.99] cursor-pointer shadow-md border border-[#B08D57] flex items-center justify-center gap-2"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    <UserCheck className="w-4 h-4 text-[#12100e]" />
                    <span>
                      {isCameraActive ? 'Scanning Live Face...' : 'Activate Camera & Scan'}
                    </span>
                  </button>

                  {/* Manual Login Button */}
                  <button
                    onClick={() => {
                      playClickSound();
                      setIsManualLoginOpen(true);
                    }}
                    className="w-full py-2 px-4 bg-[#1e1a16] hover:bg-[#27211c] text-[#B08D57] hover:text-[#F5F2EA] font-serif tracking-[0.14em] uppercase text-[11px] transition duration-200 cursor-pointer border border-[#B08D57]/30 flex items-center justify-center gap-2"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    <Lock className="w-3.5 h-3.5 text-[#B08D57]/80" />
                    <span>Manual Login</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Fallback Stage: Manual Passcode Authentication */
              <form onSubmit={handleManualLogin} className="space-y-4 pt-1">
                <div className="w-10 h-10 rounded-full border border-[#B08D57]/50 bg-[#1a1512] flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-5 h-5 text-[#B08D57]" />
                </div>

                <div>
                  <h3
                    className="text-sm font-semibold text-[#F5F2EA] tracking-wider font-serif"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Manual Credential Pass
                  </h3>
                  <p
                    className="text-xs text-[#B08D57]/80 font-serif mt-0.5"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    Enter Ahmed Magdi's confidential passcode (Pass: 344)
                  </p>
                </div>

                <div className="relative">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setPasscodeError('');
                    }}
                    placeholder="Enter confidential passcode..."
                    className="w-full bg-[#100d0b] border border-[#B08D57]/50 text-[#F5F2EA] px-3.5 py-2.5 text-xs tracking-wider rounded-none focus:outline-none focus:border-[#B08D57] font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B08D57]/60 hover:text-[#B08D57]"
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {passcodeError && (
                  <div className="text-[11px] text-red-400 font-serif">{passcodeError}</div>
                )}

                {/* Auto-fill Helper */}
                <button
                  type="button"
                  onClick={() => {
                    setPasscode('344');
                    setPasscodeError('');
                  }}
                  className="text-[10px] text-[#B08D57]/70 hover:text-[#B08D57] font-serif underline tracking-wider cursor-pointer"
                >
                  Quick Fill Pass (344)
                </button>

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#6E4E2E] via-[#B08D57] to-[#6E4E2E] text-[#12100e] font-serif font-bold tracking-[0.16em] uppercase text-xs transition duration-300 hover:brightness-110 active:scale-[0.99] cursor-pointer shadow-md border border-[#B08D57]"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Authenticate Credentials
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setIsManualLoginOpen(false);
                    }}
                    className="w-full py-2 px-4 bg-transparent text-[#B08D57]/80 hover:text-[#B08D57] font-serif tracking-wider text-[11px] transition cursor-pointer"
                  >
                    ← Back to Face Recognition
                  </button>
                </div>
              </form>
            )}

            {/* Logout Button (When user is already authenticated) */}
            {isAuthenticated && (
              <div className="mt-4 pt-3 border-t border-[#B08D57]/20">
                <button
                  onClick={() => {
                    playClickSound();
                    logout();
                  }}
                  className="text-[11px] text-red-300 hover:text-red-200 tracking-wider font-serif uppercase flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout Current Session ({currentUser?.name})</span>
                </button>
              </div>
            )}

            {/* Bottom Diplomatic Seal */}
            <div className="mt-6 pt-3 border-t border-[#B08D57]/15">
              <span
                className="text-[9px] tracking-[0.25em] uppercase text-[#B08D57]/40 font-serif italic"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Executive Model United Nations • Secure Portal
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
