import React, { useState } from 'react';
import {
  Crown,
  Lock,
  ArrowRight,
  AlertCircle,
  Globe,
  User,
} from 'lucide-react';
import officialLogoImage from '../../assets/images/west_mun_logo_official.jpg';
import { useVenue } from '../../context/VenueContext';
import { StaffMember } from '../../types/venue';
import { playClickSound, playSuccessChime, playWarningBuzzer } from '../../utils/audio';

interface ExecutiveLoginPageProps {
  onAuthenticated: (user: StaffMember) => void;
}

export const ExecutiveLoginPage: React.FC<ExecutiveLoginPageProps> = ({
  onAuthenticated,
}) => {
  const { login, staffMembers } = useVenue();

  // Clean empty state on load: NO autofill, NO pre-populated values
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form submission: Authenticate with Username & Confidential Password
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setErrorMessage('Please enter both your official username/email and confidential password.');
      return;
    }

    playClickSound();
    setIsVerifying(true);

    setTimeout(() => {
      const result = login(cleanId, cleanPass);
      setIsVerifying(false);

      if (!result.success) {
        playWarningBuzzer();
        setErrorMessage(
          result.error ||
            'Invalid username or confidential password. Please check your assigned credentials.'
        );
        return;
      }

      // Successful verification
      playSuccessChime();

      if (result.user) {
        onAuthenticated(result.user);
      } else {
        const isAhmed =
          cleanId.toLowerCase().replace(/\s+/g, '') === 'ahmedmagdi' ||
          cleanId.toLowerCase().includes('ahmedmagdialkik');

        const authenticatedStaff = staffMembers.find((s) => {
          if (isAhmed && (s.id === 'staff-it-ahmed' || s.name.toLowerCase().includes('ahmed magdi') || s.email === 'AhmedMagdi')) {
            return true;
          }
          const sEmail = (s.email || '').toLowerCase();
          const sName = (s.name || '').toLowerCase();
          const sNormalizedName = sName.replace(/\s+/g, '');
          return (
            sEmail === cleanId.toLowerCase() ||
            sName === cleanId.toLowerCase() ||
            sNormalizedName === cleanId.toLowerCase().replace(/\s+/g, '')
          );
        }) || staffMembers[0];

        onAuthenticated(authenticatedStaff);
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#F5F2EA] flex flex-col justify-between selection:bg-[#B08D57]/30 selection:text-[#E5C578] relative overflow-x-hidden font-sans">
      {/* Subtle Classical Architectural Vignette & Radial Lighting */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(176, 141, 87, 0.12) 0%, transparent 65%),
            radial-gradient(circle at 15% 50%, rgba(110, 78, 46, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 85% 50%, rgba(110, 78, 46, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 50% 100%, rgba(10, 9, 8, 0.95) 0%, transparent 80%)
          `,
        }}
      />

      {/* Top Diplomatic Header Bar */}
      <header className="relative z-10 w-full border-b border-[#B08D57]/20 bg-[#0C0B0A]/80 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#B08D57]/60 p-0.5 overflow-hidden shadow-sm">
              <img
                src={officialLogoImage}
                alt="West MUN Crest"
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
                Diplomacy • Truth • Justice
              </span>
            </div>
          </div>

          <div
            className="hidden sm:flex items-center gap-2 text-[10px] text-[#B08D57]/80 uppercase tracking-widest font-serif"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <Globe className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>Accredited General Assembly</span>
          </div>
        </div>
      </header>

      {/* Main Classical Architectural Portal Body */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
        {/* Grand Diplomatic Medallion & Title Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 animate-in fade-in duration-700">
          {/* Large West MUN Logo framed in an antique gold circular medallion */}
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[2px] bg-gradient-to-b from-[#E5C578] via-[#B08D57] to-[#6E4E2E] shadow-[0_0_40px_rgba(176,141,87,0.22)]">
              <div className="w-full h-full rounded-full bg-[#120F0D] p-1.5 flex items-center justify-center overflow-hidden border border-[#B08D57]/40">
                <img
                  src={officialLogoImage}
                  alt="West MUN Official Emblem"
                  className="w-full h-full rounded-full object-cover filter contrast-110 brightness-100"
                />
              </div>
            </div>

            {/* Antique decorative filigree accent */}
            <div className="absolute -bottom-2 px-3 py-0.5 rounded-xs bg-[#1A1512] border border-[#B08D57]/60 shadow-md">
              <span
                className="text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-[#E5C578] font-serif font-bold"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                EST. WESTMUN
              </span>
            </div>
          </div>

          {/* Executive Portal Title */}
          <h1
            className="text-2xl sm:text-4xl font-bold tracking-[0.18em] text-[#F5F2EA] uppercase mb-2"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            EXECUTIVE PORTAL
          </h1>

          <p
            className="text-xs sm:text-sm tracking-[0.24em] text-[#B08D57] uppercase mb-4 font-serif"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Western Model United Nations • Sovereign Assembly
          </p>

          {/* Inspiring Diplomacy Quote */}
          <blockquote className="my-4 px-6 py-2 border-y border-[#B08D57]/20 relative">
            <p
              className="text-sm sm:text-base text-[#DCD7C9] italic font-serif leading-relaxed"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              &ldquo;Diplomacy is the art of letting someone else have your way, anchored in truth, honor, and the sovereign equality of nations.&rdquo;
            </p>
            <footer
              className="text-[10px] uppercase tracking-[0.28em] text-[#B08D57]/70 font-serif mt-1"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              — Secretariat General Protocol
            </footer>
          </blockquote>

          {/* Elegant Welcome Message & Short Description */}
          <p
            className="text-xs sm:text-[13px] text-[#A8A196] leading-relaxed max-w-lg mx-auto font-serif"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Welcome to the official diplomatic portal of West MUN. Enter your assigned username and confidential password to access executive proceedings, committee delegations, and security operations.
          </p>
        </div>

        {/* The Login Panel: Blends Naturally Into The Page Architecture */}
        <div className="w-full max-w-md relative">
          {/* Engraved Double-Hairline Borders with Ornamental Filigree Corners */}
          <div className="relative bg-[#100D0B] border border-[#B08D57]/40 p-6 sm:p-8 rounded-xs shadow-[0_15px_50px_rgba(0,0,0,0.85)]">
            {/* Medieval / Oxford Corner Accents */}
            <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-[#B08D57]" />
            <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-[#B08D57]" />
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-[#B08D57]" />
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-[#B08D57]" />

            {/* Inner Header Section */}
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-[#B08D57]/20">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#B08D57]" />
                <span
                  className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5F2EA] font-serif"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Account Sign In
                </span>
              </div>

              <span className="text-[9px] uppercase tracking-wider text-[#B08D57] bg-[#1A1512] px-2 py-0.5 rounded-xs border border-[#B08D57]/30 font-serif">
                Confidential Access
              </span>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-xs bg-[#241311] border border-red-500/40 text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-200 font-serif"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Sign In Form: Username & Masked Confidential Password */}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label
                  htmlFor="delegate-username"
                  className="block text-xs uppercase tracking-[0.16em] text-[#CFC7B4] font-serif mb-1.5"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Username or Official Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    id="delegate-username"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Enter assigned username or email"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    className="w-full bg-[#0A0908] border border-[#B08D57]/40 rounded-xs pl-9 pr-3.5 py-2.5 text-sm text-[#F5F2EA] placeholder-[#6E5D4A] focus:outline-none focus:border-[#E5C578] focus:ring-1 focus:ring-[#E5C578]/50 transition-colors font-serif"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="delegate-password"
                  className="block text-xs uppercase tracking-[0.16em] text-[#CFC7B4] font-serif mb-1.5"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Confidential Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    id="delegate-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Enter confidential password"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    className="w-full bg-[#0A0908] border border-[#B08D57]/40 rounded-xs pl-9 pr-3.5 py-2.5 text-sm text-[#F5F2EA] placeholder-[#6E5D4A] focus:outline-none focus:border-[#E5C578] focus:ring-1 focus:ring-[#E5C578]/50 transition-colors font-serif font-mono tracking-widest"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 px-4 mt-2 rounded-xs bg-gradient-to-r from-[#8C673B] via-[#B08D57] to-[#8C673B] hover:from-[#A67C48] hover:via-[#C5A059] hover:to-[#A67C48] text-[#0A0908] font-bold text-xs uppercase tracking-[0.22em] transition-all cursor-pointer shadow-md shadow-black flex items-center justify-center gap-2 active:scale-[0.99] font-serif border border-[#E5C578]/60"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0A0908] border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Enter Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Diplomatic Footer */}
      <footer className="relative z-10 w-full border-t border-[#B08D57]/20 bg-[#0C0B0A]/80 backdrop-blur-md px-4 py-4 text-center">
        <p
          className="text-[10px] uppercase tracking-[0.25em] text-[#B08D57]/60 font-serif"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Western Model United Nations • Sovereign Executive Council • Confidential Access
        </p>
      </footer>
    </div>
  );
};
