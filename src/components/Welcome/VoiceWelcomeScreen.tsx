/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Executive Welcome Screen (Silent, Animated Text Only)
 * Strictly displays animated text with no audio or voice synthesis.
 */

import React, { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck, Calendar, Crown, Sparkles } from 'lucide-react';
import officialLogoImage from '../../assets/images/west_mun_logo_official.jpg';
import { StaffMember, ROLE_LABELS } from '../../types/venue';

interface VoiceWelcomeScreenProps {
  user: StaffMember;
  onComplete: () => void;
}

export const VoiceWelcomeScreen: React.FC<VoiceWelcomeScreenProps> = ({
  user,
  onComplete,
}) => {
  const [stage, setStage] = useState<number>(0);
  const [isExiting, setIsExiting] = useState(false);

  const displayName = user?.name?.trim() || 'Ahmed Magdi';
  const roleMeta = ROLE_LABELS[user.role];
  const roleDisplayTitle = user.customTitle || roleMeta?.title || 'Executive Delegate';

  // Format today's date in formal diplomatic style
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Time-based salutation
  const currentHour = new Date().getHours();
  let salutation = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) {
    salutation = 'Good afternoon';
  } else if (currentHour >= 17 || currentHour < 4) {
    salutation = 'Good evening';
  }

  // Orchestrate text reveals
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 200);  // Reveal seal & badge
    const t2 = setTimeout(() => setStage(2), 700);  // Reveal "Welcome back, <name>"
    const t3 = setTimeout(() => setStage(3), 1300); // Reveal diplomatic credentials
    const t4 = setTimeout(() => setStage(4), 1900); // Reveal action button & auto-progress
    const tAuto = setTimeout(() => {
      handleProceed();
    }, 4200); // Auto advance after text animation finishes

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tAuto);
    };
  }, []);

  const handleProceed = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0A0908] text-[#F5F2EA] flex flex-col justify-between items-center p-6 sm:p-10 select-none overflow-hidden transition-opacity duration-400 ${
        isExiting ? 'opacity-0 scale-98' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background ambient gold aura */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 35%, rgba(176, 141, 87, 0.16) 0%, transparent 65%),
            radial-gradient(circle at 15% 75%, rgba(110, 78, 46, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 85% 75%, rgba(110, 78, 46, 0.08) 0%, transparent 50%)
          `,
        }}
      />

      {/* Top Diplomatic Header Bar */}
      <header className="relative z-10 w-full max-w-2xl flex items-center justify-between border-b border-[#B08D57]/20 pb-3">
        <div className="flex items-center gap-2.5">
          <Crown className="w-4 h-4 text-[#B08D57]" />
          <span
            className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E5C578] font-serif"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Western Model United Nations
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-[#B08D57]/80">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Clearance Level 1</span>
        </div>
      </header>

      {/* Center Animated Text Reveal */}
      <main className="relative z-10 w-full max-w-xl flex flex-col items-center text-center my-auto">
        {/* Stage 1: Official Seal */}
        <div
          className={`transition-all duration-700 transform mb-6 ${
            stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="relative inline-flex items-center justify-center">
            <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-b from-[#E5C578] via-[#B08D57] to-[#6E4E2E] shadow-[0_0_40px_rgba(176,141,87,0.3)]">
              <div className="w-full h-full rounded-full bg-[#120F0D] p-1.5 flex items-center justify-center overflow-hidden border border-[#B08D57]/40">
                <img
                  src={officialLogoImage}
                  alt="West MUN Seal"
                  className="w-full h-full rounded-full object-cover filter contrast-110"
                />
              </div>
            </div>
            <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[9px] uppercase font-mono tracking-wider flex items-center gap-1 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Identity Verified</span>
            </div>
          </div>
        </div>

        {/* Stage 2: Main Animated Greeting */}
        <div
          className={`transition-all duration-700 transform ${
            stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <p
            className="text-xs uppercase tracking-[0.3em] text-[#B08D57] font-serif mb-2"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {salutation} • Executive Access
          </p>
          <h1
            className="text-2xl sm:text-4xl font-bold uppercase tracking-[0.16em] text-[#F5F2EA] mb-3 leading-tight font-serif"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Welcome back,
            <br />
            <span className="bg-gradient-to-r from-[#F5E6BE] via-[#E5C578] to-[#B08D57] bg-clip-text text-transparent">
              {displayName}
            </span>
          </h1>
        </div>

        {/* Stage 3: Credentials Badge Card */}
        <div
          className={`transition-all duration-700 transform w-full max-w-md ${
            stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="p-4 rounded-xs bg-[#14110F]/90 border border-[#B08D57]/40 shadow-xl backdrop-blur-sm mb-6">
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="border-r border-[#B08D57]/20 pr-3">
                <span className="text-[9px] uppercase tracking-wider text-[#B08D57] block font-serif">
                  Diplomatic Title
                </span>
                <span className="text-xs font-bold text-[#F5F2EA] font-serif truncate block">
                  {roleDisplayTitle}
                </span>
              </div>
              <div className="pl-1">
                <span className="text-[9px] uppercase tracking-wider text-[#B08D57] block font-serif">
                  Assigned Gate
                </span>
                <span className="text-xs font-mono font-semibold text-[#E5C578] block">
                  {user.assignedGate || 'Executive Chamber A'}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#B08D57]/20 flex items-center justify-between text-[10px] text-[#A89F91] font-serif">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#B08D57]" />
                <span>{formattedDate}</span>
              </span>
              <span className="font-mono text-[#B08D57]">
                {user.ticketId || 'MUN-EXEC-01'}
              </span>
            </div>
          </div>
        </div>

        {/* Stage 4: Enter Console Action */}
        <div
          className={`transition-all duration-700 transform ${
            stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <button
            onClick={handleProceed}
            className="px-6 py-2.5 rounded-xs bg-gradient-to-r from-[#8C673B] via-[#B08D57] to-[#8C673B] hover:from-[#A67C48] hover:via-[#C5A059] hover:to-[#A67C48] text-[#0A0908] font-bold text-xs uppercase tracking-[0.22em] transition-all cursor-pointer shadow-lg flex items-center gap-2.5 font-serif border border-[#E5C578]/60 hover:scale-102"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <span>Proceed to Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Diplomatic Developer Footer */}
      <footer className="relative z-10 w-full text-center pt-3 border-t border-[#B08D57]/15">
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
    </div>
  );
};
