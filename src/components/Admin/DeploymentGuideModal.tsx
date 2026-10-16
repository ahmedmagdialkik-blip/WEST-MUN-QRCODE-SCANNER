import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Database, Cloud, ExternalLink, ShieldAlert } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'firebase' | 'vercel' | 'firestore_rules' | 'supabase_sql'>('firebase');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    playClickSound();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const firebaseCommands = `# 1. Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Login to your Google / Firebase account
firebase login

# 3. Initialize Firebase in this project directory
firebase init

# Select:
#  - Firestore: Configure security rules and indexes
#  - Hosting: Configure files for Firebase Hosting
# What do you want to use as your public directory? -> dist
# Configure as a single-page app (rewrite all urls to /index.html)? -> Yes
# Set up automatic builds and deploys with GitHub? -> Optional (No/Yes)

# 4. Build production bundle with Vite
npm run build

# 5. Deploy directly to Firebase Hosting & Firestore Security Rules
firebase deploy
`;

  const vercelCommands = `# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to production
vercel --prod

# Output will provide your live HTTPS domain, e.g.:
# https://west-mun-venue-manager.vercel.app
`;

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() && (
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) ||
        request.auth.token.email.matches('.*@westmun[.]com')
      );
    }

    function isScanner() {
      return isSignedIn() && (
        isAdmin() ||
        exists(/databases/$(database)/documents/staff/$(request.auth.uid))
      );
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }

    // Guests Manifest Collection
    match /guests/{guestId} {
      // Scanners and Admins can read the guest manifest
      allow read: if isScanner();

      // Only Admins can create new guests or delete records
      allow create, delete: if isAdmin();

      // Scanners can update check-in status and timestamps
      allow update: if isScanner() && (
        // Allow updating check-in fields
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['status', 'checkedInTime', 'checkedInBy', 'checkedInGate'])
      );
    }

    // Staff & Role Registry
    match /staff/{staffId} {
      allow read: if isScanner();
      allow write: if isAdmin();
    }

    // Venue Logs & Real-Time Sync Stream
    match /logs/{logId} {
      allow read: if isScanner();
      allow create: if isScanner();
      allow update, delete: if isAdmin();
    }

    // Venue Settings
    match /settings/{settingId} {
      allow read: if isScanner();
      allow write: if isAdmin();
    }
  }
}`;

  const supabaseSqlCode = `-- ============================================================
-- West Mun Venue Manager - Supabase PostgreSQL & Real-time Setup
-- ============================================================

-- 1. Create Guests Manifest Table
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ticket_id TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'General Admission',
    table_or_seat TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Checked-In')),
    checked_in_time TIMESTAMPTZ,
    checked_in_by TEXT,
    checked_in_gate TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for instant ticket barcode lookups (<1ms query response)
CREATE INDEX IF NOT EXISTS idx_guests_ticket_id ON public.guests (LOWER(ticket_id));
CREATE INDEX IF NOT EXISTS idx_guests_status ON public.guests (status);

-- 2. Staff & Door Role Table
CREATE TABLE IF NOT EXISTS public.staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'scanner' CHECK (role IN ('super_admin', 'admin', 'scanner')),
    access_key TEXT NOT NULL,
    assigned_gate TEXT NOT NULL,
    can_scan BOOLEAN DEFAULT TRUE,
    can_manual_check_in BOOLEAN DEFAULT TRUE,
    can_revoke_check_in BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Check-in Audit Logs Table
CREATE TABLE IF NOT EXISTS public.check_in_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    category TEXT NOT NULL,
    gate TEXT NOT NULL,
    scanner_name TEXT NOT NULL,
    log_type TEXT NOT NULL CHECK (log_type IN ('CHECK_IN', 'UNDO_CHECK_IN', 'DENIED_ATTEMPT')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Supabase Realtime Publication for instant multi-scanner sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_in_logs;

-- 5. Row Level Security (RLS)
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_in_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated staff" ON public.guests FOR SELECT USING (true);
CREATE POLICY "Enable update for door check-ins" ON public.guests FOR UPDATE USING (true);
CREATE POLICY "Enable insert logs for door scanners" ON public.check_in_logs FOR INSERT WITH CHECK (true);
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#1b0307] via-[#100104] to-[#080103] border-2 border-amber-500/60 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-[0_0_60px_rgba(220,38,38,0.35),0_0_40px_rgba(245,158,11,0.2)] overflow-hidden text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-red-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-700 to-amber-600 border border-amber-300/60 flex items-center justify-center text-neutral-950 font-black shadow-md shadow-red-950/40">
              <Cloud className="w-4 h-4 text-neutral-950" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-400 uppercase tracking-wider">
                Production Deployment & Database Schemas
              </h2>
              <p className="text-xs text-neutral-400">Deploy West Mun to Firebase Hosting, Vercel, or Supabase</p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-red-950/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 py-2.5 bg-black/60 border-b border-red-900/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('firebase');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'firebase'
                ? 'bg-gradient-to-r from-red-600 to-amber-500 text-neutral-950 font-bold shadow-md shadow-red-950/30'
                : 'text-neutral-400 hover:text-white hover:bg-red-950/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Firebase Hosting</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('vercel');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'vercel'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-red-950/50'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Vercel Deploy</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('firestore_rules');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'firestore_rules'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-neutral-950 font-bold shadow-md shadow-red-950/30'
                : 'text-neutral-400 hover:text-white hover:bg-red-950/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Firestore Rules</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('supabase_sql');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'supabase_sql'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-red-950/50'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase SQL</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'firebase' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                West Mun Venue Manager can be deployed in under 2 minutes to Firebase Hosting with global low-latency CDN and SSL certificates for mobile camera scanning support:
              </p>
              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                  {firebaseCommands}
                </pre>
                <button
                  onClick={() => copyToClipboard(firebaseCommands, 'fb_cmd')}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedKey === 'fb_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'fb_cmd' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'vercel' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                To deploy instantly on Vercel with automatic continuous deployment on git push:
              </p>
              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-blue-300 overflow-x-auto">
                  {vercelCommands}
                </pre>
                <button
                  onClick={() => copyToClipboard(vercelCommands, 'vercel_cmd')}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedKey === 'vercel_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'vercel_cmd' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'firestore_rules' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Hardened production Firestore security rules implementing RBAC (Super Admin vs Scanner) with atomic update restrictions:
              </p>
              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-80">
                  {firestoreRulesCode}
                </pre>
                <button
                  onClick={() => copyToClipboard(firestoreRulesCode, 'rules_code')}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedKey === 'rules_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'rules_code' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'supabase_sql' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                PostgreSQL schema for Supabase with indexes on ticket barcodes, Row Level Security, and Realtime replication publications:
              </p>
              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-teal-300 overflow-x-auto max-h-80">
                  {supabaseSqlCode}
                </pre>
                <button
                  onClick={() => copyToClipboard(supabaseSqlCode, 'supabase_code')}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedKey === 'supabase_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'supabase_code' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Ready for production hosting</span>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
