import React, { useState } from 'react';
import { StaffMember, ROLE_LABELS } from '../../types/venue';
import {
  X,
  Copy,
  Check,
  Printer,
  Sparkles,
  RefreshCw,
  Lock,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { playClickSound, playSuccessChime, playWarningBuzzer } from '../../utils/audio';
import officialLogoUrl from '../../assets/images/west_mun_logo_official.jpg';

interface OnboardingCredentialsModalProps {
  member: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  onResetPassword: (staffId: string, customPassword?: string) => { success: boolean; newPassword?: string; error?: string };
  onGenerateNewPassword: (staffId: string) => { success: boolean; newPassword?: string; error?: string };
}

export const OnboardingCredentialsModal: React.FC<OnboardingCredentialsModalProps> = ({
  member,
  isOpen,
  onClose,
  onResetPassword,
  onGenerateNewPassword,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [customPin, setCustomPin] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const roleMeta = ROLE_LABELS[member.role];
  const isAhmedMagdi = member.id === 'staff-it-ahmed' || member.name.toLowerCase().trim() === 'ahmed magdi';
  const currentPassword = member.password || member.accessKey || '••••';

  const handleCopyCredentials = () => {
    playClickSound();
    const formattedText = `================================================
WEST MUN • EXECUTIVE PORTAL ONBOARDING CREDENTIAL
================================================
Delegate / Member : ${member.name}
Official Role     : ${member.customTitle || roleMeta?.title || member.role}
Accreditation ID  : ${member.ticketId || 'MUN-CREDENTIAL'}
Designated Gate   : ${member.assignedGate || 'MUN Venue'}

--- EXECUTIVE LOGIN CREDENTIALS ---
Username          : ${member.name}
Password (PIN)    : ${currentPassword}

Website / Portal  : Executive Portal
Security Notice   : This pass is confidential and assigned strictly
                    to the individual accredited above.
================================================`;

    navigator.clipboard.writeText(formattedText).then(() => {
      setCopied(true);
      playSuccessChime();
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleGenerateRandom = () => {
    playClickSound();
    setActionError(null);
    setActionSuccess(null);

    if (isAhmedMagdi) {
      setActionError("Ahmed Magdi's password is fixed to 344 by executive policy and cannot be altered.");
      playWarningBuzzer();
      return;
    }

    const res = onGenerateNewPassword(member.id);
    if (res.success && res.newPassword) {
      playSuccessChime();
      setActionSuccess(`New 4-digit password generated: ${res.newPassword}`);
      setTimeout(() => setActionSuccess(null), 4000);
    } else {
      playWarningBuzzer();
      setActionError(res.error || 'Failed to generate new password.');
    }
  };

  const handleSaveCustomPin = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (isAhmedMagdi) {
      setActionError("Ahmed Magdi's password is fixed to 344 by executive policy and cannot be altered.");
      playWarningBuzzer();
      return;
    }

    const clean = customPin.trim();
    if (!/^\d{4}$/.test(clean)) {
      setActionError('Password must be exactly 4 numeric digits (0000–9999).');
      playWarningBuzzer();
      return;
    }

    const res = onResetPassword(member.id, clean);
    if (res.success) {
      playSuccessChime();
      setActionSuccess(`Password successfully updated to ${clean}`);
      setIsEditingPassword(false);
      setCustomPin('');
      setTimeout(() => setActionSuccess(null), 4000);
    } else {
      playWarningBuzzer();
      setActionError(res.error || 'Could not update password.');
    }
  };

  const handlePrint = () => {
    playClickSound();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#14100e] border border-[#B08D57]/60 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Medieval Arch Filigree Accents */}
        <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-[#B08D57]" />
        <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-[#B08D57]" />
        <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-[#B08D57]" />
        <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-[#B08D57]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#B08D57]/30 bg-[#191411]">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#B08D57]" />
            <span
              className="text-xs uppercase tracking-[0.2em] font-serif font-bold text-[#F5F2EA]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Member Onboarding Credentials
            </span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1 text-[#B08D57]/70 hover:text-[#F5F2EA] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Printable Credential Pass */}
        <div className="p-5 sm:p-6 space-y-5 text-[#F5F2EA]">
          {/* Official Pass Slip Card */}
          <div
            id="printable-credential-slip"
            className="relative p-5 bg-[#0e0b0a] border border-[#B08D57]/50 shadow-inner space-y-4"
          >
            {/* Seal / Header inside slip */}
            <div className="flex items-center justify-between border-b border-[#B08D57]/20 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded border border-[#B08D57]/60 overflow-hidden bg-[#161210] p-0.5 shrink-0">
                  <img
                    src={officialLogoUrl}
                    alt="West MUN"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div
                    className="text-[10px] uppercase tracking-[0.25em] text-[#B08D57] font-serif"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    WEST MUN • EXECUTIVE PORTAL
                  </div>
                  <div
                    className="text-sm sm:text-base font-bold text-[#F5F2EA] font-serif"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Official Onboarding Pass
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase bg-[#1d1612] text-[#B08D57] px-2 py-0.5 border border-[#B08D57]/40">
                  {member.ticketId || 'MUN-CREDENTIAL'}
                </span>
                <div className="text-[9px] text-[#B08D57]/60 font-serif mt-1">
                  Accredited Pass
                </div>
              </div>
            </div>

            {/* Member Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-serif">
              <div>
                <span className="text-[10px] uppercase text-[#B08D57]/70 block font-serif">Full Name / Member</span>
                <span className="font-bold text-[#F5F2EA] text-sm tracking-wide">{member.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#B08D57]/70 block font-serif">Designated Role</span>
                <span className="text-[#D4AF37] font-semibold">{member.customTitle || roleMeta?.title || member.role}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#B08D57]/70 block font-serif">Diplomatic Email</span>
                <span className="text-neutral-300 font-mono text-[11px] truncate block">{member.email}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#B08D57]/70 block font-serif">Assigned Gate</span>
                <span className="text-neutral-300">{member.assignedGate || 'MUN Venue'}</span>
              </div>
            </div>

            {/* Credential Highlight Box */}
            <div className="p-3.5 bg-[#17120e] border border-[#B08D57]/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-serif">
                <span className="text-[#B08D57] uppercase tracking-wider font-semibold text-[10px]" style={{ fontFamily: "'Cinzel', serif" }}>
                  Authentication Credentials
                </span>
                {isAhmedMagdi && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-[#B08D57]/20 text-[#D4AF37] border border-[#B08D57]/50 font-serif">
                    🛡️ Core Admin (Fixed 344)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Username */}
                <div className="bg-[#0b0908] p-2 border border-[#B08D57]/20">
                  <div className="text-[9px] text-[#B08D57]/70 uppercase font-serif">Login Username</div>
                  <div className="font-mono text-xs font-bold text-[#F5F2EA] mt-0.5 select-all">
                    {member.name}
                  </div>
                  <div className="text-[8px] text-neutral-400 font-serif">
                    (Case-insensitive, spaces forgiven)
                  </div>
                </div>

                {/* Password */}
                <div className="bg-[#0b0908] p-2 border border-[#B08D57]/20 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#B08D57]/70 uppercase font-serif">
                      {isAhmedMagdi ? 'Password (3-digit)' : 'Password (4-digit)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#B08D57]/70 hover:text-[#B08D57] transition text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="font-mono text-base font-bold text-[#D4AF37] mt-0.5 tracking-widest select-all">
                    {showPassword ? currentPassword : '••••'}
                  </div>
                  <div className="text-[8px] text-neutral-400 font-serif">
                    Strict case-sensitive match
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions for Onboarding Delegate */}
            <div className="text-[10px] text-[#B08D57]/70 font-serif leading-relaxed italic border-t border-[#B08D57]/15 pt-2">
              Present these credentials to the delegate during conference check-in. The member should enter their username and confidential 4-digit password on the Executive Portal login page.
            </div>
          </div>

          {/* Feedback Alerts */}
          {actionError && (
            <div className="p-2.5 bg-red-950/50 border border-red-800 text-red-300 text-xs font-serif flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-2.5 bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs font-serif flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Custom Password Input Form (if toggled) */}
          {isEditingPassword && !isAhmedMagdi && (
            <form onSubmit={handleSaveCustomPin} className="p-3 bg-[#181310] border border-[#B08D57]/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[#B08D57] font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                  Set Custom 4-Digit Password
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingPassword(false)}
                  className="text-neutral-400 hover:text-neutral-200 text-xs font-serif"
                >
                  Cancel
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 5821"
                  className="flex-1 bg-[#0d0a08] border border-[#B08D57]/50 px-3 py-1.5 text-xs font-mono text-[#F5F2EA] tracking-widest text-center focus:outline-none focus:border-[#B08D57]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#6E4E2E] hover:bg-[#B08D57] text-[#120f0d] font-bold text-xs uppercase tracking-wider font-serif transition cursor-pointer"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Save PIN
                </button>
              </div>
              <div className="text-[10px] text-neutral-400 font-serif">
                Must be 4 digits. The system will verify that no other member uses this PIN.
              </div>
            </form>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#B08D57]/20">
            {/* Left: Password Reset Controls */}
            {!isAhmedMagdi ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleGenerateRandom}
                  className="px-2.5 py-1.5 bg-[#1f1814] hover:bg-[#2b211a] text-[#D4AF37] border border-[#B08D57]/40 text-xs font-serif flex items-center gap-1 transition cursor-pointer"
                  title="Generate a new unique 4-digit password"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#B08D57]" />
                  <span>Random 4-Digit PIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsEditingPassword(!isEditingPassword);
                    setActionError(null);
                  }}
                  className="px-2.5 py-1.5 bg-[#1f1814] hover:bg-[#2b211a] text-[#F5F2EA] border border-[#B08D57]/40 text-xs font-serif flex items-center gap-1 transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-[#B08D57]" />
                  <span>Custom PIN</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-[#B08D57]/80 font-serif flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Ahmed Magdi password is protected (344)</span>
              </div>
            )}

            {/* Right: Copy & Print */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="px-3 py-1.5 bg-[#1e1713] hover:bg-[#2c221b] text-[#F5F2EA] border border-[#B08D57]/50 text-xs font-serif flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#B08D57]" />}
                <span>{copied ? 'Copied ✓' : 'Copy Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-gradient-to-r from-[#6E4E2E] via-[#B08D57] to-[#6E4E2E] hover:brightness-110 text-[#120f0d] font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-sm border border-[#B08D57]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <Printer className="w-3.5 h-3.5 text-[#120f0d]" />
                <span>Print Pass</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
