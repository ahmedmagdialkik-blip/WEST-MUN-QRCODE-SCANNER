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
  Building2,
  Shield,
  Lock,
  LogIn,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

export const ScannerView: React.FC = () => {
  const {
    currentUser,
    processScan,
    lastScanResult,
    clearLastScanResult,
    stats,
    settings,
    switchAccountFast,
    staffMembers,
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

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isStoppingRef = useRef(false);

  // If unauthorized user accesses scanner directly, show security block
  if (!isAuthorized) {
    const securityStaff = staffMembers.find((s) => s.role === 'security');
    const itStaff = staffMembers.find((s) => s.role === 'it');
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400 mb-4 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Scanner Restricted</h2>
        <p className="text-xs text-neutral-300 max-w-sm mb-5 leading-relaxed">
          Access control scanning is strictly reserved for members of <strong className="text-amber-300">Security</strong> and <strong className="text-amber-300">IT</strong>. Your department is equipped with your personal verified QR Pass.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {securityStaff && (
            <button
              onClick={() => switchAccountFast(securityStaff.id)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Switch to Security ({securityStaff.name.split(' ')[0]})
            </button>
          )}
          {itStaff && (
            <button
              onClick={() => switchAccountFast(itStaff.id)}
              className="px-4 py-2 rounded-xl bg-neutral-900 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              Switch to IT ({itStaff.name.split(' ')[0]})
            </button>
          )}
        </div>
      </div>
    );
  }

  // Initialize and enumerate available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find((d) =>
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

      try {
        if (html5QrCodeRef.current && isScanning) {
          const scannerInstance = html5QrCodeRef.current as unknown as { pause?: (shouldPauseVideo?: boolean) => void };
          if (typeof scannerInstance.pause === 'function') {
            scannerInstance.pause(true);
          }
        }
      } catch {
        // ignore
      }

      processScan(clean, scanMode);

      setTimeout(() => {
        setIsProcessing(false);
      }, 1200);
    },
    [isProcessing, lastScanResult, isScanning, processScan, scanMode]
  );

  const startCameraScanner = async (camId?: string) => {
    setCameraError(null);
    const targetId = camId || selectedCameraId;

    try {
      if (html5QrCodeRef.current) {
        await stopCameraScanner();
      }

      const qrScanner = new Html5Qrcode('reader-stream');
      html5QrCodeRef.current = qrScanner;

      const cameraConfig = targetId
        ? { deviceId: { exact: targetId } }
        : { facingMode: 'environment' };

      await qrScanner.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Normal frame scan
        }
      );

      setIsScanning(true);
      setHasTorchCapability(true);
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
    <div className="flex flex-col items-center px-4 py-4 max-w-lg mx-auto pb-24">
      {/* Hidden container for image uploads */}
      <div id="file-scan-temp" className="hidden"></div>

      {/* SCANNER MODE TOGGLE: Entrance vs Exit */}
      <div className="w-full mb-3 bg-neutral-950 border border-amber-500/30 rounded-2xl p-1 flex shadow-lg">
        <button
          onClick={() => {
            playClickSound();
            setScanMode('entry');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
            scanMode === 'entry'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Entrance Mode (Scan In)</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setScanMode('exit');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
            scanMode === 'exit'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Mode (Scan Out)</span>
        </button>
      </div>

      {/* Mode Banner */}
      <div className={`w-full mb-3 p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
        scanMode === 'entry'
          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
          : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full animate-pulse ${
            scanMode === 'entry' ? 'bg-emerald-400' : 'bg-amber-400'
          }`} />
          <span>
            {scanMode === 'entry'
              ? 'MUN Venue Entrance: Single-scan admittance. (Re-scan blocked unless person leaves).'
              : 'MUN Venue Exit Gate: Scan departing person to unlock their QR code for re-entry.'}
          </span>
        </div>
      </div>

      {/* Scanner Card in Black & Gold */}
      <div className="w-full bg-gradient-to-b from-neutral-950 via-neutral-900 to-black border border-amber-500/40 rounded-3xl p-4 shadow-[0_4px_30px_rgba(212,175,55,0.12)] relative overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></div>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>MUN Venue • {scanMode === 'entry' ? 'Entrance Scanner' : 'Exit Scanner'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isScanning && hasTorchCapability && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-xl transition cursor-pointer active:scale-95 ${
                  isTorchOn
                    ? 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/40 font-bold'
                    : 'bg-neutral-800 text-amber-300 hover:text-white'
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
                className="p-2 rounded-xl bg-neutral-900 border border-amber-500/30 text-amber-300 transition cursor-pointer active:scale-95 hover:border-amber-400"
                title="Switch Camera (Front/Rear)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Viewport Frame */}
        <div className={`relative aspect-square w-full rounded-2xl overflow-hidden bg-black border-2 shadow-inner flex items-center justify-center ${
          scanMode === 'entry' ? 'border-amber-500/40' : 'border-amber-400/80 ring-2 ring-amber-500/20'
        }`}>
          <div id="reader-stream" className="w-full h-full object-cover"></div>

          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-neutral-950/90 via-black/95 to-neutral-950 z-10">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-3 shadow-lg shadow-amber-500/20">
                <Camera className="w-8 h-8" />
              </div>

              <h3 className="text-base font-black text-amber-200 uppercase tracking-wide mb-1">
                Camera Scanner Ready
              </h3>
              <p className="text-xs text-neutral-400 mb-5 max-w-[240px]">
                High-speed rear camera QR scanner for MUN Venue with instant validation
              </p>

              {cameraError && (
                <div className="mb-4 p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              <button
                onClick={() => {
                  playClickSound();
                  startCameraScanner();
                }}
                className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:via-amber-400 hover:to-yellow-400 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-lg shadow-amber-500/30"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Activate Camera Scanner</span>
              </button>
            </div>
          )}

          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className={`w-60 h-60 border-2 rounded-2xl relative shadow-[0_0_40px_rgba(212,175,55,0.2)] ${
                scanMode === 'entry' ? 'border-amber-400/80' : 'border-amber-300 ring-2 ring-amber-400/50'
              }`}>
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-300 rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-300 rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-300 rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-300 rounded-br-lg"></div>

                {/* Animated Scan Line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent animate-pulse shadow-[0_0_15px_#f59e0b]"></div>
              </div>
              <p className="mt-4 text-[11px] font-bold text-amber-300/90 tracking-wider uppercase bg-black/70 px-3 py-1 rounded-full border border-amber-500/30 backdrop-blur-sm">
                {scanMode === 'entry' ? 'Align MUN Venue QR Code' : 'Align QR Code to Log Exit'}
              </p>
            </div>
          )}
        </div>

        {/* Manual Code Input Bar */}
        <div className="mt-4 pt-3 border-t border-neutral-800">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder={scanMode === 'entry' ? 'Enter Ticket ID (e.g. MUN-VIP-8891)...' : 'Enter Ticket to Check Out...'}
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold transition cursor-pointer active:scale-95 shrink-0"
            >
              {scanMode === 'entry' ? 'Verify Entry' : 'Verify Exit'}
            </button>
          </form>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Or scan saved ticket image:</span>
            <label className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 cursor-pointer font-semibold">
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

      {/* Quick Test Scenarios */}
      <div className="w-full mt-4 bg-gradient-to-b from-neutral-950 to-neutral-900 border border-amber-500/30 rounded-2xl p-3.5 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Simulation Tests</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">Current Mode: {scanMode.toUpperCase()}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              playClickSound();
              processScan('MUN-VIP-8891', scanMode);
            }}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex flex-col items-center justify-center text-center transition cursor-pointer active:scale-95 shadow-sm shadow-amber-500/10"
          >
            <CheckCircle2 className="w-4 h-4 mb-1 text-amber-400" />
            <span>Scan Alexander</span>
            <span className="text-[9px] text-neutral-500">(VIP-8891)</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              // Test scanning Elena
              processScan('MUN-GA-4412', scanMode);
            }}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex flex-col items-center justify-center text-center transition cursor-pointer active:scale-95 shadow-sm"
          >
            <UserCheck className="w-4 h-4 mb-1 text-emerald-400" />
            <span>Scan Elena</span>
            <span className="text-[9px] text-neutral-500">(GA-4412)</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              processScan('MUN-INVALID-999', scanMode);
            }}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex flex-col items-center justify-center text-center transition cursor-pointer active:scale-95 shadow-sm"
          >
            <XCircle className="w-4 h-4 mb-1 text-rose-400" />
            <span>Invalid Pass</span>
            <span className="text-[9px] text-neutral-500">(Fake Code)</span>
          </button>
        </div>
      </div>

      {/* Door Security & Duplicate Re-Scan Monitor */}
      <div className="w-full mt-3 p-3 rounded-2xl bg-gradient-to-r from-neutral-950 via-black to-neutral-950 border border-amber-500/30 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-neutral-300 font-semibold">Blocked Re-Scans:</span>
            <span className="font-mono font-bold text-red-400">
              {stats.recentCheckIns.filter((l) => l.type === 'DENIED_ATTEMPT').length} attempts
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-amber-300 font-mono">
            <span>Location: MUN Venue</span>
          </div>
        </div>
      </div>

      {/* Staff Status Strip */}
      <div className="w-full mt-2.5 flex items-center justify-between px-3.5 py-2 rounded-xl bg-black border border-amber-500/30 text-xs text-neutral-400">
        <div>
          Operator:{' '}
          <span className="text-amber-300 font-bold">
            {currentUser ? `${currentUser.name} (${ROLE_LABELS[currentUser.role]?.title})` : 'Security'}
          </span>
        </div>
        <div>
          Currently Inside:{' '}
          <span className="text-amber-300 font-bold font-mono">
            {stats.checkedInCount} / {settings.totalCapacity}
          </span>
        </div>
      </div>
    </div>
  );
};
