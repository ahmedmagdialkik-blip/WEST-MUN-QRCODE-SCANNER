/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VenueProvider, useVenue } from './context/VenueContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ScannerView } from './components/Scanner/ScannerView';
import { DashboardView } from './components/Dashboard/DashboardView';
import { GuestListView } from './components/GuestList/GuestListView';
import { TeamManagementView } from './components/Admin/TeamManagementView';
import { StaffPassScreen } from './components/Pass/StaffPassScreen';
import { TestTicketBadges } from './components/Scanner/TestTicketBadges';
import { ScanFeedbackOverlay } from './components/Scanner/ScanFeedbackOverlay';
import { AuthModal } from './components/Auth/AuthModal';
import { LuxuryIntro } from './components/Intro/LuxuryIntro';
import { ExecutiveLoginPage } from './components/Auth/ExecutiveLoginPage';
import { VoiceWelcomeScreen } from './components/Welcome/VoiceWelcomeScreen';
import { FaceIdModal } from './components/Biometrics/FaceIdModal';
import { isScannerOrAdminRole, StaffMember } from './types/venue';

type AppFlowStage = 'login' | 'welcome' | 'intro' | 'homepage';

function MainVenueContent() {
  const {
    activeTab,
    isAuthenticated,
    currentUser,
    switchAccountFast,
    lastScanResult,
    clearLastScanResult,
  } = useVenue();

  // Track if this is a fresh login (so we know to play Intro after Welcome)
  const [isFreshLogin, setIsFreshLogin] = useState<boolean>(false);

  // Exact Flow Requirements:
  // If NOT logged in:
  //   Website Opens -> Premium Login Page -> Authenticate -> Voice Welcome Screen -> Simple Intro Animation -> Homepage
  // If user IS already logged in:
  //   Website Opens -> Voice Welcome Screen -> Homepage
  // * The homepage should NEVER appear before the welcome screen.
  const [flowStage, setFlowStage] = useState<AppFlowStage>(() => {
    try {
      const isSaved = localStorage.getItem('west_mun_auth_session') === 'authenticated';
      const savedAuthId = localStorage.getItem('west_mun_auth_v10_mozart');
      if (isSaved && savedAuthId) {
        // User already has an authenticated session:
        // Must show Voice Welcome Screen first before homepage!
        return 'welcome';
      }
    } catch {
      // ignore
    }
    return 'login';
  });

  const [isTestBadgesOpen, setIsTestBadgesOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFaceIdOpen, setIsFaceIdOpen] = useState(false);

  // Reset to login if user logs out
  useEffect(() => {
    if (!isAuthenticated && (flowStage === 'homepage' || flowStage === 'welcome')) {
      try {
        localStorage.removeItem('west_mun_auth_session');
      } catch {
        // ignore
      }
      setFlowStage('login');
      setIsFreshLogin(false);
    }
  }, [isAuthenticated, flowStage]);

  // Handle successful authentication from ExecutiveLoginPage
  const handleAuthenticationSuccess = (user: StaffMember) => {
    try {
      localStorage.setItem('west_mun_auth_session', 'authenticated');
    } catch {
      // ignore
    }

    switchAccountFast(user.id);
    setIsFreshLogin(true);

    // Sequence: Authenticate -> Voice Welcome Screen -> Simple Intro -> Homepage
    setFlowStage('welcome');
  };

  // 1. Stage: Premium Login Page (When not authenticated)
  if (flowStage === 'login' || (!isAuthenticated && flowStage !== 'welcome' && flowStage !== 'intro')) {
    return <ExecutiveLoginPage onAuthenticated={handleAuthenticationSuccess} />;
  }

  // 2. Stage: Voice Welcome Screen (Always shown on login or on page open with active session)
  if (flowStage === 'welcome') {
    if (!currentUser) {
      // Fallback safeguard if user state hasn't resolved
      return <ExecutiveLoginPage onAuthenticated={handleAuthenticationSuccess} />;
    }

    return (
      <VoiceWelcomeScreen
        user={currentUser}
        onComplete={() => {
          if (isFreshLogin) {
            // Fresh login: proceed to Simple Intro Animation (2–3s)
            setFlowStage('intro');
          } else {
            // Already logged-in user reopening website: proceed directly to Homepage
            setFlowStage('homepage');
          }
        }}
      />
    );
  }

  // 3. Stage: Simple Minimalist Luxury Intro Animation (2–3s Apple/Rolex style)
  if (flowStage === 'intro') {
    return (
      <LuxuryIntro
        onComplete={() => {
          setIsFreshLogin(false);
          setFlowStage('homepage');
        }}
      />
    );
  }

  // 4. Stage: Homepage (Executive Portal) - Only reached after Welcome Screen!
  const isAuthorizedScanner = currentUser ? isScannerOrAdminRole(currentUser.role) : false;

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#F5F2EA] flex flex-col font-sans selection:bg-[#B08D57]/30 selection:text-[#E5C578] animate-in fade-in duration-500 overflow-x-hidden">
      {/* Handcrafted Diplomatic Header with Mobile Navigation */}
      <Header
        onOpenTestBadges={() => setIsTestBadgesOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onReplayIntro={() => setFlowStage('intro')}
        onOpenFaceId={() => setIsFaceIdOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-3 sm:p-5 overflow-x-hidden">
        {!isAuthorizedScanner ? (
          /* Locked to Staff Pass Screen for non-security/admin roles */
          <StaffPassScreen />
        ) : (
          /* Authorized Security Officers & Admins: Full Scanner & Console Access */
          <>
            {activeTab === 'scanner' && <ScannerView />}
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'guestlist' && <GuestListView />}
            {activeTab === 'team' && <TeamManagementView />}
          </>
        )}
      </main>

      {/* Developer Signature Footer - subtle artist signature (~18% opacity, antique gold) */}
      <footer className="w-full py-4 text-center z-10 select-none pb-24">
        <span
          className="text-[9px] sm:text-[10px] uppercase tracking-[0.28em] italic select-none"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            color: '#B08D57',
            opacity: 0.22,
          }}
        >
          Western Model United Nations • Developed by Ahmed Magdi
        </span>
      </footer>

      {/* Bottom Sticky Navigation: Strictly restricted to Security and Admins (Mobile-friendly) */}
      {isAuthorizedScanner && <BottomNav />}

      {/* Full-Screen Scan Result Audio & Visual Feedback Overlay */}
      {lastScanResult && (
        <ScanFeedbackOverlay
          result={lastScanResult}
          onDismiss={clearLastScanResult}
        />
      )}

      {/* Test Ticket Badges & QR Modal */}
      <TestTicketBadges
        isOpen={isTestBadgesOpen}
        onClose={() => setIsTestBadgesOpen(false)}
      />

      {/* Account Authentication Switcher Modal */}
      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}

      {/* Global Face ID Biometric Check-In Modal */}
      <FaceIdModal
        isOpen={isFaceIdOpen}
        onClose={() => setIsFaceIdOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <VenueProvider>
      <MainVenueContent />
    </VenueProvider>
  );
}
