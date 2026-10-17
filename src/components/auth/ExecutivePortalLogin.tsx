/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ExecutivePortalLogin: Enterprise Diplomatic Authentication Portal
 *
 * Authentication Methods:
 * 1. Username & Password (Default Tab)
 *    - Traditional enterprise username + password authentication
 *    - Empty on mount; autocomplete, autofill, and browser credentials disabled
 *    - No placeholder credentials, no verification codes, no passcodes, no autofill
 *    - Validates against application user database with salted bcrypt hashing
 *    - Rejection: "❌ Invalid username." / "❌ Incorrect password."
 *    - Temporary lockout after repeated failed attempts; rate limiting; audit logs
 * 2. Face ID (Biometric Tab)
 *    - Official FaceAPI ~30 FPS pipeline with 68 landmarks & airport e-gate HUD
 *    - Camera starts strictly when Face ID tab is active; stops immediately when switching away
 * 3. QR Code (Cryptographic Badge Tab)
 *    - Unique cryptographic QR token validation per user
 *    - Seamless switching between methods without page reloads
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  KeyRound,
  Lock,
  User,
  ScanFace,
  QrCode,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  FlipHorizontal,
  UserPlus,
  Camera,
  Upload,
  RefreshCw,
  Clock,
  ShieldAlert,
  FileText,
  X,
} from 'lucide-react';
import officialLogoImage from '../../assets/images/west_mun_logo_official.jpg';
import { useFaceRecognition } from '../../hooks/useFaceRecognition';
import { EnrolledUser } from '../../auth/types';
import { EnrollmentModal } from './EnrollmentModal';
import { qrAuthService, QrUserAccount } from '../../auth/qrAuthService';
import { userAuthService, UserAccount, LoginAuditLog } from '../../auth/userAuthService';
import { ROLE_LABELS } from '../../types/venue';

type AuthMethod = 'password' | 'face_id' | 'qr_code';

interface ExecutivePortalLoginProps {
  onAuthenticated: (user: EnrolledUser) => void;
}

export const ExecutivePortalLogin: React.FC<ExecutivePortalLoginProps> = ({
  onAuthenticated,
}) => {
  // Selected authentication method: Username + Password is the default
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>('password');

  // Username and Password States (Always completely empty on mount; no autofill, no placeholders)
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [welcomeFeedback, setWelcomeFeedback] = useState<string | null>(null);

  // Security Audit Log Viewer Modal (For Security & IT Administrators)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<LoginAuditLog[]>([]);

  // QR Code Authentication States
  const [isQrScannerActive, setIsQrScannerActive] = useState<boolean>(false);
  const [qrScanError, setQrScanError] = useState<string | null>(null);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);
  const [viewingUserPass, setViewingUserPass] = useState<QrUserAccount | null>(null);
  const [userPassQrUrl, setUserPassQrUrl] = useState<string>('');
  const [isPassModalOpen, setIsPassModalOpen] = useState<boolean>(false);

  // Registered QR users
  const [registeredUsers, setRegisteredUsers] = useState<QrUserAccount[]>(() =>
    qrAuthService.getAllUsers()
  );

  // Biometric Enrollment modal state
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState<boolean>(false);

  // Video and Canvas refs for Face ID (Strictly enabled only when selectedMethod === 'face_id')
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ref for Html5Qrcode instance
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Hook for FaceAPI recognition (Strictly enabled only when face_id is active!)
  const { state: faceState, facingMode, cameraError, flipCamera, startWebcam, stopWebcam } =
    useFaceRecognition({
      videoRef,
      canvasRef,
      enabled: selectedMethod === 'face_id',
      onMatchFound: (user) => {
        userAuthService.logExternalAuth(user.fullName, user.fullName, 'face_id');
        setTimeout(() => {
          onAuthenticated(user);
        }, 800);
      },
    });

  // When switching away from Face ID, guarantee webcam stops immediately
  useEffect(() => {
    if (selectedMethod !== 'face_id') {
      stopWebcam();
    }
  }, [selectedMethod, stopWebcam]);

  // Clean up QR scanner when switching away from QR Code tab
  const stopQrScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping QR scanner:', err);
      } finally {
        setIsQrScannerActive(false);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedMethod !== 'qr_code') {
      stopQrScanner();
    }
  }, [selectedMethod, stopQrScanner]);

  // Handle switching methods seamlessly without reloading
  const handleSelectMethod = (method: AuthMethod) => {
    setSelectedMethod(method);
    setValidationError(null);
    setQrScanError(null);
    setScannedFeedback(null);
  };

  /**
   * Handle Username + Password Authentication
   */
  const handlePasswordSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setWelcomeFeedback(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setValidationError('❌ Please enter your username.');
      return;
    }

    if (!password) {
      setValidationError('❌ Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    // Authenticate securely against User Database with salted bcrypt hashing
    const result = userAuthService.authenticate(cleanUsername, password);

    if (!result.success) {
      setIsSubmitting(false);
      // Display exact validation rejection:
      // "❌ Invalid username." (if username not found)
      // "❌ Incorrect password." (if password incorrect)
      // or temporary account lock / disabled message
      setValidationError(result.error);
      return;
    }

    // Success! Load user profile and display welcome back greeting
    const authenticatedUser: UserAccount = result.user;
    setIsSubmitting(false);
    setWelcomeFeedback(authenticatedUser.displayName);

    const enrolledUser: EnrolledUser = {
      id: authenticatedUser.id,
      fullName: authenticatedUser.displayName,
      email: authenticatedUser.email,
      role: authenticatedUser.role,
      profilePhoto: authenticatedUser.profilePicture || officialLogoImage,
      descriptor: [],
      createdAt: new Date().toISOString(),
      lastLogin: authenticatedUser.lastLogin || new Date().toISOString(),
      ticketId: authenticatedUser.ticketId,
    };

    // Transition to welcome screen & homepage
    setTimeout(() => {
      onAuthenticated(enrolledUser);
    }, 850);
  };

  /**
   * Handle scanned QR code payload
   */
  const handleQrPayload = (rawPayload: string) => {
    setQrScanError(null);
    setScannedFeedback(null);

    // Validate using secure cryptographic QR Auth Service
    const authResult = qrAuthService.validateAndAuthenticate(rawPayload);

    if (!authResult.success) {
      setQrScanError(authResult.error);
      return;
    }

    // Success! Log in that specific user
    const matchedUser = authResult.user;
    userAuthService.logExternalAuth(matchedUser.email, matchedUser.fullName, 'qr_code');
    setScannedFeedback(`Welcome back, ${matchedUser.fullName}`);
    stopQrScanner();

    const enrolledUser: EnrolledUser = {
      id: matchedUser.userId,
      fullName: matchedUser.fullName,
      email: matchedUser.email,
      role: matchedUser.role,
      profilePhoto: matchedUser.profilePicture || officialLogoImage,
      descriptor: [],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      ticketId: matchedUser.ticketId,
    };

    setTimeout(() => {
      onAuthenticated(enrolledUser);
    }, 700);
  };

  // Start the live camera QR scanner
  const startQrScanner = async () => {
    setQrScanError(null);
    setScannedFeedback(null);
    try {
      await stopQrScanner();
      const qrScanner = new Html5Qrcode('qr-pass-reader-box');
      html5QrCodeRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: 'user' },
        {
          fps: 15,
          qrbox: { width: 230, height: 230 },
        },
        (decodedText) => {
          handleQrPayload(decodedText);
        },
        () => {}
      );
      setIsQrScannerActive(true);
    } catch (err: unknown) {
      console.warn('Unable to start QR camera scanner:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setQrScanError('Camera access denied. Please grant camera permission or upload a QR image.');
      } else {
        setQrScanError('Could not start QR scanner. Please try again or upload a photo of your QR code.');
      }
      setIsQrScannerActive(false);
    }
  };

  // Handle file upload of QR pass
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQrScanError(null);
    setScannedFeedback('Analyzing uploaded badge QR code...');

    try {
      const tempScanner = new Html5Qrcode('file-scan-temp-login');
      const decodedResult = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      handleQrPayload(decodedResult);
    } catch {
      setQrScanError('Invalid or expired QR code.');
      setScannedFeedback(null);
    }
  };

  // Open individual user QR pass modal
  const handleOpenUserPass = async (user: QrUserAccount) => {
    setViewingUserPass(user);
    try {
      const url = await qrAuthService.generateQrDataUrl(user.userId);
      setUserPassQrUrl(url);
      setIsPassModalOpen(true);
    } catch (err) {
      console.error('Failed to generate pass QR:', err);
    }
  };

  // Regenerate token for a user (revoking the old QR code)
  const handleRegenerateToken = async (userId: string) => {
    try {
      const updatedUser = qrAuthService.regenerateToken(userId);
      setRegisteredUsers(qrAuthService.getAllUsers());
      setViewingUserPass(updatedUser);
      const url = await qrAuthService.generateQrDataUrl(userId);
      setUserPassQrUrl(url);
    } catch (err) {
      console.error('Regenerate token failed:', err);
    }
  };

  // Open Security Audit Logs Modal
  const handleOpenAuditLogs = () => {
    setAuditLogs(userAuthService.getAuditLogs());
    setIsAuditModalOpen(true);
  };

  // Canvas visual HUD overlay for Face ID
  useEffect(() => {
    if (selectedMethod !== 'face_id') return;

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

      // Draw real FaceAPI 68 landmarks
      if (faceState.landmarks && faceState.landmarks.length === 68) {
        ctx.save();
        for (const pt of faceState.landmarks) {
          const px = pt.x * scaleX;
          const py = pt.y * scaleY;
          ctx.beginPath();
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fillStyle =
            faceState.status === 'matched'
              ? '#10b981'
              : faceState.status === 'user_not_recognized'
              ? '#ef4444'
              : '#E5C578';
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw bounding box
      if (faceState.box) {
        const bx = faceState.box.x * scaleX;
        const by = faceState.box.y * scaleY;
        const bw = faceState.box.width * scaleX;
        const bh = faceState.box.height * scaleY;

        ctx.save();
        ctx.strokeStyle =
          faceState.status === 'matched'
            ? '#10b981'
            : faceState.status === 'user_not_recognized'
            ? '#ef4444'
            : '#B08D57';
        ctx.lineWidth = 2.5;

        const cLen = Math.min(22, bw * 0.25);
        ctx.beginPath();
        ctx.moveTo(bx, by + cLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cLen, by);
        ctx.moveTo(bx + bw - cLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + cLen);
        ctx.moveTo(bx, by + bh - cLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + cLen, by + bh);
        ctx.moveTo(bx + bw - cLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - cLen);
        ctx.stroke();

        ctx.restore();
      }

      animId = requestAnimationFrame(renderOverlay);
    };

    renderOverlay();
    return () => cancelAnimationFrame(animId);
  }, [faceState, selectedMethod]);

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#F5F2EA] flex flex-col justify-between selection:bg-[#B08D57]/30 selection:text-[#E5C578] relative overflow-x-hidden font-sans">
      {/* Hidden container for file scan processing */}
      <div id="file-scan-temp-login" className="hidden" />

      {/* Subtle diplomatic radial illumination */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(176, 141, 87, 0.12) 0%, transparent 65%),
            radial-gradient(circle at 15% 50%, rgba(110, 78, 46, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 85% 50%, rgba(110, 78, 46, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 50% 100%, rgba(10, 9, 8, 0.95) 0%, transparent 80%)
          `,
        }}
      />

      {/* Diplomatic Portal Header */}
      <header className="relative z-10 w-full border-b border-[#B08D57]/20 bg-[#0C0B0A]/85 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#B08D57]/60 p-0.5 overflow-hidden shadow-sm">
              <img
                src={officialLogoImage}
                alt="West MUN Seal"
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
                Executive Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAuditLogs}
              className="text-[10px] uppercase font-mono tracking-wider text-[#B08D57] hover:text-[#E5C578] bg-[#14110F] hover:bg-[#1C1714] px-2.5 py-1 rounded-xs border border-[#B08D57]/30 transition cursor-pointer flex items-center gap-1.5"
              title="View Security & Authentication Audit Logs"
            >
              <FileText className="w-3 h-3 text-[#B08D57]" />
              <span>Audit Log</span>
            </button>

            <span className="text-[10px] uppercase font-mono tracking-wider text-[#B08D57]/80 bg-[#14110F] px-2.5 py-1 rounded-xs border border-[#B08D57]/30">
              Enterprise Access
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout Card */}
      <main className="relative z-10 flex-1 w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center">
        {/* Logo & Executive Portal Header */}
        <div className="text-center mb-6 animate-in fade-in duration-300">
          <div className="relative inline-flex items-center justify-center mb-3">
            <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-b from-[#E5C578] via-[#B08D57] to-[#6E4E2E] shadow-[0_0_35px_rgba(176,141,87,0.25)]">
              <div className="w-full h-full rounded-full bg-[#120F0D] p-1.5 flex items-center justify-center overflow-hidden border border-[#B08D57]/40">
                <img
                  src={officialLogoImage}
                  alt="West MUN Emblem"
                  className="w-full h-full rounded-full object-cover filter contrast-110"
                />
              </div>
            </div>
          </div>

          <h1
            className="text-2xl font-bold tracking-[0.2em] text-[#F5F2EA] uppercase mb-1 font-serif"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Executive Portal
          </h1>
          <p
            className="text-[11px] tracking-[0.22em] text-[#B08D57] uppercase font-serif"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Diplomatic Credentials & Admittance
          </p>
        </div>

        {/* Authentication Card */}
        <div className="w-full bg-[#120F0D] border border-[#B08D57]/50 rounded-xs shadow-[0_15px_50px_rgba(0,0,0,0.85)] p-5 sm:p-6 transition-all duration-300">
          {/* METHOD 1: USERNAME + PASSWORD (DEFAULT METHOD) */}
          {selectedMethod === 'password' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {welcomeFeedback ? (
                /* Success Welcome State: "Welcome back, <User's Display Name>" */
                <div className="py-6 text-center animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <span
                    className="text-xs uppercase tracking-[0.25em] text-[#B08D57] font-serif block mb-1"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Welcome back,
                  </span>
                  <h2
                    className="text-xl font-bold tracking-[0.15em] text-[#F5F2EA] font-serif"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {welcomeFeedback}
                  </h2>
                  <p
                    className="text-xs text-emerald-300/90 font-serif mt-2"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Session verified • Loading diplomatic workspace...
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handlePasswordSignIn}
                  className="space-y-4"
                  autoComplete="off"
                  noValidate
                >
                  {/* Username Field: Completely empty on load; autocomplete and autofill disabled */}
                  <div>
                    <label
                      htmlFor="wmun-username-field"
                      className="block text-xs uppercase tracking-[0.18em] text-[#CFC7B4] font-serif mb-1.5"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#B08D57]/70">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="wmun-username-field"
                        name="wmun_secure_user_input"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setValidationError(null);
                        }}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="w-full bg-[#0A0908] border border-[#B08D57]/40 rounded-xs pl-9 pr-3.5 py-2.5 text-sm text-[#F5F2EA] focus:outline-none focus:border-[#E5C578] font-serif transition-colors"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '15px' }}
                      />
                    </div>
                  </div>

                  {/* Password Field: Completely empty on load; autocomplete and autofill disabled */}
                  <div>
                    <label
                      htmlFor="wmun-password-field"
                      className="block text-xs uppercase tracking-[0.18em] text-[#CFC7B4] font-serif mb-1.5"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#B08D57]/70">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="wmun-password-field"
                        name="wmun_secure_pass_input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setValidationError(null);
                        }}
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="w-full bg-[#0A0908] border border-[#B08D57]/40 rounded-xs pl-9 pr-10 py-2.5 text-sm text-[#F5F2EA] focus:outline-none focus:border-[#E5C578] font-serif transition-colors"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '15px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#B08D57]/60 hover:text-[#E5C578] transition cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Clear Inline Validation Message below fields */}
                  {validationError && (
                    <div
                      role="alert"
                      className="p-3 rounded-xs bg-red-950/70 border border-red-500/60 text-red-200 text-xs flex items-center gap-2.5 font-serif shadow-md animate-in fade-in duration-200"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="font-medium text-[13px] leading-tight">{validationError}</span>
                    </div>
                  )}

                  {/* Sign-in Method Selector Tabs */}
                  <div className="pt-2">
                    <p
                      className="text-[11px] uppercase tracking-[0.16em] text-[#B08D57] font-serif mb-2 font-semibold"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      Choose a sign-in method:
                    </p>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleSelectMethod('password')}
                        className="w-full p-2.5 rounded-xs border flex items-center justify-between cursor-pointer transition bg-[#1C1612] border-[#B08D57] text-[#F5F2EA]"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base text-[#E5C578]">◉</span>
                          <span className="text-xs font-serif font-medium">Username & Password</span>
                        </div>
                        <KeyRound className="w-3.5 h-3.5 text-[#B08D57]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectMethod('face_id')}
                        className="w-full p-2.5 rounded-xs border flex items-center justify-between cursor-pointer transition bg-[#0E0C0A] border-[#B08D57]/30 text-[#A89F91] hover:border-[#B08D57]/60"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base text-[#A89F91]">○</span>
                          <span className="text-xs font-serif font-medium">Face ID</span>
                        </div>
                        <ScanFace className="w-3.5 h-3.5 text-[#B08D57]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectMethod('qr_code')}
                        className="w-full p-2.5 rounded-xs border flex items-center justify-between cursor-pointer transition bg-[#0E0C0A] border-[#B08D57]/30 text-[#A89F91] hover:border-[#B08D57]/60"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base text-[#A89F91]">○</span>
                          <span className="text-xs font-serif font-medium">QR Code</span>
                        </div>
                        <QrCode className="w-3.5 h-3.5 text-[#B08D57]" />
                      </button>
                    </div>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-2.5 px-4 rounded-xs bg-gradient-to-r from-[#8C673B] via-[#B08D57] to-[#8C673B] hover:from-[#A67C48] hover:via-[#C5A059] hover:to-[#A67C48] text-[#0A0908] font-bold text-xs uppercase tracking-[0.2em] transition cursor-pointer shadow-md flex items-center justify-center gap-2 font-serif border border-[#E5C578]/60 disabled:opacity-60"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* METHOD 2: FACE ID CAMERA INTERFACE */}
          {selectedMethod === 'face_id' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#B08D57]/30">
                <div className="flex items-center gap-2">
                  <ScanFace className="w-4 h-4 text-[#E5C578]" />
                  <span
                    className="text-xs uppercase tracking-wider text-[#F5F2EA] font-serif font-bold"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Face ID Biometric Verification
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectMethod('password')}
                  className="text-[10px] uppercase font-serif text-[#B08D57] hover:text-[#E5C578] tracking-wider transition underline cursor-pointer"
                >
                  Change Method
                </button>
              </div>

              {/* Segmented Radio Controls Bar */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#0E0C0A] border border-[#B08D57]/30 rounded-xs text-[10px] font-serif">
                <button
                  type="button"
                  onClick={() => handleSelectMethod('password')}
                  className="py-1 text-center rounded-xs text-[#A89F91] hover:text-[#F5F2EA] transition cursor-pointer"
                >
                  Username & Password
                </button>
                <button
                  type="button"
                  className="py-1 text-center rounded-xs bg-[#B08D57] text-[#0A0908] font-bold shadow-sm"
                >
                  Face ID
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMethod('qr_code')}
                  className="py-1 text-center rounded-xs text-[#A89F91] hover:text-[#F5F2EA] transition cursor-pointer"
                >
                  QR Code
                </button>
              </div>

              {/* Camera Preview Frame: Premium Rounded Frame */}
              <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border-2 border-[#B08D57]/60 shadow-[0_0_30px_rgba(176,141,87,0.2)]">
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

                <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-xs text-[9px] font-mono uppercase bg-black/80 border border-[#B08D57]/50 text-[#E5C578] backdrop-blur-sm flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        faceState.status === 'matched'
                          ? 'bg-emerald-400 animate-pulse'
                          : faceState.status === 'user_not_recognized'
                          ? 'bg-red-400'
                          : faceState.status === 'multiple_faces'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400 animate-ping'
                      }`}
                    />
                    <span>
                      {faceState.status === 'matched'
                        ? 'MATCHED'
                        : faceState.status === 'user_not_recognized'
                        ? 'NOT RECOGNIZED'
                        : faceState.status === 'multiple_faces'
                        ? 'MULTIPLE FACES'
                        : 'SCANNING 30 FPS'}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={flipCamera}
                    className="p-1 rounded-xs bg-black/80 border border-[#B08D57]/50 text-[#E5C578] hover:text-white backdrop-blur-sm transition cursor-pointer"
                    title="Flip Camera"
                  >
                    <FlipHorizontal className="w-3 h-3" />
                  </button>
                </div>

                {cameraError && (
                  <div className="absolute inset-3 z-30 flex flex-col items-center justify-center p-3 rounded-md bg-black/95 border border-amber-500/50 text-center">
                    <AlertTriangle className="w-6 h-6 text-amber-400 mb-1.5" />
                    <p className="text-[11px] text-neutral-300 max-w-xs mb-2 font-serif leading-relaxed">
                      {cameraError}
                    </p>
                    <button
                      onClick={() => startWebcam(facingMode)}
                      className="px-3 py-1 rounded-xs bg-[#6E4E2E] hover:bg-[#B08D57] text-white text-[11px] font-serif uppercase tracking-wider transition cursor-pointer border border-[#E5C578]"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}

                {faceState.status === 'matched' && faceState.recognizedUser && (
                  <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center animate-in zoom-in-95 duration-150">
                    <div className="w-12 h-12 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-2 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3
                      className="text-base font-bold font-serif text-[#F5F2EA] uppercase tracking-wider mb-0.5"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      Welcome back,
                      <br />
                      <span className="text-[#E5C578]">{faceState.recognizedUser.fullName}</span>
                    </h3>
                    <p className="text-[11px] text-emerald-300 font-serif">
                      Biometric Identity Authenticated ({faceState.confidence}%)
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`p-2.5 rounded-xs border text-xs font-serif leading-relaxed flex items-center gap-2 ${
                  faceState.status === 'matched'
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                    : faceState.status === 'user_not_recognized'
                    ? 'bg-red-950/60 border-red-500/50 text-red-200'
                    : faceState.status === 'multiple_faces'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                    : 'bg-[#181310] border-[#B08D57]/40 text-[#E5C578]'
                }`}
              >
                {faceState.status === 'matched' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {faceState.status === 'user_not_recognized' && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                {faceState.status === 'multiple_faces' && <Users className="w-4 h-4 text-amber-400 shrink-0" />}
                {faceState.status === 'waiting_for_face' && <Eye className="w-4 h-4 text-[#E5C578] shrink-0" />}
                <span className="font-medium">{faceState.message}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setIsEnrollmentOpen(true)}
                  className="text-[10px] uppercase font-serif text-[#B08D57] hover:text-[#E5C578] flex items-center gap-1 cursor-pointer tracking-wider"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Enroll Reference Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMethod('password')}
                  className="text-[10px] uppercase font-serif text-[#A89F91] hover:text-[#F5F2EA] tracking-wider cursor-pointer"
                >
                  Return to Username & Password
                </button>
              </div>
            </div>
          )}

          {/* METHOD 3: REAL MULTI-USER QR CODE AUTHENTICATION */}
          {selectedMethod === 'qr_code' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-[#B08D57]/30">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#E5C578]" />
                  <span
                    className="text-xs uppercase tracking-wider text-[#F5F2EA] font-serif font-bold"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Multi-User QR Sign-In
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectMethod('password')}
                  className="text-[10px] uppercase font-serif text-[#B08D57] hover:text-[#E5C578] tracking-wider transition underline cursor-pointer"
                >
                  Change Method
                </button>
              </div>

              {/* Segmented Radio Controls Bar */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#0E0C0A] border border-[#B08D57]/30 rounded-xs text-[10px] font-serif">
                <button
                  type="button"
                  onClick={() => handleSelectMethod('password')}
                  className="py-1 text-center rounded-xs text-[#A89F91] hover:text-[#F5F2EA] transition cursor-pointer"
                >
                  Username & Password
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMethod('face_id')}
                  className="py-1 text-center rounded-xs text-[#A89F91] hover:text-[#F5F2EA] transition cursor-pointer"
                >
                  Face ID
                </button>
                <button
                  type="button"
                  className="py-1 text-center rounded-xs bg-[#B08D57] text-[#0A0908] font-bold shadow-sm"
                >
                  QR Code
                </button>
              </div>

              {/* Exact Rejection Message Banner */}
              {qrScanError && (
                <div
                  role="alert"
                  className="p-3 rounded-xs bg-red-950/80 border border-red-500/60 text-red-200 text-xs flex items-center gap-2.5 font-serif shadow-md animate-in fade-in duration-200"
                >
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <span className="font-bold block text-[13px]">{qrScanError}</span>
                    <span className="text-[10px] text-red-300/80 block mt-0.5">
                      Authentication blocked: Token invalid, expired, revoked, or account disabled.
                    </span>
                  </div>
                </div>
              )}

              {/* Success Feedback Banner: "Welcome back, <User Name>" */}
              {scannedFeedback && (
                <div className="p-3 rounded-xs bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2.5 font-serif shadow-lg animate-in zoom-in-95 duration-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block text-[14px] text-[#F5F2EA]" style={{ fontFamily: "'Cinzel', serif" }}>
                      {scannedFeedback}
                    </span>
                    <span className="text-[10px] text-emerald-300 block">
                      Cryptographic signature verified • Authenticating diplomatic session...
                    </span>
                  </div>
                </div>
              )}

              {/* Live Webcam QR Scanner Viewport */}
              <div className="space-y-3">
                <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border-2 border-[#B08D57]/60 shadow-[0_0_30px_rgba(176,141,87,0.2)] flex flex-col items-center justify-center">
                  {/* Html5Qrcode reader mount container */}
                  <div id="qr-pass-reader-box" className="w-full h-full object-cover" />

                  {!isQrScannerActive && (
                    <div className="absolute inset-0 z-20 bg-[#0E0C0A] flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-14 h-14 rounded-full bg-[#1A1410] border border-[#B08D57]/60 flex items-center justify-center text-[#E5C578] mb-3 shadow-md">
                        <Camera className="w-7 h-7" />
                      </div>
                      <h4
                        className="text-xs uppercase font-bold tracking-wider text-[#F5F2EA] font-serif mb-1"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        Scan Your Secure QR Pass
                      </h4>
                      <p className="text-[11px] text-[#A89F91] font-serif max-w-xs mb-3">
                        Position your unique delegate badge or credential QR in front of the camera.
                      </p>
                      <button
                        type="button"
                        onClick={startQrScanner}
                        className="px-4 py-2 rounded-xs bg-[#B08D57] hover:bg-[#C5A059] text-[#0A0908] font-bold text-xs uppercase tracking-wider font-serif transition cursor-pointer shadow-md flex items-center gap-1.5 border border-[#E5C578]"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Start Camera Scanner</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload QR Image fallback if camera is unavailable */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xs bg-[#161210] hover:bg-[#201813] border border-[#B08D57]/40 text-[#E5C578] text-[11px] font-serif flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#B08D57]" />
                    <span>Upload Pass QR Image</span>
                  </button>

                  {isQrScannerActive && (
                    <button
                      type="button"
                      onClick={stopQrScanner}
                      className="py-2 px-3 rounded-xs bg-[#241311] hover:bg-[#321715] border border-red-900/40 text-red-300 text-[11px] font-serif uppercase tracking-wider transition cursor-pointer"
                    >
                      Stop Camera
                    </button>
                  )}
                </div>
              </div>

              {/* Multi-User Official Credential Badges */}
              <div className="pt-2 border-t border-[#B08D57]/20">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] uppercase tracking-wider text-[#B08D57] font-serif font-bold"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Accredited Diplomatic Passes ({registeredUsers.length})
                  </span>
                  <span className="text-[9px] text-[#A89F91] font-mono">
                    Unique Signed Tokens
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {registeredUsers.map((user) => {
                    const isDisabled = user.status === 'disabled';

                    return (
                      <div
                        key={user.userId}
                        className={`p-2 rounded-xs border flex items-center justify-between gap-2 transition ${
                          isDisabled
                            ? 'bg-[#181010] border-red-900/40 opacity-75'
                            : 'bg-[#14100D] border-[#B08D57]/30 hover:border-[#B08D57]/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#F5F2EA] font-serif truncate">
                              {user.fullName}
                            </span>
                            {isDisabled ? (
                              <span className="text-[8px] uppercase px-1 rounded-xs bg-red-950 border border-red-700/50 text-red-400 font-mono">
                                Disabled
                              </span>
                            ) : (
                              <span className="text-[8px] uppercase px-1 rounded-xs bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono">
                                {ROLE_LABELS[user.role]?.badge || user.role}
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-[#A89F91] font-mono truncate">
                            {user.email} • {user.ticketId}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* View Signed QR Modal */}
                          <button
                            type="button"
                            onClick={() => handleOpenUserPass(user)}
                            className="px-2 py-1 rounded-xs bg-[#201814] hover:bg-[#2C211A] border border-[#B08D57]/40 text-[#E5C578] text-[10px] font-serif transition cursor-pointer flex items-center gap-1"
                            title="View official signed QR pass"
                          >
                            <QrCode className="w-3 h-3 text-[#B08D57]" />
                            <span>View QR</span>
                          </button>

                          {/* Instant Test Scan Payload */}
                          <button
                            type="button"
                            onClick={() => {
                              const payloadStr = qrAuthService.generatePayloadString(user.userId);
                              handleQrPayload(payloadStr);
                            }}
                            className="px-2 py-1 rounded-xs bg-[#B08D57] hover:bg-[#C5A059] text-[#0A0908] text-[10px] font-serif font-bold uppercase transition cursor-pointer shadow-xs"
                            title={`Scan ${user.fullName}'s unique QR pass`}
                          >
                            Scan
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Security Validation Test Triggers */}
                <div className="mt-3 pt-2 border-t border-[#B08D57]/20 flex items-center justify-between gap-2 text-[10px] font-serif">
                  <span className="text-[#A89F91]">Test Security Rules:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const expiredStr = qrAuthService.generateExpiredTestPayload(registeredUsers[0]?.userId || '');
                        handleQrPayload(expiredStr);
                      }}
                      className="px-1.5 py-0.5 rounded-xs bg-red-950/50 hover:bg-red-900/60 border border-red-700/50 text-red-300 font-mono cursor-pointer"
                      title="Test scanning an expired QR code"
                    >
                      Expired Code
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const tamperedStr = qrAuthService.generateTamperedPayload(registeredUsers[0]?.userId || '');
                        handleQrPayload(tamperedStr);
                      }}
                      className="px-1.5 py-0.5 rounded-xs bg-red-950/50 hover:bg-red-900/60 border border-red-700/50 text-red-300 font-mono cursor-pointer"
                      title="Test scanning a forged signature QR code"
                    >
                      Forged Signature
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Diplomatic Developer Footer */}
      <footer className="relative z-10 w-full border-t border-[#B08D57]/20 bg-[#0C0B0A]/85 backdrop-blur-md px-4 py-3 text-center">
        <span
          className="text-[10px] uppercase tracking-[0.25em] font-serif"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            color: '#B08D57',
            opacity: 0.6,
          }}
        >
          Western Model United Nations • Developed by Ahmed Magdi
        </span>
      </footer>

      {/* Official Signed User QR Pass Modal */}
      {isPassModalOpen && viewingUserPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-[#120F0D] border-2 border-[#B08D57] rounded-xs shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-5 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border border-[#B08D57]/60 p-0.5 mb-2 shadow-sm">
              <img
                src={officialLogoImage}
                alt="West MUN Seal"
                className="w-full h-full object-cover filter contrast-110"
              />
            </div>

            <span className="text-[9px] uppercase tracking-[0.25em] text-[#B08D57] font-serif">
              Official Diplomatic Pass
            </span>
            <h3
              className="text-lg font-bold uppercase text-[#F5F2EA] font-serif mt-0.5"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {viewingUserPass.fullName}
            </h3>
            <p className="text-xs text-[#E5C578] font-serif mb-3">
              {viewingUserPass.customTitle || ROLE_LABELS[viewingUserPass.role]?.title}
            </p>

            {/* High-res rendered QR code with subtle gold border */}
            <div className="p-3 bg-[#F5F2EA] rounded-xs border-2 border-[#B08D57] shadow-inner mb-3">
              <img
                src={userPassQrUrl}
                alt={`${viewingUserPass.fullName} QR Pass`}
                className="w-48 h-48 object-contain block mx-auto"
              />
            </div>

            {/* User metadata & security details */}
            <div className="w-full p-2.5 rounded-xs bg-[#0C0A09] border border-[#B08D57]/30 text-left text-[10px] space-y-1 mb-4 font-mono">
              <div className="flex justify-between text-[#A89F91]">
                <span>UUID:</span>
                <span className="text-[#E5C578] truncate max-w-[190px]">{viewingUserPass.userId}</span>
              </div>
              <div className="flex justify-between text-[#A89F91]">
                <span>TOKEN:</span>
                <span className="text-[#E5C578] truncate max-w-[190px]">{viewingUserPass.qrToken}</span>
              </div>
              <div className="flex justify-between text-[#A89F91]">
                <span>STATUS:</span>
                <span className={viewingUserPass.status === 'active' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {viewingUserPass.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-[#A89F91]">
                <span>GATE:</span>
                <span className="text-[#F5F2EA]">{viewingUserPass.assignedGate}</span>
              </div>
            </div>

            {/* Actions: Scan this Pass or Regenerate Token */}
            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsPassModalOpen(false);
                  const payloadStr = qrAuthService.generatePayloadString(viewingUserPass.userId);
                  handleQrPayload(payloadStr);
                }}
                className="flex-1 py-2 rounded-xs bg-[#B08D57] hover:bg-[#C5A059] text-[#0A0908] font-bold text-xs uppercase tracking-wider font-serif transition cursor-pointer shadow-sm"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Scan & Log In
              </button>

              <button
                type="button"
                onClick={() => handleRegenerateToken(viewingUserPass.userId)}
                className="py-2 px-2.5 rounded-xs bg-[#1A1410] hover:bg-[#251D17] border border-[#B08D57]/40 text-[#E5C578] text-xs font-serif transition cursor-pointer"
                title="Revoke current QR token and issue a fresh one"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsPassModalOpen(false)}
                className="py-2 px-3 rounded-xs bg-[#14100D] hover:bg-[#201813] border border-[#B08D57]/30 text-[#A89F91] text-xs font-serif transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Audit Log Modal (Enterprise Audit Trails) */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#120F0D] border border-[#B08D57]/60 rounded-xs shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-5 text-left flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#B08D57]/30 mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#E5C578]" />
                <div>
                  <h3
                    className="text-sm font-bold uppercase tracking-wider text-[#F5F2EA] font-serif"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Enterprise Authentication Audit Trail
                  </h3>
                  <span className="text-[10px] text-[#A89F91] font-mono">
                    Security Logs & Rate Limiting Monitor
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1 rounded-xs hover:bg-[#221B16] text-[#A89F91] hover:text-[#F5F2EA] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs font-mono">
              {auditLogs.length === 0 ? (
                <div className="p-4 text-center text-[#A89F91] font-serif">
                  No authentication logs recorded yet.
                </div>
              ) : (
                auditLogs.map((log) => {
                  const isSuccess = log.status === 'success';
                  const isLocked = log.status === 'account_locked';
                  return (
                    <div
                      key={log.id}
                      className={`p-2.5 rounded-xs border text-[11px] leading-relaxed ${
                        isSuccess
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                          : isLocked
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                          : 'bg-red-950/40 border-red-500/40 text-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-0.5">
                        <span className="uppercase tracking-wider">
                          [{log.method.toUpperCase()}] • {log.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-[10px] opacity-75 font-normal">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-[10px] opacity-90">
                        Target User: <span className="font-semibold">{log.username}</span>
                        {log.displayName && <span> ({log.displayName})</span>}
                      </div>
                      {log.notes && (
                        <div className="text-[10px] opacity-80 mt-0.5 italic">
                          {log.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-[#B08D57]/20 flex items-center justify-between text-[11px] font-serif">
              <span className="text-[#A89F91]">
                Max Failed Attempts: 5 • Lockout: 15 min
              </span>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-3 py-1.5 rounded-xs bg-[#B08D57] hover:bg-[#C5A059] text-[#0A0908] font-serif font-bold text-xs uppercase cursor-pointer"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Reference Enrollment Modal */}
      <EnrollmentModal
        isOpen={isEnrollmentOpen}
        onClose={() => setIsEnrollmentOpen(false)}
      />
    </div>
  );
};
