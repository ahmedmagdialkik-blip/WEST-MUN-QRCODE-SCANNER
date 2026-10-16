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
import { FaceIdModal } from './components/Biometrics/FaceIdModal';
import { isScannerOrAdminRole } from './types/venue';

type AppFlowStage = 'login' | 'intro' | 'homepage';

function MainVenueContent() {
  const {
    activeTab,
    isAuthenticated,
    currentUser,
    switchAccountFast,
    lastScanResult,
    clearLastScanResult,
  } = useVenue();

  // Authentication Flow Requirements:
  // If NOT authenticated: Login Page -> Face Recognition -> Simple Intro -> Homepage
  // If IS authenticated: Homepage (skip intro and login)
  // Store authentication using localStorage
  // Do not replay the intro unless the user logs out and signs in again
  const [flowStage, setFlowStage] = useState<AppFlowStage>(() => {
    try {
      const isSaved = localStorage.getItem('west_mun_auth_session') === 'authenticated';
      const savedAuthId = localStorage.getItem('west_mun_auth_v9_redgold');
      if (isSaved && savedAuthId) {
        return 'homepage';
      }
    } catch {
      // ignore
    }
    return 'login';
  });

  const [isTestBadgesOpen, setIsTestBadgesOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFaceIdOpen, setIsFaceIdOpen] = useState(false);

  // Sync state if user logs out
  useEffect(() => {
    if (!isAuthenticated && flowStage === 'homepage') {
      try {
        localStorage.removeItem('west_mun_auth_session');
      } catch {
        // ignore
      }
      setFlowStage('login');
    }
  }, [isAuthenticated, flowStage]);

  // Handle successful login (from real facial recognition or manual pass)
  const handleAuthenticationSuccess = () => {
    try {
      localStorage.setItem('west_mun_auth_session', 'authenticated');
      localStorage.setItem('west_mun_auth_v9_redgold', 'staff-it-ahmed');
    } catch {
      // ignore
    }

    // Authenticate as Ahmed Magdi (Head of IT & Security Systems)
    switchAccountFast('staff-it-ahmed');

    // Proceed to simple luxury intro (2–3 seconds Apple/Rolex style)
    setFlowStage('intro');
  };

  // 1. Stage: Executive Login Page with Real Facial Recognition
  if (flowStage === 'login' || (!isAuthenticated && flowStage !== 'intro')) {
    return <ExecutiveLoginPage onAuthenticated={handleAuthenticationSuccess} />;
  }

  // 2. Stage: Simple Luxury Intro Animation (2–3s)
  if (flowStage === 'intro') {
    return (
      <LuxuryIntro
        onComplete={() => {
          setFlowStage('homepage');
        }}
      />
    );
  }

  // 3. Stage: Homepage (Executive Portal)
  const isAuthorizedScanner = currentUser ? isScannerOrAdminRole(currentUser.role) : false;

  return (
    <div className="min-h-screen bg-[#0e0c0a] text-[#F5F2EA] flex flex-col font-sans selection:bg-amber-900 selection:text-amber-200 animate-in fade-in duration-500 overflow-x-hidden">
      {/* Handcrafted Diplomatic Header with Mobile Hamburger Menu */}
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
            fontFamily: "'Cormorant Garamond', 'Cardo', serif",
            color: '#B08D57',
            opacity: 0.18,
          }}
        >
          Developed by Ahmed Magdi
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
