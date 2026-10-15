import React, { useState } from 'react';
import { useVenue } from '../context/VenueContext';
import { ROLE_LABELS, isScannerOrAdminRole } from '../types/venue';
import {
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  LogOut,
  UserCheck,
  Shield,
  Key,
  Crown,
  Lock,
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface HeaderProps {
  onOpenTestBadges: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenTestBadges, onOpenAuth }) => {
  const {
    currentUser,
    staffMembers,
    switchAccountFast,
    logout,
    settings,
    updateSettings,
    stats,
  } = useVenue();

  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const isAuthorizedScanner = isScannerOrAdminRole(currentUser?.role);

  const toggleSound = () => {
    playClickSound();
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const handleLogout = () => {
    playClickSound();
    setShowUserDropdown(false);
    logout();
  };

  const currentRoleMeta = currentUser ? ROLE_LABELS[currentUser.role] : null;

  return (
    <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-amber-500/30 px-4 py-2.5 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Live Gold Pulse */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 border border-amber-400/40">
            <Crown className="w-5 h-5 text-neutral-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-wider bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent truncate">
                MUN VENUE
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {isAuthorizedScanner ? 'DOOR OPS' : 'STAFF PASS'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 truncate flex items-center gap-1 font-medium">
              <span className="text-amber-300/80">{currentUser?.assignedGate || 'MUN Venue'}</span>
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isAuthorizedScanner ? (
            <>
              {/* Capacity Mini Pill for Security / Admins */}
              <div className="hidden xs:flex flex-col items-end px-2.5 py-1 rounded-xl bg-neutral-950 border border-amber-500/30 shadow-inner">
                <div className="text-[9px] text-amber-400/70 uppercase font-bold tracking-wider">Capacity</div>
                <div className="text-xs font-bold font-mono text-amber-300">
                  {stats.checkedInCount} / {settings.totalCapacity}
                </div>
              </div>

              {/* Passes Launcher */}
              <button
                onClick={() => {
                  playClickSound();
                  onOpenTestBadges();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/15 hover:from-amber-500/25 hover:to-yellow-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm shadow-amber-500/10"
                title="Open test attendee passes"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Passes</span>
              </button>
            </>
          ) : (
            /* Non-scanner staff pass indicator */
            <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-amber-500/30 text-[11px] font-bold text-amber-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>QR Credential</span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition cursor-pointer active:scale-95 ${
              settings.soundEnabled
                ? 'bg-neutral-950 border-amber-500/30 text-amber-300 hover:text-white'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
            title={settings.soundEnabled ? 'Mute Audio Chimes' : 'Unmute Audio Chimes'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Account Profile / Switcher Menu */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-950 hover:border-amber-400 border border-amber-500/40 text-amber-200 text-xs font-bold transition active:scale-95 cursor-pointer shadow-md"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-black border border-amber-500/40">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="max-w-[70px] sm:max-w-[100px] truncate leading-tight text-white">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-amber-400 font-normal truncate">
                    {currentRoleMeta?.title || currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-amber-400" />
              </button>

              {showUserDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/60"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-neutral-950 border border-amber-500/40 rounded-2xl shadow-2xl z-50 p-2.5 text-left text-white animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-2 border-b border-neutral-800 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">
                          Active Account
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                          {currentRoleMeta?.badge}
                        </span>
                      </div>
                      <p className="text-sm font-black text-white truncate mt-0.5">{currentUser.name}</p>
                      <p className="text-xs text-neutral-400 truncate">{currentUser.email}</p>
                      <p className="text-[11px] text-amber-300 font-semibold mt-1 flex items-center gap-1">
                        <Key className="w-3 h-3 text-amber-400" />
                        <span>PIN: {currentUser.accessKey}</span>
                        <span className="text-neutral-500">•</span>
                        <span className="truncate">{currentUser.assignedGate}</span>
                      </p>
                    </div>

                    <p className="px-2.5 pt-1 pb-1.5 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                      Switch Role Profile:
                    </p>

                    <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                      {staffMembers.map((staff) => (
                        <button
                          key={staff.id}
                          onClick={() => {
                            playClickSound();
                            switchAccountFast(staff.id);
                            setShowUserDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer text-left ${
                            staff.id === currentUser.id
                              ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/40'
                              : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="truncate font-semibold text-white">{staff.name}</p>
                            <p className="text-[10px] text-amber-400/80 truncate">
                              {ROLE_LABELS[staff.role]?.title || staff.role}
                            </p>
                          </div>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold border ${
                              isScannerOrAdminRole(staff.role)
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                            }`}
                          >
                            {isScannerOrAdminRole(staff.role) ? 'Scanner' : 'QR Pass'}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 mt-2 border-t border-neutral-800/80 flex items-center justify-between">
                      <button
                        onClick={handleLogout}
                        className="w-full py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out / Change Account</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                playClickSound();
                onOpenAuth();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md shadow-amber-500/20"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
