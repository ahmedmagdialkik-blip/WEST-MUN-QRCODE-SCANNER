import React, { useState } from 'react';
import { useVenue } from '../../context/VenueContext';
import { StaffRole, ROLE_LABELS } from '../../types/venue';
import {
  User,
  Lock,
  ArrowRight,
  Crown,
  KeyRound,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  XCircle,
  Mail,
} from 'lucide-react';
import { playClickSound, playSuccessChime, playWarningBuzzer } from '../../utils/audio';
import { userAuthService } from '../../auth/userAuthService';

interface AuthModalProps {
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { login, register, isAuthenticated, staffMembers, switchAccountFast } = useVenue();

  const [mode, setMode] = useState<'signin' | 'register' | 'switch'>('signin');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<StaffRole>('security');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = usernameInput.trim();
    if (!cleanUsername) {
      setErrorMessage('❌ Invalid username.');
      return;
    }

    if (!passwordInput) {
      setErrorMessage('❌ Incorrect password.');
      return;
    }

    playClickSound();
    const result = login(cleanUsername, passwordInput);
    if (!result.success || !result.user) {
      playWarningBuzzer();
      setErrorMessage(result.error || '❌ Invalid username.');
    } else {
      playSuccessChime();
      switchAccountFast(result.user.id);
      if (onClose) onClose();
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regName.trim() || !regEmail.trim()) {
      setErrorMessage('Please complete all registration fields.');
      return;
    }

    playClickSound();

    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const canScan = regRole === 'super_admin' || regRole === 'it' || regRole === 'security';

    const result = register({
      name: regName.trim(),
      email: regEmail.trim(),
      role: regRole,
      password: pin,
      accessKey: pin,
      assignedGate: 'MUN Venue',
      canScan,
      canManualCheckIn: canScan,
      canRevokeCheckIn: canScan,
      canManageStaff: ['super_admin', 'hr', 'it', 'security'].includes(regRole),
      canExportData: ['super_admin', 'marketing', 'security', 'it', 'pr'].includes(regRole),
      isActive: true,
      lastActiveTime: new Date().toISOString(),
    });

    if (!result.success) {
      playWarningBuzzer();
      setErrorMessage(result.error || 'Failed to register credential.');
    } else {
      playSuccessChime();
      if (onClose) onClose();
    }
  };

  const handleQuickSwitch = (staffId: string) => {
    playClickSound();
    switchAccountFast(staffId);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#161210] border border-[#B08D57]/45 rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.9)] p-5 sm:p-6 text-[#F5F2EA] relative overflow-hidden my-auto">
        {/* Optional Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-sm text-neutral-400 hover:text-amber-300 hover:bg-[#201814] border border-transparent hover:border-[#B08D57]/30 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Branding Crest */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-[#241a14] text-[#B08D57] shadow-sm mb-2 border border-[#B08D57]/50">
            <Crown className="w-6 h-6 text-[#B08D57]" />
          </div>
          <h1
            className="text-xl font-bold tracking-[0.16em] text-[#F5F2EA] uppercase"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            WEST MUN
          </h1>
          <p
            className="text-[10px] uppercase tracking-[0.24em] text-[#B08D57] mt-0.5 font-serif"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Diplomatic Admittance & Authentication
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-[#100d0b] border border-[#B08D57]/30 rounded-xs p-1 mb-4 text-xs font-serif">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs uppercase tracking-wider rounded-xs transition cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#6E4E2E] text-[#F5F2EA] shadow-sm border border-[#B08D57]/60 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Verify ID
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setMode('switch');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs uppercase tracking-wider rounded-xs transition cursor-pointer ${
              mode === 'switch'
                ? 'bg-[#6E4E2E] text-[#F5F2EA] shadow-sm border border-[#B08D57]/60 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Quick Switch
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs uppercase tracking-wider rounded-xs transition cursor-pointer ${
              mode === 'register'
                ? 'bg-[#6E4E2E] text-[#F5F2EA] shadow-sm border border-[#B08D57]/60 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Register
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-xs bg-red-950/60 border border-red-500/40 text-red-200 text-xs text-center font-serif">
            {errorMessage}
          </div>
        )}

        {/* Mode 1: Sign In by Username & Password */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3.5" autoComplete="off">
            <div>
              <label className="block text-xs font-serif text-[#B08D57] mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="w-full bg-[#100d0b] border border-[#B08D57]/40 focus:border-[#B08D57] rounded-xs pl-9 pr-3 py-2 text-xs text-[#F5F2EA] focus:outline-none font-serif"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif text-[#B08D57] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="w-full bg-[#100d0b] border border-[#B08D57]/40 focus:border-[#B08D57] rounded-xs pl-9 pr-9 py-2 text-xs text-[#F5F2EA] focus:outline-none font-serif"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#E5C578] transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xs bg-[#6E4E2E] hover:bg-[#B08D57] text-[#F5F2EA] font-serif text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Mode 2: Quick Mission Account Switcher */}
        {mode === 'switch' && (
          <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar pr-1">
            <p className="text-[11px] text-[#A8A196] font-serif italic mb-2">
              Select accredited diplomatic delegate:
            </p>
            {staffMembers.slice(0, 8).map((staff) => (
              <button
                key={staff.id}
                type="button"
                onClick={() => handleQuickSwitch(staff.id)}
                className="w-full p-2 rounded-xs border border-neutral-800 hover:border-[#B08D57]/50 bg-[#100d0b] hover:bg-[#1A1512] flex items-center justify-between text-left transition cursor-pointer"
              >
                <div>
                  <span className="text-xs font-serif text-[#F5F2EA] font-bold block">
                    {staff.name}
                  </span>
                  <span className="text-[9px] text-[#A8A196] font-serif block">
                    {ROLE_LABELS[staff.role]?.title}
                  </span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-xs bg-[#B08D57]/20 text-[#E5C578] font-serif uppercase">
                  Switch
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Mode 3: Register Delegate Pass (Password-Free) */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 max-h-[50vh] overflow-y-auto pr-1" autoComplete="off">
            <div>
              <label className="block text-xs font-serif text-[#B08D57] mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Delegate Name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoComplete="off"
                  className="w-full bg-[#100d0b] border border-[#B08D57]/40 focus:border-[#B08D57] rounded-xs pl-9 pr-3 py-2 text-xs text-[#F5F2EA] placeholder-neutral-500 focus:outline-none font-serif"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif text-[#B08D57] mb-1">Email / Identifier *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. delegate@westmun.org"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  autoComplete="off"
                  className="w-full bg-[#100d0b] border border-[#B08D57]/40 focus:border-[#B08D57] rounded-xs pl-9 pr-3 py-2 text-xs text-[#F5F2EA] placeholder-neutral-500 focus:outline-none font-serif"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif text-[#B08D57] mb-1">Select Department Role *</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as StaffRole)}
                className="w-full bg-[#100d0b] border border-[#B08D57]/40 rounded-xs px-2.5 py-2 text-xs text-[#F5F2EA] focus:outline-none font-serif"
              >
                <optgroup label="Door Scanners (Security & IT Only)">
                  <option value="it">Admin of IT (Full Scanner & Tech Ops)</option>
                  <option value="security">Security (Active Camera Scanner & Door Access)</option>
                  <option value="super_admin">Secretary General (Super Admin)</option>
                </optgroup>
                <optgroup label="Staff Pass Holders (Personal QR Pass Only)">
                  <option value="executive">Executive Board & Leadership (Executive Pass)</option>
                  <option value="marketing">Marketing (Marketing Pass)</option>
                  <option value="designers">Design (Design Team Pass)</option>
                  <option value="media_and_press">Media & Press (Press Pass)</option>
                  <option value="volunteers">Volunteers (Staff Pass)</option>
                  <option value="logistics">Logistics (Logistics Pass)</option>
                  <option value="pr">Public Relations (VIP Liaison Pass)</option>
                  <option value="hr">Human Resources (HR Pass)</option>
                  <option value="ceremonies">Ceremonies (Ceremonies Pass)</option>
                  <option value="dcc">DCC (DCC Pass)</option>
                </optgroup>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xs bg-[#6E4E2E] hover:bg-[#B08D57] text-[#F5F2EA] font-serif text-xs uppercase tracking-wider transition cursor-pointer shadow-sm active:scale-95"
            >
              Issue Credential & Sign In
            </button>
          </form>
        )}

        {/* Developer Attribution - subtle artist signature */}
        <div className="mt-5 pt-3 border-t border-[#B08D57]/20 flex flex-col items-center justify-center text-center">
          <span
            className="text-[9px] uppercase tracking-[0.28em] italic select-none"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: '#B08D57',
              opacity: 0.22,
            }}
          >
            Developed by Ahmed Magdi
          </span>
          <span className="text-[8px] text-[#B08D57]/40 tracking-wider uppercase font-serif mt-0.5">
            West MUN Venue Access Control & Ticket Security
          </span>
        </div>
      </div>
    </div>
  );
};
