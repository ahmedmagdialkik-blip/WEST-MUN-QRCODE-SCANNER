import React, { useState } from 'react';
import { useVenue } from '../../context/VenueContext';
import { StaffRole, ROLE_LABELS, isScannerOrAdminRole } from '../../types/venue';
import {
  Lock,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  DoorOpen,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

export const AuthModal: React.FC = () => {
  const { login, register, staffMembers, switchAccountFast } = useVenue();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [identifier, setIdentifier] = useState('admin@westmun.com');
  const [password, setPassword] = useState('gold2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<StaffRole>('volunteers');
  const [regGate, setRegGate] = useState('Main Entrance - Lane A');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    playClickSound();

    const result = login(identifier, password);
    if (!result.success) {
      setErrorMessage(result.error || 'Failed to authenticate.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    playClickSound();

    const canScan = isScannerOrAdminRole(regRole);

    const result = register({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword.trim(),
      role: regRole,
      accessKey: String(Math.floor(1000 + Math.random() * 9000)),
      assignedGate: regGate.trim(),
      canScan,
      canManualCheckIn: canScan,
      canRevokeCheckIn: canScan,
      canManageStaff: ['super_admin', 'hr', 'ceremony_director'].includes(regRole),
      canExportData: ['super_admin', 'marketing', 'secretary', 'doc_department', 'pr'].includes(regRole),
      isActive: true,
      lastActiveTime: new Date().toISOString(),
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to create account.');
    }
  };

  const quickLoginAs = (staffId: string) => {
    playClickSound();
    switchAccountFast(staffId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border border-amber-500/40 rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.18)] p-6 sm:p-8 text-white relative overflow-hidden">
        {/* Gold Glow accents */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-neutral-950 shadow-lg shadow-amber-500/25 mb-3">
            <Sparkles className="w-7 h-7 fill-neutral-950" />
          </div>
          <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent uppercase">
            WEST MUN
          </h1>
          <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold mt-0.5">
            Venue Management & Access Portal
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            Please sign in with your password to verify role authorization
          </p>
        </div>

        {/* Sign In vs Register Tabs */}
        <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              mode === 'signin'
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Staff Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              mode === 'register'
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Register Account
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs text-center font-medium">
            {errorMessage}
          </div>
        )}

        {/* Sign In Form */}
        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1.5">
                Staff Email or Access PIN
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. admin@westmun.com or security@westmun.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-amber-200/90">Account Password</label>
                <span className="text-[10px] text-amber-400/80 font-mono">Default: gold2026</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your confidential password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-amber-400 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:via-amber-400 hover:to-yellow-400 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/25 active:scale-95"
            >
              <KeyRound className="w-4 h-4" />
              <span>Sign In to West Mun</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Sterling"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  required
                  placeholder="e.g. jordan@westmun.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1">Create Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="password"
                  required
                  placeholder="Choose a secure password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-amber-200/90 mb-1">
                  Select Department Role *
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as StaffRole)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-400"
                >
                  <optgroup label="Door Scanning & Control (Can Scan)">
                    <option value="security">Security (Camera Scanner & Enforcement)</option>
                    <option value="super_admin">Super Admin (Camera Scanner & Master Admin)</option>
                    <option value="ceremony_director">Ceremony Director (Camera Scanner & Leadership)</option>
                  </optgroup>
                  <optgroup label="Staff Pass Holders (Personal QR Pass Only)">
                    <option value="volunteers">Volunteers (Staff QR Pass Screen)</option>
                    <option value="media_and_press">Media & Press (Accreditation QR Pass Screen)</option>
                    <option value="pr">Public Relations (VIP Liaison QR Pass Screen)</option>
                    <option value="marketing">Marketing (Staff QR Pass Screen)</option>
                    <option value="hr">HR (Staff QR Pass Screen)</option>
                    <option value="secretary">Secretary (Staff QR Pass Screen)</option>
                    <option value="doc_department">Doc Department (Staff QR Pass Screen)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-200/90 mb-1">Assigned Gate / Area</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Entrance"
                  value={regGate}
                  onChange={(e) => setRegGate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:via-amber-400 hover:to-yellow-400 text-neutral-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
            >
              Create Account & Log In
            </button>
          </form>
        )}

        {/* Quick Demo Role Switcher Tray */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Instant 1-Click Role Login:</span>
            </span>
            <span className="text-[9px] text-neutral-400">Security & Admins = Scanner</span>
          </div>

          <p className="text-[10px] text-neutral-400 mb-2">
            Only <strong className="text-amber-300">Security & Admins</strong> can scan. All other roles display their personal scannable QR Pass.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 max-h-44 overflow-y-auto pr-1">
            {staffMembers.map((staff) => {
              const canScan = isScannerOrAdminRole(staff.role);
              return (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => quickLoginAs(staff.id)}
                  className={`p-1.5 rounded-lg border text-left transition cursor-pointer text-[10px] flex flex-col justify-between ${
                    canScan
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                      : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 hover:border-amber-500/30 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 truncate text-[10px]">
                      {ROLE_LABELS[staff.role]?.title.split(' ')[0]}
                    </span>
                    <span
                      className={`text-[8px] font-bold px-1 rounded ${
                        canScan
                          ? 'bg-amber-500/30 text-amber-200'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {canScan ? 'SCAN' : 'PASS'}
                    </span>
                  </div>
                  <span className="text-neutral-500 truncate text-[9px]">{staff.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
