import React, { useState } from 'react';
import { Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useVenue } from '../../context/VenueContext';
import { StaffMember } from '../../types/venue';
import { playClickSound, playSuccessChime, playWarningBuzzer } from '../../utils/audio';
import { vibrateSuccess, vibrateWarning } from '../../utils/haptics';
import officialLogoUrl from '../../assets/images/west_mun_logo_official.jpg';
import { getAccountEasterEgg } from '../../utils/easterEggAuth';

interface ExecutiveLoginPageProps {
  onAuthenticated: (user: StaffMember) => void;
}

export const ExecutiveLoginPage: React.FC<ExecutiveLoginPageProps> = ({
  onAuthenticated,
}) => {
  const { login } = useVenue();

  // The login fields must always be empty by default
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<StaffMember | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('❌ Invalid username.');
      playWarningBuzzer();
      vibrateWarning();
      return;
    }

    if (!password) {
      setErrorMessage('❌ Incorrect password.');
      playWarningBuzzer();
      vibrateWarning();
      return;
    }

    setIsAuthenticating(true);

    // Authenticate against the existing members database using forgiving username normalization
    const result = login(username, password);

    if (!result.success || !result.user) {
      setIsAuthenticating(false);
      setErrorMessage(result.error || '❌ Invalid username.');
      playWarningBuzzer();
      vibrateWarning();
      return;
    }

    // Authentication Success
    playSuccessChime();
    vibrateSuccess();

    // Check if the authenticated user has an account-specific welcome animation
    const easterEgg = getAccountEasterEgg(result.user.name);
    if (easterEgg) {
      onAuthenticated(result.user);
      return;
    }

    setAuthenticatedUser(result.user);

    // Display "Welcome back, <Display Name>" for approx 1.8 - 2 seconds before transition
    setTimeout(() => {
      onAuthenticated(result.user!);
    }, 1800);
  };

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center p-3 sm:p-4 overflow-x-hidden select-none text-[#F7F2EA]"
      style={{
        backgroundColor: '#120b07',
        backgroundImage: `
          radial-gradient(circle at 50% 20%, rgba(61, 40, 28, 0.45) 0%, transparent 65%),
          radial-gradient(circle at 80% 80%, rgba(212, 175, 55, 0.06) 0%, transparent 50%),
          linear-gradient(to bottom, #170f0a 0%, #0d0805 100%)
        `,
      }}
    >
      {/* Medieval Arch Filigree Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#c99b58_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Centered Authentication Card */}
      <div className="relative z-10 w-full max-w-[430px] my-4">
        {/* Outer Engraved Metallic Border */}
        <div className="relative p-[1.5px] bg-gradient-to-b from-[#e5c578]/80 via-[#a87944]/50 to-[#6d4825]/80 shadow-[0_20px_60px_rgba(0,0,0,0.95)]">
          {/* Inner Card Container */}
          <div className="relative bg-[#1a110a] px-5 py-7 sm:px-8 sm:py-9 text-center border border-[#a87944]/30">
            {/* Medieval Corner Accents */}
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-[#e5c578]" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-[#e5c578]" />
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-[#e5c578]" />
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-[#e5c578]" />

            {/* Header: Official West MUN Logo */}
            <div className="flex flex-col items-center mb-5">
              <div className="relative mb-3">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-md border border-[#c99b58]/80 p-0.5 bg-[#140c07] shadow-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={officialLogoUrl}
                    alt="West MUN Emblem"
                    className="w-full h-full object-cover filter contrast-120 brightness-105"
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
              <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#B08D57]/60 to-transparent mt-2.5 mb-1" />
            </div>

            {/* Success State: Welcome back banner */}
            {authenticatedUser ? (
              <div className="py-6 space-y-3 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-400 bg-emerald-950/70 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div
                  className="text-xs uppercase tracking-[0.25em] text-[#B08D57] font-serif"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Welcome back,
                </div>
                <h2
                  className="text-xl sm:text-2xl font-bold text-[#F5F2EA] font-serif tracking-wide"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {authenticatedUser.name}
                </h2>
                <p
                  className="text-xs text-[#B08D57]/80 font-serif"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Clearance verified. Connecting to delegation console...
                </p>
              </div>
            ) : (
              /* Authentication Form */
              <form
                onSubmit={handleSubmit}
                autoComplete="off"
                className="space-y-4 text-left"
              >
                {/* Username Input Field */}
                <div>
                  <label
                    htmlFor="west_mun_user"
                    className="block text-xs font-serif uppercase tracking-wider text-[#B08D57] mb-1.5"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Username
                  </label>
                  <div className="relative">
                    <input
                      id="west_mun_user"
                      name="west_mun_login_usr"
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setErrorMessage('');
                      }}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      placeholder="Enter username (e.g. Ahmed Magdi)"
                      className="w-full bg-[#100d0b] border border-[#B08D57]/50 text-[#F5F2EA] pl-9 pr-3.5 py-2.5 text-xs tracking-wider rounded-none focus:outline-none focus:border-[#B08D57] placeholder:text-[#B08D57]/30 font-serif"
                    />
                    <User className="w-4 h-4 text-[#B08D57]/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Password Input Field */}
                <div>
                  <label
                    htmlFor="west_mun_pass"
                    className="block text-xs font-serif uppercase tracking-wider text-[#B08D57] mb-1.5"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="west_mun_pass"
                      name="west_mun_login_pwd"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      autoComplete="new-password"
                      placeholder="Enter 4-digit password (e.g. 344)"
                      className="w-full bg-[#100d0b] border border-[#B08D57]/50 text-[#F5F2EA] pl-9 pr-10 py-2.5 text-xs tracking-wider rounded-none focus:outline-none focus:border-[#B08D57] placeholder:text-[#B08D57]/30 font-mono"
                    />
                    <Lock className="w-4 h-4 text-[#B08D57]/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B08D57]/60 hover:text-[#B08D57] transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Exact Error Message Display */}
                {errorMessage && (
                  <div className="p-2.5 bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-serif tracking-wide rounded-none animate-in fade-in duration-200">
                    {errorMessage}
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[#6d4825] via-[#c99b58] to-[#6d4825] hover:brightness-115 active:scale-[0.99] text-[#120b07] font-serif font-bold tracking-[0.16em] uppercase text-xs transition duration-200 cursor-pointer shadow-md border border-[#e5c578] flex items-center justify-center gap-2"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    <span>{isAuthenticating ? 'Authenticating...' : 'Sign In to Executive Portal'}</span>
                    <ArrowRight className="w-4 h-4 text-[#120b07]" />
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Diplomatic Seal Attribution */}
            <div className="mt-8 pt-4 border-t border-[#B08D57]/15">
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
