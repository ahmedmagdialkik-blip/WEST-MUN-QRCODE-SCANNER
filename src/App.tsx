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
import { VoiceWelcomeScreen } from './components/Welcome/VoiceWelcomeScreen';
import { ExecutivePortalLogin } from './components/auth/ExecutivePortalLogin';
import { EnrolledUser } from './auth/types';
import { isScannerOrAdminRole, StaffMember, ROLE_LABELS } from './types/venue';

type AppFlowStage = 'login' | 'welcome' | 'intro' | 'homepage';

function MainVenueContent() {
  const {
    activeTab,
    isAuthenticated,
    currentUser,
    switchAccountFast,
    loginAsStaffMember,
    lastScanResult,
    clearLastScanResult,
    staffMembers,
  } = useVenue();

  const [isFreshLogin, setIsFreshLogin] = useState<boolean>(false);

  // Flow Stages: login -> welcome -> intro -> homepage
  const [flowStage, setFlowStage] = useState<AppFlowStage>(() => {
    try {
      const isSaved = localStorage.getItem('west_mun_auth_session') === 'authenticated';
      const savedAuthId = localStorage.getItem('west_mun_auth_v10_mozart');
      if (isSaved && savedAuthId) {
        return 'welcome';
      }
    } catch {
      // ignore
    }
    return 'login';
  });

  const [isTestBadgesOpen, setIsTestBadgesOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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

  // Handle successful multi-user authentication (QR Code, Email, or Face ID)
  const handleAuthenticationSuccess = (user: EnrolledUser) => {
    try {
      localStorage.setItem('west_mun_auth_session', 'authenticated');
    } catch {
      // ignore
    }

    const cleanEmail = (user.email || '').toLowerCase().trim();
    const cleanName = (user.fullName || '').toLowerCase().trim();

    // Dynamically match specific user profile
    const foundStaff = staffMembers.find((s) => {
      return (
        s.id === user.id ||
        (cleanEmail && s.email.toLowerCase() === cleanEmail) ||
        (cleanName && s.name.toLowerCase() === cleanName)
      );
    });

    if (foundStaff) {
      loginAsStaffMember(foundStaff);
    } else {
      // Create session for authenticated user
      const canScan = isScannerOrAdminRole(user.role);
      const newStaff: StaffMember = {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role || 'executive',
        customTitle: user.role ? ROLE_LABELS[user.role]?.title : 'Diplomatic Delegate',
        assignedGate: 'MUN Venue',
        ticketId: user.ticketId || `MUN-${(user.role || 'EXEC').substring(0, 3).toUpperCase()}-01`,
        accessKey: '1000',
        canScan,
        canManualCheckIn: canScan,
        canRevokeCheckIn: canScan,
        canManageStaff: canScan,
        canExportData: true,
        isActive: true,
        lastActiveTime: new Date().toISOString(),
      };
      loginAsStaffMember(newStaff);
    }

    setIsFreshLogin(true);
    // Sequence: Authenticate -> Personalized Welcome Screen -> Intro -> Homepage
    setFlowStage('welcome');
  };

  // 1. Stage: Executive Portal Authentication Screen (Default Email, Face ID on demand, QR Code)
  if (flowStage === 'login' || (!isAuthenticated && flowStage !== 'welcome' && flowStage !== 'intro')) {
    return <ExecutivePortalLogin onAuthenticated={handleAuthenticationSuccess} />;
  }

  // 2. Stage: Executive Welcome Screen (Silent, animated text only)
  if (flowStage === 'welcome') {
    if (!currentUser) {
      return <ExecutivePortalLogin onAuthenticated={handleAuthenticationSuccess} />;
    }

    return (
      <VoiceWelcomeScreen
        user={currentUser}
        onComplete={() => {
          if (isFreshLogin) {
            // Fresh login: proceed to Intro Animation (2–3s)
            setFlowStage('intro');
          } else {
            // Already logged in: proceed directly to Homepage
            setFlowStage('homepage');
          }
        }}
      />
    );
  }

  // 3. Stage: Luxury Intro Animation (with clear "Developed by Ahmed Magdi" signature)
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

  // 4. Stage: Homepage (Executive Portal) - Only reached after authentication & welcome!
  const isAuthorizedScanner = currentUser ? isScannerOrAdminRole(currentUser.role) : false;

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#F5F2EA] flex flex-col font-sans selection:bg-[#B08D57]/30 selection:text-[#E5C578] animate-in fade-in duration-500 overflow-x-hidden">
      {/* Handcrafted Diplomatic Header */}
      <Header
        onOpenTestBadges={() => setIsTestBadgesOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onReplayIntro={() => setFlowStage('intro')}
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

      {/* Developer Signature Footer */}
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

      {/* Bottom Sticky Navigation: Strictly restricted to Security and Admins */}
      {isAuthorizedScanner && <BottomNav />}

      {/* Full-Screen Scan Result Feedback */}
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
