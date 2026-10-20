/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BottomNav: High-End Sticky Diplomatic Navigation
 *
 * Clearance:
 * - Security & Admins: Full Scanner, Console, Delegates, Credentials
 * - Heads & Co-Heads: Diplomatic Pass, Department Team & Roles, Delegates
 */

import React from 'react';
import { useVenue } from '../context/VenueContext';
import { isScannerOrAdminRole } from '../types/venue';
import { isHeadOrCoHead } from '../utils/teamHierarchy';
import { QrCode, LayoutDashboard, Users, ShieldAlert, Shield, Crown } from 'lucide-react';
import { playClickSound } from '../utils/audio';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, stats, staffMembers } = useVenue();

  const isScanner = isScannerOrAdminRole(currentUser?.role);
  const isLeader = isHeadOrCoHead(currentUser);

  // If neither an authorized scanner nor a department Head/Co-Head, hide bottom nav
  if (!isScanner && !isLeader) {
    return null;
  }

  const handleTabChange = (tab: 'scanner' | 'dashboard' | 'guestlist' | 'team') => {
    playClickSound();
    setActiveTab(tab);
  };

  const isManagement =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'it' ||
    currentUser?.role === 'security' ||
    currentUser?.role === 'hr';

  // Count team members in this department
  const deptMembersCount = currentUser
    ? staffMembers.filter((s) => s.role === currentUser.role).length
    : 0;

  // Navigation for Department Heads / Co-Heads who are not scanner admins
  if (!isScanner && isLeader) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#120f0d]/95 backdrop-blur-sm border-t border-[#B08D57]/30 pb-safe pt-1.5 px-3 shadow-[0_-4px_25px_rgba(0,0,0,0.8)]">
        <div className="max-w-md mx-auto flex items-center justify-around h-16">
          {/* Diplomatic Pass Tab */}
          <button
            onClick={() => handleTabChange('scanner')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all cursor-pointer relative ${
              activeTab !== 'team' && activeTab !== 'guestlist'
                ? 'text-amber-200'
                : 'text-neutral-400 hover:text-amber-200'
            }`}
          >
            <div
              className={`relative flex items-center justify-center w-11 h-11 rounded-md transition-all duration-200 ${
                activeTab !== 'team' && activeTab !== 'guestlist'
                  ? 'bg-[#6E4E2E] text-[#F5F2EA] shadow-[0_4px_16px_rgba(0,0,0,0.7)] -translate-y-2 border border-[#B08D57]'
                  : 'text-neutral-400 bg-transparent'
              }`}
            >
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span
              className={`text-[10px] mt-0.5 tracking-wider font-serif uppercase ${
                activeTab !== 'team' && activeTab !== 'guestlist'
                  ? '-translate-y-1 text-[#B08D57] font-bold'
                  : ''
              }`}
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              My Pass
            </span>
          </button>

          {/* Department Team & Delegation Tab */}
          <button
            onClick={() => handleTabChange('team')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors cursor-pointer relative ${
              activeTab === 'team' ? 'text-[#D4AF37]' : 'text-neutral-400 hover:text-amber-200'
            }`}
          >
            <div className="relative">
              <Crown className="w-5 h-5 text-[#B08D57]" />
              <span className="absolute -top-1 -right-2 text-[8px] font-mono px-1 rounded-xs bg-[#241b14] text-[#B08D57] border border-[#B08D57]/40">
                {deptMembersCount}
              </span>
            </div>
            <span
              className="text-[10px] mt-1 tracking-wider font-serif uppercase font-semibold"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              My Team
            </span>
          </button>

          {/* Delegate Manifest Tab */}
          <button
            onClick={() => handleTabChange('guestlist')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'guestlist' ? 'text-[#B08D57]' : 'text-neutral-400 hover:text-amber-200'
            }`}
          >
            <div className="relative">
              <Users className="w-5 h-5" />
            </div>
            <span
              className="text-[10px] mt-1 tracking-wider font-serif uppercase"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Delegates
            </span>
          </button>
        </div>
      </nav>
    );
  }

  // Full Navigation for Security Officers & Admin Roles
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#120f0d]/95 backdrop-blur-sm border-t border-[#B08D57]/30 pb-safe pt-1.5 px-3 shadow-[0_-4px_25px_rgba(0,0,0,0.8)]">
      <div className="max-w-md mx-auto flex items-center justify-around h-16">
        {/* Scanner Tab (Centerpiece) */}
        <button
          onClick={() => handleTabChange('scanner')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all cursor-pointer relative ${
            activeTab === 'scanner' ? 'text-amber-200' : 'text-neutral-400 hover:text-amber-200'
          }`}
        >
          <div
            className={`relative flex items-center justify-center w-11 h-11 rounded-md transition-all duration-200 ${
              activeTab === 'scanner'
                ? 'bg-[#6E4E2E] text-[#F5F2EA] shadow-[0_4px_16px_rgba(0,0,0,0.7)] -translate-y-2 border border-[#B08D57]'
                : 'text-neutral-400 bg-transparent'
            }`}
          >
            <QrCode className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={`text-[10px] mt-0.5 tracking-wider font-serif uppercase ${
              activeTab === 'scanner' ? '-translate-y-1 text-[#B08D57] font-bold' : ''
            }`}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Scanner
          </span>
        </button>

        {/* Dashboard Tab */}
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#B08D57]' : 'text-neutral-400 hover:text-amber-200'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className="w-5 h-5" />
            <span className="absolute -top-1 -right-2 text-[8px] font-mono px-1 rounded-xs bg-[#241b14] text-[#B08D57] border border-[#B08D57]/40">
              {stats.capacityPercent}%
            </span>
          </div>
          <span
            className="text-[10px] mt-1 tracking-wider font-serif uppercase"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Console
          </span>
        </button>

        {/* Guest List Tab */}
        <button
          onClick={() => handleTabChange('guestlist')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors cursor-pointer ${
            activeTab === 'guestlist' ? 'text-[#B08D57]' : 'text-neutral-400 hover:text-amber-200'
          }`}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            {stats.pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 text-[8px] font-mono px-1 rounded-xs bg-[#1a1410] text-[#B08D57] border border-[#B08D57]/30">
                {stats.pendingCount}
              </span>
            )}
          </div>
          <span
            className="text-[10px] mt-1 tracking-wider font-serif uppercase"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Delegates
          </span>
        </button>

        {/* Staff & Roles Tab */}
        <button
          onClick={() => handleTabChange('team')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors cursor-pointer ${
            activeTab === 'team' ? 'text-[#B08D57]' : 'text-neutral-400 hover:text-amber-200'
          }`}
        >
          <div className="relative">
            <ShieldAlert className="w-5 h-5" />
            {isManagement && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#B08D57] ring-1 ring-black"></span>
            )}
          </div>
          <span
            className="text-[10px] mt-1 tracking-wider font-serif uppercase font-semibold"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Team & Roles
          </span>
        </button>
      </div>
    </nav>
  );
};
