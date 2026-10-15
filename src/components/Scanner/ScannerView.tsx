import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useVenue } from '../../context/VenueContext';
import { ROLE_LABELS, isScannerOrAdminRole } from '../../types/venue';
import { ScanFeedbackOverlay } from './ScanFeedbackOverlay';
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
  Crown,
  Shield,
  Lock,
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
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400 mb-4 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Scanner Restricted</h2>
        <p className="text-xs text-neutral-300 max-w-sm mb-5 leading-relaxed">
          Access control scanning is strictly reserved for <strong className="text-amber-300">Security Officers</strong> and <strong className="text-amber-300">Venue Admins</strong>. Your department is configured with a personal QR Pass.
        </p>
        {securityStaff && (
          <button
            onClick={() => switchAccountFast(securityStaff.id)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
          >
            Switch to Security ({securityStaff.name})
          </button>
        )}
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

  const handleDismissOverlay = () => {
    clearLastScanResult();
    try {
      if (html5QrCodeRef.current && isScanning) {
        const scannerInstance = html5QrCodeRef.current as unknown as { resume?: () => void };
        if (typeof scannerInstance.resume === 'function') {
          scannerInstance.resume();
        }
      }
    } catch {
      // ignore
    }
  };

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      const clean = (decodedText || '').trim();
      if (!clean) return;

      // Guard: Do not process new scans while modal is displayed or already processing
      if (isProcessing || !!lastScanResult) return;

      // Anti-Passback Hardware Debounce: Prevent rapid-fire re-triggers if camera is held over the same QR code
      const now = Date.now();
      if (
        lastScannedCodeRef.current &&
        lastScannedCodeRef.current.code.toLowerCase() === clean.toLowerCase() &&
        now - lastScannedCodeRef.current.time < 3000
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

      processScan(clean);

      setTimeout(() => {
        setIsProcessing(false);
      }, 1200);
    },
    [isProcessing, lastScanResult, isScanning, processScan]
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
        // @ts-expect-error torch is valid in video track constraints
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
      playClickSound();
    } catch (e) {
      console.warn('Torch toggle failed', e);
      setIsTorchOn(false);
      setHasTorchCapability(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    playClickSound();
    processScan(manualCodeInput.trim());
    setManualCodeInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const qrScanner = html5QrCodeRef.current || new Html5Qrcode('file-scanner-temp');
      const result = await qrScanner.scanFile(file, true);
      if (result) {
        processScan(result);
      }
    } catch {
      processScan('UNREADABLE_IMAGE_QR');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canUserScan = currentUser?.canScan ?? true;

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-8.5rem)] px-4 py-3 max-w-md mx-auto w-full select-none text-white">
      {lastScanResult && (
        <ScanFeedbackOverlay result={lastScanResult} onDismiss={handleDismissOverlay} />
      )}

      <div id="file-scanner-temp" className="hidden" />

      {/* Strict Anti-Passback Security Badge */}
      <div className="w-full mb-3 px-3.5 py-2 rounded-2xl bg-black border border-amber-500/40 shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
            Anti-Passback System Active
          </span>
        </div>
        <span className="text-[10px] text-amber-400/80 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
          Single-Use Enforced
        </span>
      </div>

      {/* Role Notice if role does not typically scan */}
      {!canUserScan && (
        <div className="w-full mb-3 p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Signed in as <strong>{currentUser?.name}</strong> ({currentUser?.role}).
            </span>
          </div>
          <button
            onClick={() => switchAccountFast('staff-vol-1')}
            className="px-2 py-1 rounded-lg bg-amber-500 text-neutral-950 font-bold text-[10px] cursor-pointer"
          >
            Switch to Volunteer
          </button>
        </div>
      )}

      {/* Scanner Card in Black & Gold */}
      <div className="w-full bg-gradient-to-b from-neutral-950 via-neutral-900 to-black border border-amber-500/40 rounded-3xl p-4 shadow-[0_4px_30px_rgba(212,175,55,0.12)] relative overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></div>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>West Mun Gold Access</span>
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

        {/* Viewport Frame with Gold Border */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border-2 border-amber-500/40 shadow-inner flex items-center justify-center">
          <div id="reader-stream" className="w-full h-full object-cover"></div>

          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-neutral-950/90 via-black/95 to-neutral-950 z-10">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-3 shadow-lg shadow-amber-500/20">
                <Camera className="w-8 h-8" />
              </div>

              <h3 className="text-base font-black text-amber-200 uppercase tracking-wide mb-1">
                Gold Lens Ready
              </h3>
              <p className="text-xs text-neutral-400 mb-5 max-w-[240px]">
                High-speed rear camera QR scanner with instant audio chime validation
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

          {/* Aim Reticle & Gold Laser */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              <div className="relative w-56 h-56">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl-lg shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr-lg shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl-lg shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br-lg shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>

                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_14px_#f59e0b] animate-laser"></div>
              </div>

              <div className="absolute bottom-3 text-center px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[11px] font-mono font-bold text-amber-300 border border-amber-500/40">
                Align QR Code in gold frame
              </div>
            </div>
          )}
        </div>

        {isScanning && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                playClickSound();
                stopCameraScanner();
              }}
              className="py-1.5 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
            >
              Pause Camera
            </button>
            <div className="text-[11px] text-amber-400/90 font-mono">
              Gate: <span className="text-white font-medium">{currentUser?.assignedGate || 'Door 1'}</span>
            </div>
          </div>
        )}

        {/* Manual Barcode Input Fallback */}
        <div className="mt-4 pt-3 border-t border-neutral-800">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Enter Ticket ID (e.g. WM-VIP-8891)..."
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold transition cursor-pointer active:scale-95 shrink-0"
            >
              Verify
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

      {/* Quick Test Scenarios in Black & Gold */}
      <div className="w-full mt-4 bg-gradient-to-b from-neutral-950 to-neutral-900 border border-amber-500/30 rounded-2xl p-3.5 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Simulation Tests</span>
          </div>
          <span className="text-[10px] text-neutral-400">Audio & Visual</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              playClickSound();
              processScan('WM-VIP-8891');
            }}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex flex-col items-center justify-center text-center transition cursor-pointer active:scale-95 shadow-sm shadow-amber-500/10"
          >
            <CheckCircle2 className="w-4 h-4 mb-1 text-amber-400" />
            <span>Valid VIP</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              processScan('WM-VIP-8892');
            }}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-red-500/40 text-red-300 text-[11px] font-bold flex flex-col items-center justify-center text-center transition cursor-pointer active:scale-95 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 mb-1 text-red-400" />
            <span>Duplicate In</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              processScan('WM-INVALID-999');
            }}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex flex-col items-center justify-center text-center transition cursor-pointer active:scale-95 shadow-sm"
          >
            <XCircle className="w-4 h-4 mb-1 text-rose-400" />
            <span>Invalid Pass</span>
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
              {stats.recentCheckIns.filter((l) => l.type === 'DENIED_ATTEMPT').length} detected
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-amber-300 font-mono">
            <span>Gate: {currentUser?.assignedGate.split(' ')[0] || 'Main'}</span>
          </div>
        </div>
      </div>

      {/* Staff Status Strip */}
      <div className="w-full mt-2.5 flex items-center justify-between px-3.5 py-2 rounded-xl bg-black border border-amber-500/30 text-xs text-neutral-400">
        <div>
          Operator:{' '}
          <span className="text-amber-300 font-bold">
            {currentUser ? ROLE_LABELS[currentUser.role]?.title : 'Staff'}
          </span>
        </div>
        <div>
          Occupancy:{' '}
          <span className="text-amber-300 font-bold font-mono">
            {stats.checkedInCount} / {settings.totalCapacity}
          </span>
        </div>
      </div>
    </div>
  );
};
