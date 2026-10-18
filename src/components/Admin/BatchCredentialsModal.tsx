import React, { useState } from 'react';
import { StaffMember, ROLE_LABELS } from '../../types/venue';
import { X, Copy, Check, Printer, FileText, Shield } from 'lucide-react';
import { playClickSound, playSuccessChime } from '../../utils/audio';
import officialLogoUrl from '../../assets/images/west_mun_logo_official.jpg';

interface BatchCredentialsModalProps {
  staffMembers: StaffMember[];
  isOpen: boolean;
  onClose: () => void;
}

export const BatchCredentialsModal: React.FC<BatchCredentialsModalProps> = ({
  staffMembers,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyAll = () => {
    playClickSound();
    let text = `WEST MUN • OFFICIAL ONBOARDING ROSTER (32 REGISTERED MEMBERS)\n`;
    text += `Generated: ${new Date().toLocaleDateString()}\n`;
    text += `========================================================================================\n`;
    text += `NAME                 | ROLE                       | USERNAME           | PASSWORD | TICKET ID\n`;
    text += `========================================================================================\n`;

    staffMembers.forEach((member) => {
      const name = member.name.padEnd(20, ' ');
      const role = (member.customTitle || ROLE_LABELS[member.role]?.title || member.role).slice(0, 26).padEnd(26, ' ');
      const username = member.name.padEnd(18, ' ');
      const pwd = (member.password || member.accessKey || '344').padEnd(8, ' ');
      const ticket = member.ticketId || '';
      text += `${name} | ${role} | ${username} | ${pwd} | ${ticket}\n`;
    });

    text += `========================================================================================\n`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      playSuccessChime();
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePrint = () => {
    playClickSound();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#14100e] border border-[#B08D57]/70 shadow-[0_30px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#B08D57]/30 bg-[#181310] shrink-0">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-[#B08D57]" />
            <h2
              className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#F5F2EA] font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              All 32 Member Credentials Roster
            </h2>
            <span className="text-[10px] px-2 py-0.5 bg-[#251d17] text-[#D4AF37] border border-[#B08D57]/40 font-mono">
              {staffMembers.length} Accounts
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="px-2.5 py-1 bg-[#1e1713] hover:bg-[#2b211a] text-[#F5F2EA] border border-[#B08D57]/50 text-xs font-serif flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#B08D57]" />}
              <span>{copied ? 'Copied All ✓' : 'Copy All Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-[#6E4E2E] hover:bg-[#B08D57] text-[#120f0d] font-bold text-xs uppercase tracking-wider font-serif flex items-center gap-1.5 transition cursor-pointer border border-[#B08D57]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <Printer className="w-3.5 h-3.5 text-[#120f0d]" />
              <span>Print Roster</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-1 text-[#B08D57]/70 hover:text-[#F5F2EA] transition cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Cards Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-[#F5F2EA]">
          <div className="text-xs text-[#B08D57]/80 font-serif mb-2">
            Each credential slip is formatted for official delegate onboarding and conference check-in.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {staffMembers.map((member) => {
              const roleMeta = ROLE_LABELS[member.role];
              const isAhmed = member.id === 'staff-it-ahmed' || member.name.toLowerCase().trim() === 'ahmed magdi';
              const pwd = member.password || member.accessKey || '344';

              return (
                <div
                  key={member.id}
                  className="p-3 bg-[#0d0a08] border border-[#B08D57]/40 shadow-sm relative space-y-2 text-xs font-serif"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-[#B08D57]/20 pb-1.5">
                    <div>
                      <div className="font-bold text-sm text-[#F5F2EA] font-serif">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-[#D4AF37] font-semibold">
                        {member.customTitle || roleMeta?.title || member.role}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#B08D57] px-1.5 py-0.5 bg-[#17120e] border border-[#B08D57]/30 shrink-0">
                      {member.ticketId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-[9px] uppercase text-[#B08D57]/70 block font-serif">Username</span>
                      <span className="font-mono text-neutral-200 select-all font-semibold">{member.name}</span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase text-[#B08D57]/70 block font-serif">
                        {isAhmed ? 'Password (344)' : 'Password (4-digit)'}
                      </span>
                      <span className="font-mono text-[#D4AF37] select-all font-bold tracking-wider">{pwd}</span>
                    </div>
                  </div>

                  <div className="text-[9px] text-[#B08D57]/50 pt-1 border-t border-[#B08D57]/10 flex items-center justify-between">
                    <span>Gate: {member.assignedGate || 'MUN Venue'}</span>
                    <span>{isAhmed ? 'Protected Core Account' : 'Unique Accredited Pass'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
