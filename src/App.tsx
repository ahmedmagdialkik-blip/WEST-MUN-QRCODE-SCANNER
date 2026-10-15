/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { isScannerOrAdminRole } from './types/venue';

function MainVenueContent() {
  const {
    activeTab,
    isAuthenticated,
    currentUser,
    lastScanResult,
    clearLastScanResult,
  } = useVenue();

  const [isTestBadgesOpen, setIsTestBadgesOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // USER REQUIREMENT: You must login with an account beforehand!
  if (!isAuthenticated || !currentUser) {
    return <AuthModal />;
  }

  // Security & Admins have the ability to scan and access management consoles.
  // Everyone else just has their official QR Pass Screen and cannot access other parts.
  const isAuthorizedScanner = isScannerOrAdminRole(currentUser.role);

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans selection:bg-amber-400 selection:text-neutral-950">
      {/* Black & Gold MUN Venue Header */}
      <Header
        onOpenTestBadges={() => setIsTestBadgesOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto">
        {!isAuthorizedScanner ? (
          /* Locked to Staff Pass Screen: Non-security/admin cannot access Scanner, Dashboard, Guest List, or Admin */
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
      {isAuthOpen && <AuthModal />}
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
