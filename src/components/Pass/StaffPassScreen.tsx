/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * StaffPassScreen: Diplomatic Credential Pass & Leadership Console
 *
 * Allows non-scanner roles (Heads, Co-Heads, and Staff Members) to:
 * - View their verified diplomatic QR access credential
 * - Heads & Co-Heads: seamlessly view who is on their team and assign specific roles to the people under them
 */

import React, { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { useVenue } from '../../context/VenueContext';
import { ROLE_LABELS } from '../../types/venue';
import { DepartmentTeamView } from '../Admin/DepartmentTeamView';
import { isHeadOrCoHead } from '../../utils/teamHierarchy';
import {
  Shield,
  ShieldCheck,
  Building2,
  MapPin,
  CheckCircle2,
  Copy,
  Check,
  LogOut,
  Lock,
  RefreshCw,
  Crown,
  Users,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';
import officialLogoUrl from '../../assets/images/west_mun_logo_official.jpg';

interface StaffPassScreenProps {
  initialTab?: 'pass' | 'team';
}

export const StaffPassScreen: React.FC<StaffPassScreenProps> = ({ initialTab = 'pass' }) => {
  const {
    currentUser,
    guests,
    logout,
    switchAccountFast,
    staffMembers,
    activeTab,
    setActiveTab,
    tasks,
    completeTask,
  } = useVenue();

  const isLeader = useMemo(() => isHeadOrCoHead(currentUser), [currentUser]);

  // Tasks assigned to this current logged in user
  const myTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter((t) => t.assigneeIds.includes(currentUser.id));
  }, [tasks, currentUser]);

  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Tab state between Pass and Team (for Heads & Co-Heads)
  const [screenTab, setScreenTab] = useState<'pass' | 'team'>(() => {
    if (activeTab === 'team' && isLeader) return 'team';
    return initialTab;
  });

  // Sync if activeTab changes externally
  useEffect(() => {
    if (activeTab === 'team' && isLeader) {
      setScreenTab('team');
    }
  }, [activeTab, isLeader]);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [liveTime, setLiveTime] = useState<string>('');

  const roleMeta = currentUser ? ROLE_LABELS[currentUser.role] : null;

  const staffTicketCode =
    currentUser?.ticketId ||
    `MUN-STAFF-${currentUser?.role.toUpperCase()}-${currentUser?.accessKey || '0000'}`;

  const guestRecord = useMemo(() => {
    if (!currentUser) return null;
    return guests.find(
      (g) =>
        (g.ticketId && staffTicketCode && g.ticketId.toLowerCase().trim() === staffTicketCode.toLowerCase().trim()) ||
        (g.ticketId && currentUser.ticketId && g.ticketId.toLowerCase().trim() === currentUser.ticketId.toLowerCase().trim()) ||
        (g.id && (g.id === currentUser.id || g.id === `g-staff-${currentUser.id}` || g.id === `g-${currentUser.id}`)) ||
        (g.name && currentUser.name && g.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim())
    );
  }, [guests, currentUser, staffTicketCode]);

  const isCheckedIn = guestRecord?.status === 'Checked-In';
  const hasLeft = guestRecord?.status === 'Left';

  // Count team members in this department
  const teamCount = useMemo(() => {
    if (!currentUser) return 0;
    return staffMembers.filter((s) => s.role === currentUser.role).length;
  }, [staffMembers, currentUser]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(staffTicketCode, {
      width: 400,
      margin: 2,
      color: {
        dark: '#120f0d',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR code for staff pass:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [staffTicketCode]);

  const copyCode = () => {
    playClickSound();
    navigator.clipboard?.writeText(staffTicketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTabSwitch = (tab: 'pass' | 'team') => {
    playClickSound();
    setScreenTab(tab);
    if (tab === 'team') {
      setActiveTab('team');
    }
  };

  // If leadership console view is selected, render DepartmentTeamView
  if (isLeader && screenTab === 'team') {
    return (
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3">
        {/* Leadership Tab Navigation Bar */}
        <div className="flex items-center justify-center gap-2 mb-4 max-w-md mx-auto">
          <button
            onClick={() => handleTabSwitch('pass')}
            className="flex-1 py-2 px-3 text-xs uppercase font-serif tracking-wider transition border bg-[#140f0c] text-neutral-400 border-[#B08D57]/30 hover:text-[#F5F2EA] flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <Shield className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>Diplomatic Pass</span>
          </button>
          <button
            onClick={() => handleTabSwitch('team')}
            className="flex-1 py-2 px-3 text-xs uppercase font-serif tracking-wider transition border bg-[#241c16] text-[#D4AF37] border-[#B08D57] font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <Users className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>My Team & Roles ({teamCount})</span>
          </button>
        </div>

        <DepartmentTeamView
          onBackToPass={() => handleTabSwitch('pass')}
          showBackToPassButton={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] px-3 sm:px-4 py-4 flex flex-col items-center justify-start pb-20 select-none text-[#F5F2EA]">
      {/* Leadership Tab Switcher for Heads & Co-Heads */}
      {isLeader && (
        <div className="flex items-center justify-center gap-2 mb-4 w-full max-w-sm">
          <button
            onClick={() => handleTabSwitch('pass')}
            className="flex-1 py-2 px-3 text-xs uppercase font-serif tracking-wider transition border bg-[#241c16] text-[#D4AF37] border-[#B08D57] font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <Shield className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>Diplomatic Pass</span>
          </button>
          <button
            onClick={() => handleTabSwitch('team')}
            className="flex-1 py-2 px-3 text-xs uppercase font-serif tracking-wider transition border bg-[#140f0c] text-neutral-400 border-[#B08D57]/30 hover:text-[#F5F2EA] flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <Users className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>My Team & Roles ({teamCount})</span>
          </button>
        </div>
      )}

      {/* Leadership Access Highlight Banner */}
      {isLeader ? (
        <div className="w-full max-w-sm mb-4 p-3 bg-[#181310] border border-[#B08D57] shadow-lg flex items-start gap-2.5">
          <Crown className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
          <div className="text-left text-xs leading-relaxed font-serif">
            <span
              className="font-bold text-[#F5F2EA] block"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Department Leadership Authorized
            </span>
            <span className="text-neutral-300 text-[11px]">
              You are recognized as <strong className="text-[#D4AF37]">{currentUser?.customTitle || 'Department Head'}</strong>.
              You have access to view everyone on your team and assign specific operational roles.
            </span>
          </div>
        </div>
      ) : (
        /* Top Security Restriction Banner for regular delegates */
        <div className="w-full max-w-sm mb-4 p-3 bg-[#161210] border border-[#B08D57]/40 flex items-start gap-2.5 shadow-md">
          <Lock className="w-4 h-4 text-[#B08D57] shrink-0 mt-0.5" />
          <div className="text-left text-xs leading-relaxed font-serif">
            <span
              className="font-bold text-[#F5F2EA] block"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Diplomatic Credential Pass
            </span>
            <span className="text-neutral-300 text-[11px]">
              Your account ({roleMeta?.title}) provides entrance clearance. Scanner consoles are restricted to{' '}
              <strong className="text-[#B08D57]">Security & IT Administrators</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Main Handcrafted Staff Badge Card */}
      <div className="w-full max-w-sm bg-[#161311] border border-[#B08D57]/70 p-5 shadow-2xl relative text-center">
        {/* Medieval Corner Accents */}
        <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-[#B08D57]/70" />
        <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-[#B08D57]/70" />
        <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-[#B08D57]/70" />
        <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-[#B08D57]/70" />

        {/* Live Watermark Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#B08D57]/20 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-sm overflow-hidden border border-[#B08D57]/40">
              <img
                src={officialLogoUrl}
                alt="West MUN"
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className="text-xs font-bold tracking-widest text-[#B08D57] uppercase font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              WEST MUN
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0f0c0a] border border-[#B08D57]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-[#D4AF37] font-semibold">
              LIVE {liveTime}
            </span>
          </div>
        </div>

        {/* Staff Identity Header */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-14 h-14 rounded-full bg-[#201813] border border-[#B08D57] flex items-center justify-center mb-2 shadow-sm relative">
            <span
              className="text-xl font-bold text-[#F5F2EA] font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {currentUser?.name?.charAt(0) || 'D'}
            </span>
            {isLeader && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#33251c] border border-[#B08D57] flex items-center justify-center text-[10px]">
                👑
              </span>
            )}
          </div>

          <h2
            className="text-lg font-bold tracking-wide text-[#F5F2EA] font-serif mb-0.5"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {currentUser?.name}
          </h2>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#201814] border border-[#B08D57]/40 text-[#B08D57] text-xs font-serif mt-0.5">
            <Shield className="w-3 h-3 text-[#B08D57]" />
            <span>{currentUser?.customTitle || roleMeta?.title}</span>
            <span>•</span>
            <span className="text-[10px] font-mono">{roleMeta?.badge}</span>
          </div>
        </div>

        {/* QR Code Presentation Box */}
        <div className="relative mx-auto bg-white p-3 rounded-none border-2 border-[#B08D57] shadow-lg w-[200px] h-[200px] flex items-center justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Official Access QR Code"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-800">
              <RefreshCw className="w-6 h-6 animate-spin text-[#B08D57] mb-1" />
              <span className="text-xs font-serif">Generating Pass...</span>
            </div>
          )}
        </div>

        {/* Ticket ID & Copy Action */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="font-mono text-xs font-bold text-[#D4AF37] bg-[#0d0a08] px-3 py-1 border border-[#B08D57]/40">
            {staffTicketCode}
          </span>
          <button
            onClick={copyCode}
            className="p-1.5 bg-[#181310] hover:bg-[#251e19] border border-[#B08D57]/40 text-[#B08D57] transition cursor-pointer"
            title="Copy Pass Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Current Door Status */}
        <div className="mt-4 pt-3 border-t border-[#B08D57]/20 flex flex-col gap-1.5 text-xs font-serif">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Current Status:</span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                isCheckedIn ? 'text-emerald-400' : hasLeft ? 'text-amber-400' : 'text-[#B08D57]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCheckedIn ? 'bg-emerald-400 animate-pulse' : hasLeft ? 'bg-amber-400' : 'bg-neutral-500'
                }`}
              />
              <span className="font-bold tracking-wide">
                {isCheckedIn
                  ? 'Entry Approved'
                  : hasLeft
                  ? 'Departed (Re-entry Allowed)'
                  : 'Pending Scan'}
              </span>
            </span>
          </div>

          {/* If checked in, display verified scan timestamp and security staff */}
          {isCheckedIn && (
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono bg-[#110d0a] px-2.5 py-1.5 border border-emerald-500/30">
              <span className="text-emerald-400 font-serif">✓ Verified by:</span>
              <span className="text-neutral-200 truncate max-w-[190px]">
                {guestRecord?.checkedInBy || 'Security Officer'}
                {guestRecord?.checkedInTime
                  ? ` • ${new Date(guestRecord.checkedInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : ''}
              </span>
            </div>
          )}
        </div>

        {/* Direct Action Button to My Team for Heads & Co-Heads */}
        {isLeader && (
          <button
            onClick={() => handleTabSwitch('team')}
            className="w-full mt-4 py-2.5 px-3 bg-[#261d17] hover:bg-[#382b22] border border-[#B08D57] text-[#D4AF37] text-xs font-serif uppercase tracking-widest flex items-center justify-center gap-2 transition cursor-pointer shadow-lg font-bold"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <Users className="w-4 h-4 text-[#B08D57]" />
            <span>View Team Roster & Assign Roles ({teamCount}) →</span>
          </button>
        )}
      </div>

      {/* Assigned Tasks & Directives Section for Team Members */}
      {myTasks.length > 0 && (
        <div className="w-full max-w-sm mt-4 bg-[#161311] border border-[#B08D57]/60 p-4 shadow-xl text-left">
          <div className="flex items-center justify-between pb-2 border-b border-[#B08D57]/30 mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              <h3
                className="text-xs uppercase font-bold text-[#F5F2EA] font-serif tracking-wider"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                My Assigned Tasks
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#201813] border border-[#B08D57]/40 text-[#D4AF37]">
              {myTasks.filter((t) => t.status === 'completed').length} / {myTasks.length} Done
            </span>
          </div>

          <div className="space-y-2.5">
            {myTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className={`p-3 border transition-all ${
                    isCompleted
                      ? 'bg-[#121a14] border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                      : 'bg-[#1b1511] border-[#B08D57]/40 hover:border-[#B08D57]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 font-serif font-bold ${
                            isCompleted
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                              : task.priority === 'urgent'
                              ? 'bg-red-950/80 text-red-300 border border-red-700/50'
                              : task.priority === 'high'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-700/50'
                              : 'bg-[#261d17] text-[#D4AF37] border border-[#B08D57]/40'
                          }`}
                        >
                          {isCompleted ? '✓ Completed' : `${task.priority || 'Normal'} Priority`}
                        </span>
                        {task.dueDate && (
                          <span className="text-[9px] text-neutral-400 font-mono">
                            Due: {task.dueDate}
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-xs font-bold leading-snug ${
                          isCompleted ? 'text-emerald-300 line-through' : 'text-[#F5F2EA]'
                        }`}
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        {task.title}
                      </h4>

                      <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                        {task.description}
                      </p>

                      <div className="mt-2 text-[10px] text-neutral-400 flex items-center gap-1 font-serif">
                        <span>Assigned by</span>
                        <strong className="text-[#D4AF37]">{task.assignerName}</strong>
                        {task.assignerRole && <span>({task.assignerRole})</span>}
                      </div>

                      {isCompleted && task.completedBy && (
                        <div className="mt-1 text-[10px] text-emerald-400 font-serif flex items-center gap-1">
                          <span>✓ Completed by {task.completedBy.name}</span>
                          {task.completedAt && (
                            <span className="text-neutral-500 font-mono text-[9px]">
                              • {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isCompleted && (
                    <button
                      onClick={() => {
                        if (completingTaskId) return;
                        setCompletingTaskId(task.id);
                        playClickSound();
                        completeTask(task.id, {
                          id: currentUser?.id || 'staff',
                          name: currentUser?.name || 'Staff Member',
                        });
                        setTimeout(() => setCompletingTaskId(null), 400);
                      }}
                      disabled={completingTaskId === task.id}
                      className="w-full mt-2.5 py-1.5 px-3 bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-500/80 text-emerald-200 text-xs font-serif tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 font-bold shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{completingTaskId === task.id ? 'Updating...' : 'Mark as Completed'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
