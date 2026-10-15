import React from 'react';
import { useVenue } from '../context/VenueContext';
import { isScannerOrAdminRole } from '../types/venue';
import { QrCode, LayoutDashboard, Users, ShieldAlert } from 'lucide-react';
import { playClickSound } from '../utils/audio';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, stats } = useVenue();

  // Enforce: only Security and Admins have bottom navigation
  if (!isScannerOrAdminRole(currentUser?.role)) {
    return null;
  }

  const handleTabChange = (tab: 'scanner' | 'dashboard' | 'guestlist' | 'team') => {
    playClickSound();
    setActiveTab(tab);
  };

  const isManagement =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'hr' ||
    currentUser?.role === 'ceremony_director';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-xl border-t border-amber-500/30 pb-safe pt-1 px-2 shadow-[0_-4px_30px_rgba(0,0,0,0.9)]">
      <div className="max-w-md mx-auto flex items-center justify-around h-16">
        {/* Scanner Tab (Centerpiece) */}
        <button
          onClick={() => handleTabChange('scanner')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all cursor-pointer relative ${
            activeTab === 'scanner' ? 'text-amber-300 font-bold' : 'text-neutral-400 hover:text-amber-200'
          }`}
        >
          <div
            className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-transform ${
              activeTab === 'scanner'
                ? 'bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] -translate-y-2 scale-110 border border-yellow-200'
                : 'text-neutral-400'
            }`}
          >
            <QrCode className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className={`text-[10px] mt-0.5 tracking-tight ${activeTab === 'scanner' ? '-translate-y-1 text-amber-300' : ''}`}>
            Scanner
          </span>
        </button>

        {/* Dashboard Tab */}
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors cursor-pointer ${
            activeTab === 'dashboard' ? 'text-amber-300 font-bold' : 'text-neutral-400 hover:text-amber-200'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className="w-5 h-5" />
            <span className="absolute -top-1 -right-2 text-[8px] font-mono px-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {stats.capacityPercent}%
            </span>
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Dashboard</span>
        </button>

        {/* Guest List Tab */}
        <button
          onClick={() => handleTabChange('guestlist')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors cursor-pointer ${
            activeTab === 'guestlist' ? 'text-amber-300 font-bold' : 'text-neutral-400 hover:text-amber-200'
          }`}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            {stats.pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 text-[8px] font-mono px-1 rounded-full bg-neutral-900 text-amber-300 border border-neutral-700">
                {stats.pendingCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Guest List</span>
        </button>

        {/* Staff & Roles Tab */}
        <button
          onClick={() => handleTabChange('team')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors cursor-pointer ${
            activeTab === 'team' ? 'text-amber-300 font-bold' : 'text-neutral-400 hover:text-amber-200'
          }`}
        >
          <div className="relative">
            <ShieldAlert className="w-5 h-5" />
            {isManagement && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-black"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Roles & Staff</span>
        </button>
      </div>
    </nav>
  );
};
