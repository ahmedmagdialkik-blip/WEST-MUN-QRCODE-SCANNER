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
import { WelcomeGreetingOverlay } from './components/Auth/WelcomeGreetingOverlay';
import { FreshmanWelcomeEasterEgg } from './components/EasterEgg/DanaFreshmanEasterEgg';
import { UnderSecretaryWelcomeEasterEgg } from './components/EasterEgg/UnderSecretaryWelcomeEasterEgg';
import { getAccountEasterEgg } from './utils/easterEggAuth';
import { isScannerOrAdminRole, ROLE_LABELS, StaffMember } from './types/venue';

type AppFlowStage = 'intro' | 'login' | 'freshman_easter_egg' | 'usg_easter_egg' | 'welcome' | 'homepage';

function MainVenueContent() {
  const {
    activeTab,
    isAuthenticated,
    currentUser,
    lastScanResult,
    clearLastScanResult,
  } = useVenue();

  // Website Flow:
  // 1. The West MUN intro animation is the 1st thing that pops up on the website!
  // 2. After intro completes, if already authenticated, show Welcome/Homepage; otherwise show Login Page.
  // 3. User can replay intro at any time from the Header.
  const [flowStage, setFlowStage] = useState<AppFlowStage>('intro');

  const [isTestBadgesOpen, setIsTestBadgesOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Sync state if user logs out
  useEffect(() => {
    if (
      !isAuthenticated &&
      (flowStage === 'homepage' ||
        flowStage === 'welcome' ||
        flowStage === 'freshman_easter_egg' ||
        flowStage === 'usg_easter_egg')
    ) {
      try {
        localStorage.removeItem('west_mun_auth_session');
      } catch {
        // ignore
      }
      setFlowStage('login');
    }
  }, [isAuthenticated, flowStage]);

  // Handle successful login from ExecutiveLoginPage
  const handleAuthenticationSuccess = (user?: StaffMember) => {
    try {
      localStorage.setItem('west_mun_auth_session', 'authenticated');
    } catch {
      // ignore
    }

    const activeUser = user || currentUser;
    const egg = activeUser ? getAccountEasterEgg(activeUser.name) : null;

    if (egg === 'freshman') {
      // Special Freshman welcome animation (Dana Alnajar, Sultana Al Fajar, Naya, Jadiya, Noor)
      setFlowStage('freshman_easter_egg');
    } else if (egg === 'under_secretary') {
      // Special Under Secretary-General fanfare animation (Zain Firas)
      setFlowStage('usg_easter_egg');
    } else {
      // Standard login process for all other users
      setFlowStage('welcome');
    }
  };

  // 1. Stage: West MUN Intro Animation (FIRST screen that pops up on website)
  if (flowStage === 'intro') {
    return (
      <LuxuryIntro
        onComplete={() => {
          if (isAuthenticated && currentUser) {
            setFlowStage('welcome');
          } else {
            setFlowStage('login');
          }
        }}
      />
    );
  }

  // 2. Stage: Executive Multi-User Login Page
  if (
    flowStage === 'login' ||
    (!isAuthenticated &&
      flowStage !== 'welcome' &&
      flowStage !== 'freshman_easter_egg' &&
      flowStage !== 'usg_easter_egg')
  ) {
    return <ExecutiveLoginPage onAuthenticated={handleAuthenticationSuccess} />;
  }

  // Special Easter Egg: Freshman Welcome (Dana Alnajar, Sultana Al Fajar, Naya, Jadiya, Noor)
  if (flowStage === 'freshman_easter_egg') {
    return (
      <FreshmanWelcomeEasterEgg
        displayName={currentUser?.name || 'Freshman'}
        onComplete={() => {
          setFlowStage('homepage');
        }}
      />
    );
  }

  // Special Easter Egg: Under Secretary-General Welcome (Zain Firas)
  if (flowStage === 'usg_easter_egg') {
    return (
      <UnderSecretaryWelcomeEasterEgg
        onComplete={() => {
          setFlowStage('homepage');
        }}
      />
    );
  }

  // 3. Stage: Natural Voice Welcome Greeting Overlay
  if (flowStage === 'welcome') {
    return (
      <WelcomeGreetingOverlay
        displayName={currentUser?.name || 'Diplomatic Delegate'}
        userRole={currentUser ? ROLE_LABELS[currentUser.role]?.title : undefined}
        onComplete={() => {
          setFlowStage('homepage');
        }}
      />
    );
  }

  // 4. Stage: Homepage (Executive Portal)
  const isAuthorizedScanner = currentUser ? isScannerOrAdminRole(currentUser.role) : false;

  return (
    <div
      className="min-h-screen text-[#F7F2EA] flex flex-col font-sans selection:bg-[#c99b58]/30 selection:text-[#e5c578] animate-in fade-in duration-500 overflow-x-hidden"
      style={{
        backgroundColor: '#120b07',
        backgroundImage: `
          radial-gradient(circle at 50% 0%, rgba(61, 40, 28, 0.45) 0%, transparent 60%),
          radial-gradient(circle at 80% 80%, rgba(212, 175, 55, 0.05) 0%, transparent 50%),
          linear-gradient(to bottom, #170f0a 0%, #0e0805 100%)
        `,
      }}
    >
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

      {/* Developer Signature Footer - subtle artist signature (~18% opacity, antique gold) */}
      <footer className="w-full py-4 text-center z-10 select-none pb-24">
        <span
          className="text-[9px] sm:text-[10px] uppercase tracking-[0.28em] italic select-none"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            color: '#B08D57',
            opacity: 0.18,
          }}
        >
          Developed by Ahmed Magdi
        </span>
      </footer>

      {/* Bottom Sticky Navigation: Strictly restricted to Security and Admins */}
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
