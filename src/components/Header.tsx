import React, { useState } from 'react';
import { useVenue } from '../context/VenueContext';
import { ROLE_LABELS, isScannerOrAdminRole } from '../types/venue';
import {
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  LogOut,
  Crown,
  ScanFace,
  Shield,
  Menu,
  X,
  LayoutDashboard,
  QrCode,
  Users,
  ShieldAlert,
  User,
} from 'lucide-react';
import { playClickSound } from '../utils/audio';
import officialLogoUrl from '../assets/images/west_mun_logo_official.jpg';

interface HeaderProps {
  onOpenTestBadges: () => void;
  onOpenAuth: () => void;
  onReplayIntro?: () => void;
  onOpenFaceId?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTestBadges,
  onOpenAuth,
  onReplayIntro,
  onOpenFaceId,
}) => {
  const {
    currentUser,
    logout,
    settings,
    updateSettings,
    stats,
    activeTab,
    setActiveTab,
  } = useVenue();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthorizedScanner = isScannerOrAdminRole(currentUser?.role);

  const toggleSound = () => {
    playClickSound();
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const handleLogout = () => {
    playClickSound();
    setShowUserDropdown(false);
    setMobileMenuOpen(false);
    logout();
  };

  const handleNavClick = (tab: 'scanner' | 'dashboard' | 'guestlist' | 'team') => {
    playClickSound();
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const currentRoleMeta = currentUser ? ROLE_LABELS[currentUser.role] : null;

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#120f0d]/95 backdrop-blur-sm border-b border-[#B08D57]/30 px-3 sm:px-4 py-2.5 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.7)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand Crest & Live Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                playClickSound();
                if (onReplayIntro) onReplayIntro();
              }}
              title="Watch West MUN Luxury Intro"
              className="w-9 h-9 rounded-sm bg-[#1a1512] hover:bg-[#251e19] flex items-center justify-center shrink-0 border border-[#B08D57]/50 hover:border-[#B08D57] transition cursor-pointer shadow-sm overflow-hidden"
            >
              <img
                src={officialLogoUrl}
                alt="West MUN"
                className="w-full h-full object-cover filter contrast-125"
              />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="font-display font-bold text-sm sm:text-base tracking-[0.16em] text-[#F5F2EA] truncate"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  WEST MUN
                </span>
                <span className="hidden xs:inline-block text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-none bg-[#241b14] text-[#B08D57] border border-[#B08D57]/30 font-serif">
                  {isAuthorizedScanner ? 'EXECUTIVE' : 'DELEGATE'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate flex items-center gap-1.5 font-serif">
                <span className="text-[#B08D57]/90">{currentUser?.assignedGate || 'MUN Venue'}</span>
                <span className="text-[#B08D57]/50">❖</span>
                <span className="text-neutral-400 text-[10px]">Diplomatic Access</span>
              </p>
            </div>
          </div>

          {/* Center & Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop Navigation Links */}
            {isAuthorizedScanner && (
              <nav className="hidden md:flex items-center gap-1 mr-1">
                <button
                  onClick={() => handleNavClick('scanner')}
                  className={`px-2.5 py-1 text-xs font-serif uppercase tracking-wider rounded-none transition border ${
                    activeTab === 'scanner'
                      ? 'bg-[#221b16] text-[#B08D57] border-[#B08D57]/60'
                      : 'text-neutral-400 hover:text-[#F5F2EA] border-transparent'
                  }`}
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Scanner
                </button>
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`px-2.5 py-1 text-xs font-serif uppercase tracking-wider rounded-none transition border ${
                    activeTab === 'dashboard'
                      ? 'bg-[#221b16] text-[#B08D57] border-[#B08D57]/60'
                      : 'text-neutral-400 hover:text-[#F5F2EA] border-transparent'
                  }`}
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavClick('guestlist')}
                  className={`px-2.5 py-1 text-xs font-serif uppercase tracking-wider rounded-none transition border ${
                    activeTab === 'guestlist'
                      ? 'bg-[#221b16] text-[#B08D57] border-[#B08D57]/60'
                      : 'text-neutral-400 hover:text-[#F5F2EA] border-transparent'
                  }`}
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Manifest
                </button>
                <button
                  onClick={() => handleNavClick('team')}
                  className={`px-2.5 py-1 text-xs font-serif uppercase tracking-wider rounded-none transition border ${
                    activeTab === 'team'
                      ? 'bg-[#221b16] text-[#B08D57] border-[#B08D57]/60'
                      : 'text-neutral-400 hover:text-[#F5F2EA] border-transparent'
                  }`}
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Team
                </button>
              </nav>
            )}

            {/* Capacity Counter */}
            {isAuthorizedScanner && (
              <div className="hidden sm:flex flex-col items-end px-2 py-0.5 rounded-none bg-[#161210] border border-[#B08D57]/30">
                <div className="text-[8px] text-[#B08D57]/70 uppercase font-serif tracking-widest">
                  Delegates
                </div>
                <div className="text-xs font-bold font-mono text-[#F5F2EA]">
                  {stats.checkedInCount} / {settings.totalCapacity}
                </div>
              </div>
            )}

            {/* Passes Launcher */}
            {isAuthorizedScanner && (
              <button
                onClick={() => {
                  playClickSound();
                  onOpenTestBadges();
                }}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-[#1a1512] hover:bg-[#241e1a] border border-[#B08D57]/40 text-amber-200 text-xs font-serif tracking-wider transition cursor-pointer shadow-sm"
                title="View Diplomatic Credentials & Badges"
              >
                <Shield className="w-3.5 h-3.5 text-[#B08D57]" />
                <span className="text-[11px] uppercase">Passes</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-none border transition cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-[#181310] border-[#B08D57]/40 text-[#B08D57] hover:text-[#F5F2EA]'
                  : 'bg-red-950/40 border-red-500/40 text-red-400'
              }`}
              title={settings.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            >
              {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* User Profile Dropdown Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-none bg-[#181310] hover:bg-[#221b16] border border-[#B08D57]/50 text-[#F5F2EA] text-xs transition cursor-pointer shadow-sm"
                >
                  <div className="w-5 h-5 rounded-none bg-[#6E4E2E] text-[#F5F2EA] flex items-center justify-center text-[10px] font-serif border border-[#B08D57]/40">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline max-w-[90px] truncate text-[#F5F2EA] font-serif font-medium">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#B08D57]" />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-[#14110f] border border-[#B08D57]/60 rounded-none shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="border-b border-[#B08D57]/20 pb-2 mb-2">
                        <div className="text-[9px] text-[#B08D57] uppercase tracking-wider font-serif">
                          Diplomatic Delegate • {currentRoleMeta?.badge}
                        </div>
                        <div
                          className="text-sm font-bold text-[#F5F2EA] truncate mt-0.5"
                          style={{ fontFamily: "'Cinzel', serif" }}
                        >
                          {currentUser.name}
                        </div>
                        <div className="text-xs text-neutral-400 font-serif truncate">
                          {currentUser.email}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {onReplayIntro && (
                          <button
                            onClick={() => {
                              playClickSound();
                              setShowUserDropdown(false);
                              onReplayIntro();
                            }}
                            className="w-full py-1.5 px-2.5 rounded-none bg-[#1e1814] hover:bg-[#28201a] border border-[#B08D57]/30 text-[#B08D57] text-xs font-serif tracking-wider flex items-center gap-2 transition cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#B08D57]" />
                            <span>Replay Intro</span>
                          </button>
                        )}

                        <button
                          onClick={handleLogout}
                          className="w-full py-1.5 px-2.5 rounded-none bg-[#241212] hover:bg-[#321717] border border-red-900/50 text-red-300 text-xs font-serif tracking-wider flex items-center gap-2 transition cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout Current Session</span>
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
                className="px-3 py-1 bg-[#6E4E2E] hover:bg-[#B08D57] text-[#F5F2EA] font-serif text-xs uppercase tracking-wider transition cursor-pointer shadow-sm"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              onClick={() => {
                playClickSound();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="md:hidden p-2 rounded-none bg-[#181310] hover:bg-[#221b16] border border-[#B08D57]/50 text-[#B08D57] transition cursor-pointer"
              title="Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed top-[53px] right-0 bottom-0 w-72 max-w-[85vw] bg-[#14110f] border-l border-[#B08D57]/40 shadow-2xl p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* User Identity Banner */}
              {currentUser && (
                <div className="p-3 bg-[#1c1613] border border-[#B08D57]/30 rounded-none">
                  <div className="text-[9px] uppercase tracking-wider text-[#B08D57] font-serif">
                    Authenticated Executive
                  </div>
                  <div
                    className="text-sm font-bold text-[#F5F2EA] truncate mt-0.5"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    {currentUser.ticketId || 'MUN-IT-01'}
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              {isAuthorizedScanner && (
                <div className="space-y-1">
                  <div
                    className="text-[10px] uppercase tracking-[0.2em] text-[#B08D57]/70 font-serif mb-2"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    Console Views
                  </div>

                  <button
                    onClick={() => handleNavClick('scanner')}
                    className={`w-full py-2.5 px-3 flex items-center gap-3 text-xs font-serif tracking-wider uppercase transition border ${
                      activeTab === 'scanner'
                        ? 'bg-[#251d18] text-[#B08D57] border-[#B08D57]/60'
                        : 'bg-[#181310] text-neutral-300 border-transparent hover:border-[#B08D57]/30'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-[#B08D57]" />
                    <span>QR & Face Scanner</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className={`w-full py-2.5 px-3 flex items-center gap-3 text-xs font-serif tracking-wider uppercase transition border ${
                      activeTab === 'dashboard'
                        ? 'bg-[#251d18] text-[#B08D57] border-[#B08D57]/60'
                        : 'bg-[#181310] text-neutral-300 border-transparent hover:border-[#B08D57]/30'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#B08D57]" />
                    <span>Live Dashboard</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('guestlist')}
                    className={`w-full py-2.5 px-3 flex items-center gap-3 text-xs font-serif tracking-wider uppercase transition border ${
                      activeTab === 'guestlist'
                        ? 'bg-[#251d18] text-[#B08D57] border-[#B08D57]/60'
                        : 'bg-[#181310] text-neutral-300 border-transparent hover:border-[#B08D57]/30'
                    }`}
                  >
                    <Users className="w-4 h-4 text-[#B08D57]" />
                    <span>Guest Manifest</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('team')}
                    className={`w-full py-2.5 px-3 flex items-center gap-3 text-xs font-serif tracking-wider uppercase transition border ${
                      activeTab === 'team'
                        ? 'bg-[#251d18] text-[#B08D57] border-[#B08D57]/60'
                        : 'bg-[#181310] text-neutral-300 border-transparent hover:border-[#B08D57]/30'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-[#B08D57]" />
                    <span>Security Team</span>
                  </button>
                </div>
              )}

              {/* Action Modals */}
              <div className="space-y-1.5 pt-2 border-t border-[#B08D57]/20">
                <div
                  className="text-[10px] uppercase tracking-[0.2em] text-[#B08D57]/70 font-serif mb-2"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Quick Actions
                </div>

                <button
                  onClick={() => {
                    playClickSound();
                    setMobileMenuOpen(false);
                    onOpenTestBadges();
                  }}
                  className="w-full py-2 px-3 rounded-none bg-[#1a1410] border border-[#B08D57]/30 text-amber-200 text-xs font-serif tracking-wider flex items-center gap-2.5 transition"
                >
                  <Shield className="w-3.5 h-3.5 text-[#B08D57]" />
                  <span>Diplomatic Passes</span>
                </button>

                {onOpenFaceId && (
                  <button
                    onClick={() => {
                      playClickSound();
                      setMobileMenuOpen(false);
                      onOpenFaceId();
                    }}
                    className="w-full py-2 px-3 rounded-none bg-[#1a1410] border border-[#B08D57]/30 text-amber-200 text-xs font-serif tracking-wider flex items-center gap-2.5 transition"
                  >
                    <ScanFace className="w-3.5 h-3.5 text-[#B08D57]" />
                    <span>Face ID Biometric Scan</span>
                  </button>
                )}

                {onReplayIntro && (
                  <button
                    onClick={() => {
                      playClickSound();
                      setMobileMenuOpen(false);
                      onReplayIntro();
                    }}
                    className="w-full py-2 px-3 rounded-none bg-[#1a1410] border border-[#B08D57]/30 text-[#B08D57] text-xs font-serif tracking-wider flex items-center gap-2.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#B08D57]" />
                    <span>Replay Luxury Intro</span>
                  </button>
                )}
              </div>
            </div>

            {/* Logout at bottom of drawer */}
            {currentUser && (
              <div className="pt-4 border-t border-[#B08D57]/20">
                <button
                  onClick={handleLogout}
                  className="w-full py-2 px-3 rounded-none bg-[#241212] hover:bg-[#321717] border border-red-900/50 text-red-300 text-xs font-serif tracking-wider flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout Current Session</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
