import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useVenue } from '../../context/VenueContext';
import { ROLE_LABELS, isScannerOrAdminRole } from '../../types/venue';
import {
  Camera,
  Flashlight,
  FlashlightOff,
  RefreshCw,
  Search,
  Upload,
  AlertCircle,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Shield,
  Lock,
  LogIn,
  LogOut,
  UserCheck,
  Crown,
  ScanFace,
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';
import { FaceIdModal } from '../Biometrics/FaceIdModal';

export const ScannerView: React.FC = () => {
  const {
    currentUser,
    processScan,
    lastScanResult,
    stats,
    settings,
    staffMembers,
    logout,
  } = useVenue();

  const isAuthorized = isScannerOrAdminRole(currentUser?.role);

  // Scan Mode: 'entry' (default admission check) or 'exit' (recording that someone leaves, unlocking them to re-scan)
  const [scanMode, setScanMode] = useState<'entry' | 'exit'>('entry');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchCapability, setHasTorchCapability] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFaceIdOpen, setIsFaceIdOpen] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isStoppingRef = useRef(false);

  // If unauthorized user accesses scanner directly, show security block
  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-md bg-[#1f1510] border border-[#B08D57]/40 flex items-center justify-center text-[#B08D57] mb-4 shadow-lg">
          <Lock className="w-7 h-7" />
        </div>
        <h2
          className="text-xl font-bold text-[#F5F2EA] mb-2 uppercase tracking-wider"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Scanner Restricted
        </h2>
        <p className="text-xs text-neutral-300 max-w-sm mb-5 leading-relaxed font-serif">
          Access control scanning is strictly reserved for members of{' '}
          <strong className="text-[#B08D57]">Admin of IT</strong> and{' '}
          <strong className="text-[#B08D57]">Security</strong>. All other delegates hold their verified QR Pass.
        </p>
        <button
          onClick={() => {
            playClickSound();
            logout();
          }}
          className="px-5 py-2.5 rounded-md bg-[#6E4E2E] hover:bg-[#B08D57] text-[#F5F2EA] font-serif text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
        >
          Sign In with Scanner Account
        </button>
      </div>
    );
  }

  // Initialize and enumerate available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.warn('Camera enumeration error', err);
      });

  return () => {
      stopCameraScanner();
    };
  }, []);

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current && isScanning && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      } finally {
        isStoppingRef.current = false;
        setIsScanning(false);
        setIsTorchOn(false);
      }
    }
  };

  const lastScannedCodeRef = useRef<{ code: string; time: number } | null>(null);

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      const clean = (decodedText || '').trim();
      if (!clean) return;

      if (isProcessing || !!lastScanResult) return;

      const now = Date.now();
      if (
        lastScannedCodeRef.current &&
        lastScannedCodeRef.current.code.toLowerCase() === clean.toLowerCase() &&
        now - lastScannedCodeRef.current.time < 2500
      ) {
        return;
      }

      lastScannedCodeRef.current = { code: clean, time: now };
      setIsProcessing(true);

      processScan(clean, scanMode);

      setTimeout(() => {
        setIsProcessing(false);
      }, 1200);
    },
    [isProcessing, lastScanResult, processScan, scanMode]
  );

  const startCameraScanner = async (cameraId?: string) => {
    setCameraError(null);
    const targetCameraId = cameraId || selectedCameraId;

    try {
      if (html5QrCodeRef.current) {
        await stopCameraScanner();
      }

      const html5QrCode = new Html5Qrcode('reader-stream');
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const cameraParam = targetCameraId ? { deviceId: { exact: targetCameraId } } : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraParam,
        config,
        (decodedText) => handleScanSuccess(decodedText),
        () => {}
      );

      setIsScanning(true);

      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        setHasTorchCapability(Boolean(capabilities && 'torch' in capabilities));
      } catch {
        setHasTorchCapability(false);
      }
    } catch (err: unknown) {
      console.error('Failed to start scanner:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setCameraError('Camera permission denied. Please allow camera in browser settings or use manual code entry.');
      } else {
        setCameraError('Could not start rear camera. You can type ticket IDs below or test with simulation buttons.');
      }
      setIsScanning(false);
    }
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !isScanning) return;
    try {
      const nextTorch = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch failed', e);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    playClickSound();
    processScan(manualCodeInput.trim(), scanMode);
    setManualCodeInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const tempScanner = new Html5Qrcode('file-scan-temp');
      const decodedResult = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      processScan(decodedResult, scanMode);
    } catch {
      processScan('INVALID_IMAGE_QR', scanMode);
    }
  };

  return (
    <div className="flex flex-col items-center px-2 sm:px-4 py-3 max-w-lg mx-auto pb-24">
      {/* Hidden container for image uploads */}
      <div id="file-scan-temp" className="hidden"></div>

      {/* SCANNER MODE TOGGLE: Entrance vs Exit */}
      <div className="w-full mb-3 bg-[#161210] border border-[#B08D57]/40 rounded-md p-1 flex shadow-md">
        <button
          onClick={() => {
            playClickSound();
            setScanMode('entry');
          }}
          className={`flex-1 py-2 px-3 rounded-xs text-xs uppercase tracking-wider font-serif flex items-center justify-center gap-1.5 transition cursor-pointer ${
            scanMode === 'entry'
              ? 'bg-[#6E4E2E] text-[#F5F2EA] shadow-sm border border-[#B08D57]/70 font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <LogIn className="w-3.5 h-3.5 text-[#B08D57]" />
          <span>Entrance (Admit)</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setScanMode('exit');
          }}
          className={`flex-1 py-2 px-3 rounded-xs text-xs uppercase tracking-wider font-serif flex items-center justify-center gap-1.5 transition cursor-pointer ${
            scanMode === 'exit'
              ? 'bg-[#3b2a1a] text-amber-200 shadow-sm border border-[#B08D57]/70 font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <LogOut className="w-3.5 h-3.5 text-[#B08D57]" />
          <span>Exit (Log Departure)</span>
        </button>
      </div>

      {/* Mode Diplomatic Inscription */}
      <div className="w-full mb-3 p-2.5 rounded-md bg-[#161210] border border-[#B08D57]/30 flex items-center justify-between text-xs font-serif">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57] animate-pulse" />
          <span className="text-[#F5F2EA]/90 italic text-[11px] sm:text-xs">
            {scanMode === 'entry'
              ? 'West MUN Entrance: Strict one-scan admittance. Re-scan is blocked until departure.'
              : 'West MUN Exit: Log departing delegates to re-authorize entry credentials.'}
          </span>
        </div>
      </div>

      {/* FACE ID BIOMETRICS ACCESS BANNER */}
      <div className="w-full mb-3 p-3 rounded-md bg-[#181310] border border-[#B08D57]/50 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#241a14] border border-[#B08D57]/40 flex items-center justify-center text-[#B08D57] shadow-sm shrink-0">
            <ScanFace className="w-5 h-5 text-[#B08D57]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-bold text-[#F5F2EA] uppercase tracking-wider font-serif"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Face ID Biometric Scanner
              </span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-xs bg-[#2b2018] text-[#B08D57] border border-[#B08D57]/30 font-mono">
                Active
              </span>
            </div>
            <p className="text-[11px] text-[#B08D57]/80 font-serif">
              Scan Ahmed Magdi's registered face for instant executive check-in
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            playClickSound();
            setIsFaceIdOpen(true);
          }}
          className="px-3.5 py-2 rounded-md bg-[#6E4E2E] hover:bg-[#B08D57] text-[#F5F2EA] font-serif text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm active:scale-95 shrink-0"
        >
          Scan Face ID
        </button>
      </div>

      {/* Main Scanner Card */}
      <div className="w-full bg-[#161210] border border-[#B08D57]/40 rounded-md p-4 shadow-[0_4px_24px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#B08D57] animate-ping" />
            <span
              className="text-xs font-bold text-[#F5F2EA] uppercase tracking-wider flex items-center gap-1.5 font-display"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <Crown className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>WEST MUN • {scanMode === 'entry' ? 'Entrance Gate' : 'Exit Gate'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isScanning && hasTorchCapability && (
              <button
                onClick={toggleTorch}
                className={`p-1.5 rounded-md border transition cursor-pointer ${
                  isTorchOn
                    ? 'bg-[#B08D57] text-neutral-950 font-bold border-[#B08D57]'
                    : 'bg-[#1e1713] border-[#B08D57]/40 text-[#B08D57] hover:text-white'
                }`}
                title="Toggle torch"
              >
                {isTorchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
              </button>
            )}

            {cameras.length > 1 && (
              <button
                onClick={() => {
                  playClickSound();
                  const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
                  const nextIndex = (currentIndex + 1) % cameras.length;
                  const nextCam = cameras[nextIndex];
                  setSelectedCameraId(nextCam.id);
                  if (isScanning) {
                    startCameraScanner(nextCam.id);
                  }
                }}
                className="p-1.5 rounded-md bg-[#1e1713] border border-[#B08D57]/40 text-[#B08D57] transition cursor-pointer hover:border-[#B08D57]"
                title="Switch Camera (Front/Rear)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Viewport Frame */}
        <div className="relative aspect-square w-full rounded-md overflow-hidden bg-black border border-[#B08D57]/40 shadow-inner flex items-center justify-center">
          <div id="reader-stream" className="w-full h-full object-cover"></div>

          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#100d0b] z-10">
              <div className="w-14 h-14 rounded-md bg-[#1a1410] border border-[#B08D57]/50 flex items-center justify-center text-[#B08D57] mb-3 shadow-md">
                <Camera className="w-7 h-7 text-[#B08D57]" />
              </div>

              <h3
                className="text-sm font-bold text-[#F5F2EA] uppercase tracking-wider mb-1"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Optical Camera Scanner
              </h3>
              <p className="text-xs text-neutral-400 mb-5 max-w-[240px] font-serif">
                Instant optical badge scanning for West MUN delegates and executive officials
              </p>

              {cameraError && (
                <div className="mb-4 p-2.5 rounded-md bg-red-950/60 border border-red-500/40 text-red-200 text-xs text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              <button
                onClick={() => {
                  playClickSound();
                  startCameraScanner();
                }}
                className="w-full py-2.5 px-4 rounded-md bg-[#6E4E2E] hover:bg-[#B08D57] text-[#F5F2EA] font-serif text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-md"
              >
                <Zap className="w-4 h-4 text-[#B08D57]" />
                <span>Activate Camera Scanner</span>
              </button>
            </div>
          )}

          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-56 h-56 border border-[#B08D57]/70 relative">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-[#B08D57]" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-[#B08D57]" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-[#B08D57]" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-[#B08D57]" />

                {/* Animated Gold Scan Line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#F5F2EA] to-transparent animate-laser shadow-[0_0_8px_#B08D57]" />
              </div>
              <p className="mt-4 text-[10px] font-serif uppercase tracking-[0.2em] text-[#B08D57] bg-black/80 px-3 py-1 rounded-xs border border-[#B08D57]/40">
                {scanMode === 'entry' ? 'Align West MUN QR Credential' : 'Align Badge to Record Departure'}
              </p>
            </div>
          )}
        </div>

        {/* Manual Code Input Bar */}
        <div className="mt-4 pt-3 border-t border-[#B08D57]/20">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder={scanMode === 'entry' ? 'Enter Ticket ID (e.g. MUN-VIP-01 or MUN-IT-01)...' : 'Enter Ticket ID to depart...'}
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                className="w-full bg-[#100d0b] border border-[#B08D57]/40 focus:border-[#B08D57] rounded-md pl-9 pr-3 py-2 text-xs text-[#F5F2EA] placeholder-neutral-500 focus:outline-none font-serif"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-md bg-[#6E4E2E] hover:bg-[#B08D57] text-[#F5F2EA] text-xs font-serif uppercase tracking-wider transition cursor-pointer active:scale-95 shrink-0"
            >
              {scanMode === 'entry' ? 'Verify Entry' : 'Verify Exit'}
            </button>
          </form>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-neutral-400 font-serif">
            <span>Or scan saved credential image:</span>
            <label className="inline-flex items-center gap-1 text-[#B08D57] hover:text-[#F5F2EA] cursor-pointer font-serif">
              <Upload className="w-3 h-3" />
              <span>Upload QR Image</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Quick Test Simulation Strip */}
      <div className="w-full mt-3 bg-[#161210] border border-[#B08D57]/40 rounded-md p-3.5 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#B08D57] font-display" style={{ fontFamily: "'Cinzel', serif" }}>
            <Sparkles className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>Instant Simulation Tests</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Current: {scanMode.toUpperCase()}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              playClickSound();
              processScan('MUN-IT-01', scanMode);
            }}
            className="p-2.5 rounded-md bg-[#1a1410] hover:bg-[#251d17] border border-[#B08D57]/40 text-[#F5F2EA] text-[11px] font-serif flex flex-col items-center justify-center text-center transition cursor-pointer active:scale-95"
          >
            <Crown className="w-4 h-4 mb-1 text-[#B08D57]" />
            <span className="font-semibold">Ahmed Magdi</span>
            <span className="text-[9px] text-[#B08D57]/70 font-mono">(MUN-IT-01)</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              processScan('MUN-EXEC-01', scanMode);
            }}
            className="p-2.5 rounded-md bg-[#1a1410] hover:bg-[#251d17] border border-[#B08D57]/40 text-[#F5F2EA] text-[11px] font-serif flex flex-col items-center justify-center text-center transition cursor-pointer active:scale-95"
          >
            <UserCheck className="w-4 h-4 mb-1 text-emerald-400" />
            <span className="font-semibold">Rakan (SG)</span>
            <span className="text-[9px] text-neutral-400 font-mono">(EXEC-01)</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              processScan('MUN-INVALID-999', scanMode);
            }}
            className="p-2.5 rounded-md bg-[#1a1410] hover:bg-[#251d17] border border-rose-900/40 text-rose-300 text-[11px] font-serif flex flex-col items-center justify-center text-center transition cursor-pointer active:scale-95"
          >
            <XCircle className="w-4 h-4 mb-1 text-rose-400" />
            <span className="font-semibold">Invalid Pass</span>
            <span className="text-[9px] text-neutral-400 font-mono">(Fake Code)</span>
          </button>
        </div>
      </div>

      {/* Staff Status Strip */}
      <div className="w-full mt-3 flex items-center justify-between px-3.5 py-2.5 rounded-md bg-[#161210] border border-[#B08D57]/30 text-xs text-neutral-300 font-serif">
        <div>
          Active Officer:{' '}
          <span className="text-[#B08D57] font-bold">
            {currentUser ? `${currentUser.name} (${ROLE_LABELS[currentUser.role]?.title})` : 'Security'}
          </span>
        </div>
        <div>
          Inside Venue:{' '}
          <span className="text-[#B08D57] font-bold font-mono">
            {stats.checkedInCount} / {settings.totalCapacity}
          </span>
        </div>
      </div>

      {/* Face ID Biometric Scanner Modal */}
      <FaceIdModal
        isOpen={isFaceIdOpen}
        onClose={() => setIsFaceIdOpen(false)}
        scanMode={scanMode}
      />
    </div>
  );
};
