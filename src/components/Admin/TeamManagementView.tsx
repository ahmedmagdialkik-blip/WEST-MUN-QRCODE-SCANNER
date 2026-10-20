import React, { useState } from 'react';
import { useVenue } from '../../context/VenueContext';
import { StaffMember, StaffRole, ROLE_LABELS, isScannerOrAdminRole } from '../../types/venue';
import { DeploymentGuideModal } from './DeploymentGuideModal';
import { OnboardingCredentialsModal } from './OnboardingCredentialsModal';
import { BatchCredentialsModal } from './BatchCredentialsModal';
import { DepartmentTeamView } from './DepartmentTeamView';
import {
  ShieldCheck,
  UserPlus,
  Key,
  DoorOpen,
  Sliders,
  Trash2,
  Check,
  X,
  Volume2,
  Vibrate,
  RotateCcw,
  Lock,
  Crown,
  Eye,
  EyeOff,
  Filter,
  Search,
  Copy,
  Printer,
  RefreshCw,
  Sparkles,
  FileText,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { playClickSound, playSuccessChime, playWarningBuzzer } from '../../utils/audio';

export const TeamManagementView: React.FC = () => {
  const {
    staffMembers,
    currentUser,
    addStaffMember,
    updateStaffMember,
    removeStaffMember,
    resetStaffPassword,
    generateNewStaffPassword,
    settings,
    updateSettings,
    loadSampleData,
  } = useVenue();

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);
  const [isBatchCredentialsOpen, setIsBatchCredentialsOpen] = useState(false);
  const [selectedMemberForCredentials, setSelectedMemberForCredentials] = useState<StaffMember | null>(null);

  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [teamViewMode, setTeamViewMode] = useState<'department_delegation' | 'all_credentials'>('department_delegation');

  // New staff form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [password, setPassword] = useState('1000');
  const [role, setRole] = useState<StaffRole>('volunteers');
  const [assignedGate, setAssignedGate] = useState('MUN Venue');
  const [accessKey, setAccessKey] = useState(String(Math.floor(1000 + Math.random() * 9000)));

  // Venue Settings state
  const [venueName, setVenueName] = useState(settings.venueName);
  const [currentEventName, setCurrentEventName] = useState(settings.currentEventName);
  const [totalCapacity, setTotalCapacity] = useState(settings.totalCapacity);
  const [warningCapacity, setWarningCapacity] = useState(settings.warningCapacityPercentage);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isHR = currentUser?.role === 'hr';
  const isSecurity = currentUser?.role === 'security';
  const isIT = currentUser?.role === 'it';

  // Security, IT, Super Admin, and HR have clearance to view everyone's username and password
  const canViewCredentials = isSecurity || isIT || isSuperAdmin || isHR;
  const isAdmin = canViewCredentials;
  const canAddStaff = true;

  const [revealAllPasswords, setRevealAllPasswords] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastNotification({ type, text });
    setTimeout(() => setToastNotification(null), 3500);
  };

  const togglePasswordVisibility = (id: string) => {
    playClickSound();
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickCopyCredentials = (staff: StaffMember) => {
    playClickSound();
    const roleTitle = staff.customTitle || ROLE_LABELS[staff.role]?.title || staff.role;
    const pwd = staff.password || staff.accessKey || '344';
    const text = `WEST MUN CREDENTIAL • Member: ${staff.name} | Role: ${roleTitle} | Username: ${staff.name} | Password: ${pwd} | Badge: ${staff.ticketId || ''}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(staff.id);
      playSuccessChime();
      showToast('success', `Copied login credentials for ${staff.name}`);
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {
      setCopiedId(staff.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const handleQuickGeneratePin = (staff: StaffMember) => {
    playClickSound();
    const isAhmed = staff.id === 'staff-it-ahmed' || staff.name.toLowerCase().trim() === 'ahmed magdi';
    if (isAhmed) {
      playWarningBuzzer();
      showToast('error', "Ahmed Magdi's password is fixed to 344 by executive policy and cannot be altered.");
      return;
    }

    const res = generateNewStaffPassword(staff.id);
    if (res.success && res.newPassword) {
      playSuccessChime();
      showToast('success', `New 4-digit PIN generated for ${staff.name}: ${res.newPassword}`);
    } else {
      playWarningBuzzer();
      showToast('error', res.error || 'Failed to generate PIN.');
    }
  };

  const openAddStaffModal = (defaultRole?: StaffRole) => {
    playClickSound();
    setName('');
    setEmail('');
    let initialRole: StaffRole = 'volunteers';
    if (defaultRole) {
      initialRole = defaultRole;
    } else if (roleFilter !== 'all' && (roleFilter in ROLE_LABELS)) {
      initialRole = roleFilter as StaffRole;
    }
    setRole(initialRole);
    setCustomTitle(ROLE_LABELS[initialRole]?.title || '');
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    setAccessKey(pin);
    setPassword(pin);
    setAssignedGate('MUN Venue');
    setIsAddStaffOpen(true);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      showToast('error', 'Please enter a name for the member.');
      return;
    }

    // Use the EXACT role picked by the user in the form modal
    const assignedRole: StaffRole = role;
    const canScan = isScannerOrAdminRole(assignedRole);
    const pin = accessKey.trim() || String(Math.floor(1000 + Math.random() * 9000));
    const generatedTicketId = `MUN-STAFF-${assignedRole.toUpperCase()}-${pin}`;
    const roleTitle = customTitle.trim() || ROLE_LABELS[assignedRole]?.title || assignedRole;

    const emailToUse =
      email.trim() ||
      `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@westmun.org`;

    addStaffMember({
      name: cleanName,
      email: emailToUse,
      password: pin,
      role: assignedRole,
      customTitle: roleTitle,
      accessKey: pin,
      ticketId: generatedTicketId,
      assignedGate: assignedGate.trim() || 'MUN Venue',
      canScan,
      canManualCheckIn: canScan,
      canRevokeCheckIn: canScan,
      canManageStaff: canScan,
      canExportData: true,
      isActive: true,
      lastActiveTime: new Date().toISOString(),
    });

    playSuccessChime();
    showToast('success', `Added ${cleanName} as ${roleTitle} (${ROLE_LABELS[assignedRole]?.title || assignedRole}) - PIN: ${pin}`);

    // Reset filters and search so the new member is immediately visible at the top
    setRoleFilter('all');
    setSearchQuery('');
    setName('');
    setEmail('');
    setCustomTitle('');
    setIsAddStaffOpen(false);
  };

  const handleSaveVenueSettings = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    updateSettings({
      venueName,
      currentEventName,
      totalCapacity: Number(totalCapacity),
      warningCapacityPercentage: Number(warningCapacity),
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const filteredStaff = staffMembers.filter((staff) => {
    if (roleFilter !== 'all' && staff.role !== roleFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = staff.name.toLowerCase().includes(q);
      const matchEmail = staff.email.toLowerCase().includes(q);
      const matchRole = (staff.customTitle || staff.role).toLowerCase().includes(q);
      const matchTicket = (staff.ticketId || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchRole || matchTicket;
    }

    return true;
  });

  return (
    <div className="space-y-4 text-[#F5F2EA] pb-16">
      {/* Toast Notification */}
      {toastNotification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 shadow-lg border text-xs font-serif flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200 ${
            toastNotification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/60'
              : 'bg-red-950/90 text-red-200 border-red-500/60'
          }`}
        >
          {toastNotification.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toastNotification.text}</span>
        </div>
      )}

      {/* Leadership Mode Switcher: Department Team vs All Credentials */}
      <div className="flex items-center justify-center gap-2 max-w-md mx-auto mb-1">
        <button
          type="button"
          onClick={() => {
            playClickSound();
            setTeamViewMode('department_delegation');
          }}
          className={`flex-1 py-2 px-3 text-xs uppercase font-serif tracking-wider transition border cursor-pointer flex items-center justify-center gap-1.5 ${
            teamViewMode === 'department_delegation'
              ? 'bg-[#261d17] text-[#D4AF37] border-[#B08D57] font-bold shadow-md'
              : 'bg-[#140f0c] text-neutral-400 border-[#B08D57]/30 hover:text-[#F5F2EA]'
          }`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <Crown className="w-3.5 h-3.5 text-[#B08D57]" />
          <span>Department Team & Roles</span>
        </button>
        <button
          type="button"
          onClick={() => {
            playClickSound();
            setTeamViewMode('all_credentials');
          }}
          className={`flex-1 py-2 px-3 text-xs uppercase font-serif tracking-wider transition border cursor-pointer flex items-center justify-center gap-1.5 ${
            teamViewMode === 'all_credentials'
              ? 'bg-[#261d17] text-[#D4AF37] border-[#B08D57] font-bold shadow-md'
              : 'bg-[#140f0c] text-neutral-400 border-[#B08D57]/30 hover:text-[#F5F2EA]'
          }`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <Key className="w-3.5 h-3.5 text-[#B08D57]" />
          <span>All Passwords & PINs</span>
        </button>
      </div>

      {teamViewMode === 'department_delegation' ? (
        <DepartmentTeamView />
      ) : (
        <>
          {/* Header bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#B08D57]/30 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="text-lg sm:text-xl font-bold tracking-wider text-[#F5F2EA] uppercase font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Executive Administration & Passwords
            </h1>
            <span className="text-[10px] px-2 py-0.5 bg-[#221a15] text-[#D4AF37] border border-[#B08D57]/40 font-mono">
              {staffMembers.length} Registered Members
            </span>
          </div>
          <p
            className="text-xs text-[#B08D57]/80 font-serif mt-0.5"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Manage accredited 4-digit passwords, onboarding credentials, and conference security clearances
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Security and IT Master Reveal All Passwords Toggle */}
          {canViewCredentials && (
            <button
              onClick={() => {
                playClickSound();
                setRevealAllPasswords(!revealAllPasswords);
              }}
              className={`px-3 py-1.5 text-xs font-serif tracking-wider flex items-center gap-1.5 transition cursor-pointer border shadow-sm ${
                revealAllPasswords
                  ? 'bg-[#6d4825] text-[#e5c578] border-[#c99b58]'
                  : 'bg-[#1b120c] hover:bg-[#281b12] text-[#c99b58] hover:text-[#e5c578] border-[#a87944]/60'
              }`}
            >
              {revealAllPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#e5c578]" />}
              <span>{revealAllPasswords ? 'Mask Passwords' : '👁️ Reveal All Passwords'}</span>
            </button>
          )}

          {/* Batch Print All Passes */}
          <button
            onClick={() => {
              playClickSound();
              setIsBatchCredentialsOpen(true);
            }}
            className="px-3 py-1.5 bg-[#1b120c] hover:bg-[#281b12] text-[#d4af37] hover:text-[#F7F2EA] text-xs font-serif tracking-wider flex items-center gap-1.5 transition cursor-pointer border border-[#c99b58]/60 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-[#c99b58]" />
            <span>Print All {staffMembers.length} Passes</span>
          </button>

          {canAddStaff && (
            <button
              onClick={() => openAddStaffModal()}
              className="px-3 py-1.5 bg-[#6E4E2E] hover:bg-[#B08D57] text-[#120f0d] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-sm border border-[#B08D57]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <UserPlus className="w-3.5 h-3.5 text-[#120f0d]" />
              <span>Add Member</span>
            </button>
          )}

          <button
            onClick={() => {
              playClickSound();
              setIsDeployGuideOpen(true);
            }}
            className="px-2.5 py-1.5 bg-[#181310] hover:bg-[#251e19] text-[#B08D57] hover:text-[#F5F2EA] text-xs font-serif tracking-wider flex items-center gap-1.5 transition cursor-pointer border border-[#B08D57]/40"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#B08D57]" />
            <span className="hidden sm:inline">Deployment Guide</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#14100e] border border-[#B08D57]/40 p-3 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member by name, role, or ticket ID..."
              className="w-full bg-[#0d0a08] border border-[#B08D57]/40 pl-8 pr-3 py-1.5 text-xs text-[#F5F2EA] focus:outline-none focus:border-[#B08D57] font-serif placeholder:text-[#B08D57]/40"
            />
            <Search className="w-3.5 h-3.5 text-[#B08D57]/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs text-[#B08D57]/70 font-serif flex items-center gap-2 self-end sm:self-center">
            <span>Showing <strong className="text-[#D4AF37]">{filteredStaff.length}</strong> of {staffMembers.length} members</span>
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-serif">
          {[
            'all',
            'it',
            'security',
            'super_admin',
            'executive',
            'marketing',
            'designers',
            'media_and_press',
            'volunteers',
            'logistics',
            'pr',
            'hr',
            'ceremonies',
            'dcc',
          ].map((r) => (
            <button
              key={r}
              onClick={() => {
                playClickSound();
                setRoleFilter(r);
              }}
              className={`px-3 py-1 text-xs tracking-wider uppercase transition cursor-pointer whitespace-nowrap border ${
                roleFilter === r
                  ? 'bg-[#6E4E2E] text-[#F5F2EA] border-[#B08D57]'
                  : 'bg-[#181310] text-[#B08D57]/70 border-[#B08D57]/20 hover:text-[#B08D57]'
              }`}
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {r === 'all' ? 'All Roles' : r === 'it' ? 'IT' : r.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Cards List */}
      <div className="space-y-2.5">
        {filteredStaff.map((staff) => {
          const roleMeta = ROLE_LABELS[staff.role];
          const isRevealed = revealedPasswords[staff.id];
          const canScan = staff.canScan;
          const isAhmedMagdi = staff.id === 'staff-it-ahmed' || staff.name.toLowerCase().trim() === 'ahmed magdi';
          const passwordValue = staff.password || staff.accessKey || '344';

          const canRemove =
            staff.id !== currentUser?.id &&
            !isAhmedMagdi &&
            isAdmin;

          return (
            <div
              key={staff.id}
              className={`p-3 sm:p-4 border transition-all duration-150 ${
                staff.id === currentUser?.id
                  ? 'bg-[#181310] border-[#B08D57] shadow-md'
                  : 'bg-[#14100e] border-[#B08D57]/30 hover:border-[#B08D57]/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left Info Column */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm sm:text-base font-bold text-[#F5F2EA] truncate tracking-wide"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {staff.name}
                    </span>

                    {/* Official Designated Title Badge */}
                    <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 bg-[#221a15] text-[#E5C578] border border-[#B08D57]/50 font-serif">
                      {staff.customTitle || roleMeta?.title || staff.role}
                    </span>

                    {isAdmin && !isAhmedMagdi ? (
                      <select
                        value={staff.role}
                        onChange={(e) => {
                          const newRole = e.target.value as StaffRole;
                          const newTitle = ROLE_LABELS[newRole]?.title || newRole;
                          updateStaffMember(staff.id, {
                            role: newRole,
                            customTitle: staff.customTitle && staff.customTitle !== roleMeta?.title ? staff.customTitle : newTitle,
                          });
                          playSuccessChime();
                          showToast('success', `Updated ${staff.name}'s department to ${newTitle}`);
                        }}
                        className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-[#17120e] text-[#B08D57] border border-[#B08D57]/30 font-serif cursor-pointer hover:border-[#D4AF37] focus:outline-none"
                        title="Click to reassign this member's department"
                      >
                        <option value="volunteers">Volunteers</option>
                        <option value="media_and_press">Media & Press</option>
                        <option value="dcc">DCC</option>
                        <option value="marketing">Marketing</option>
                        <option value="designers">Design</option>
                        <option value="executive">Executive Board</option>
                        <option value="logistics">Logistics</option>
                        <option value="pr">Public Relations</option>
                        <option value="hr">HR</option>
                        <option value="ceremonies">Ceremonies</option>
                        <option value="security">Security (Scanner Authorized)</option>
                        <option value="it">IT & Systems (Scanner Authorized)</option>
                      </select>
                    ) : null}

                    {canScan ? (
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-serif">
                        Scanner Authorized
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-[#1e1713] text-[#B08D57]/70 border border-[#B08D57]/30 font-serif">
                        Pass Holder
                      </span>
                    )}

                    {staff.id === currentUser?.id && (
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#6E4E2E] text-[#120f0d] font-serif"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        Active Session
                      </span>
                    )}

                    {isAhmedMagdi && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#B08D57]/20 text-[#D4AF37] border border-[#B08D57]/60 font-serif">
                        ⭐ Admin of IT (PIN: 344)
                      </span>
                    )}
                  </div>

                  {/* Metadata and Credentials Row */}
                  <div className="text-xs text-neutral-400 mt-1.5 flex items-center gap-2 flex-wrap font-serif">
                    <span className="text-[#B08D57] font-mono text-[11px]">{staff.email}</span>
                    <span>•</span>
                    <span className="font-mono text-[#D4AF37] text-[11px] bg-[#0d0a08] px-2 py-0.5 border border-[#B08D57]/30">
                      {staff.ticketId}
                    </span>
                    <span>•</span>
                    <span className="text-[11px] text-neutral-300">{staff.assignedGate || 'MUN Venue'}</span>

                    {/* Credential Box for Security & IT */}
                    {canViewCredentials && (
                      <div className="w-full mt-2 p-2.5 bg-[#120a06] border border-[#a87944]/50 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                          {/* Username */}
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-[#a87944] font-serif block font-bold">
                              Login Username
                            </span>
                            <span className="font-mono font-bold text-[#F7F2EA] text-xs select-all">
                              {staff.name}
                            </span>
                          </div>

                          <div className="hidden sm:block h-6 w-[1px] bg-[#a87944]/30" />

                          {/* 4-Digit Password */}
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-[#a87944] font-serif block font-bold">
                              {isAhmedMagdi ? 'Password (Fixed 344)' : '4-Digit Password'}
                            </span>
                            <span className="font-mono font-bold text-[#e5c578] text-sm tracking-widest select-all">
                              {(revealAllPasswords || isRevealed) ? passwordValue : '••••'}
                            </span>
                          </div>
                        </div>

                        {/* Quick Reveal and Copy Actions */}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(staff.id)}
                            className="px-2 py-1 bg-[#1c120c] hover:bg-[#281b12] text-[#c99b58] hover:text-[#e5c578] border border-[#a87944]/40 text-[11px] font-serif flex items-center gap-1 transition cursor-pointer"
                            title={(revealAllPasswords || isRevealed) ? 'Hide Password' : 'Show Password'}
                          >
                            {(revealAllPasswords || isRevealed) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{(revealAllPasswords || isRevealed) ? 'Hide' : 'Reveal'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickCopyCredentials(staff)}
                            className="px-2 py-1 bg-[#1c120c] hover:bg-[#281b12] text-[#F7F2EA] border border-[#a87944]/40 text-[11px] font-serif flex items-center gap-1 transition cursor-pointer"
                            title="Copy username and password"
                          >
                            {copiedId === staff.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#c99b58]" />}
                            <span>{copiedId === staff.id ? 'Copied ✓' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center flex-wrap">
                  {/* Onboarding Credentials Modal Button */}
                  <button
                    onClick={() => {
                      playClickSound();
                      setSelectedMemberForCredentials(staff);
                    }}
                    className="px-2.5 py-1.5 bg-[#1b1512] hover:bg-[#251d18] text-[#F5F2EA] border border-[#B08D57]/50 text-xs font-serif flex items-center gap-1 transition cursor-pointer"
                    title="View onboarding credentials card & print slip"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#B08D57]" />
                    <span>Pass & Credentials</span>
                  </button>

                  {/* One-Click Copy Credentials */}
                  <button
                    onClick={() => handleQuickCopyCredentials(staff)}
                    className="p-1.5 bg-[#17120e] hover:bg-[#221b14] text-[#B08D57] hover:text-[#F5F2EA] border border-[#B08D57]/30 text-xs transition cursor-pointer"
                    title="Copy delegate username and password"
                  >
                    {copiedId === staff.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Quick Random 4-Digit Password (if admin and not Ahmed Magdi) */}
                  {isAdmin && !isAhmedMagdi && (
                    <button
                      onClick={() => handleQuickGeneratePin(staff)}
                      className="px-2 py-1.5 bg-[#1f1712] hover:bg-[#2d211a] text-[#D4AF37] border border-[#B08D57]/40 text-xs font-serif flex items-center gap-1 transition cursor-pointer"
                      title="Generate a new random 4-digit password"
                    >
                      <RefreshCw className="w-3 h-3 text-[#B08D57]" />
                      <span className="hidden md:inline">New PIN</span>
                    </button>
                  )}

                  {canRemove && (
                    <button
                      onClick={() => {
                        playClickSound();
                        removeStaffMember(staff.id);
                        showToast('success', `Removed ${staff.name}`);
                      }}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition cursor-pointer"
                      title="Remove Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Venue Capacity & Event Config */}
      <div className="bg-[#14100e] border border-[#B08D57]/40 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#B08D57]/20 pb-2">
          <Sliders className="w-4 h-4 text-[#B08D57]" />
          <div>
            <h2
              className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F5F2EA] font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Venue Parameters & Safety Thresholds
            </h2>
          </div>
        </div>

        <form onSubmit={handleSaveVenueSettings} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-serif text-[#B08D57] mb-1">Venue Name</label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full bg-[#0d0a08] border border-[#B08D57]/40 px-3 py-2 text-xs text-[#F5F2EA] focus:outline-none focus:border-[#B08D57] font-serif"
              />
            </div>

            <div>
              <label className="block text-xs font-serif text-[#B08D57] mb-1">Current Event Name</label>
              <input
                type="text"
                value={currentEventName}
                onChange={(e) => setCurrentEventName(e.target.value)}
                className="w-full bg-[#0d0a08] border border-[#B08D57]/40 px-3 py-2 text-xs text-[#F5F2EA] focus:outline-none focus:border-[#B08D57] font-serif"
              />
            </div>

            <div>
              <label className="block text-xs font-serif text-[#B08D57] mb-1">
                Total Venue Capacity Limit
              </label>
              <input
                type="number"
                min="10"
                max="50000"
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(Number(e.target.value))}
                className="w-full bg-[#0d0a08] border border-[#B08D57]/40 px-3 py-2 text-xs font-mono text-[#D4AF37] focus:outline-none focus:border-[#B08D57]"
              />
            </div>

            <div>
              <label className="block text-xs font-serif text-[#B08D57] mb-1">
                Warning Threshold (%)
              </label>
              <input
                type="number"
                min="50"
                max="99"
                value={warningCapacity}
                onChange={(e) => setWarningCapacity(Number(e.target.value))}
                className="w-full bg-[#0d0a08] border border-[#B08D57]/40 px-3 py-2 text-xs font-mono text-[#D4AF37] focus:outline-none focus:border-[#B08D57]"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#B08D57]/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-serif text-neutral-300">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                  className="rounded-none text-[#B08D57]"
                />
                <Volume2 className="w-3.5 h-3.5 text-[#B08D57]" />
                <span>Audio</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-serif text-neutral-300">
                <input
                  type="checkbox"
                  checked={settings.vibrationEnabled}
                  onChange={(e) => updateSettings({ vibrationEnabled: e.target.checked })}
                  className="rounded-none text-[#B08D57]"
                />
                <Vibrate className="w-3.5 h-3.5 text-[#B08D57]" />
                <span>Vibration</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              {settingsSaved && (
                <span className="text-xs text-emerald-400 font-serif flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-[#6E4E2E] hover:bg-[#B08D57] text-[#120f0d] text-xs font-bold font-serif uppercase tracking-wider transition cursor-pointer border border-[#B08D57]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Save Parameters
              </button>
            </div>
          </div>
        </form>
      </div>
      </>
      )}

      {/* Add Member Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#14100e] border border-[#B08D57] w-full max-w-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#B08D57]/30 pb-2">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#B08D57]" />
                <h3
                  className="text-sm font-bold uppercase tracking-wider text-[#F5F2EA] font-serif"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Onboard Accredited Member
                </h3>
              </div>
              <button
                onClick={() => setIsAddStaffOpen(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-serif text-[#B08D57] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full bg-[#0d0a08] border border-[#B08D57]/40 px-3 py-2 text-xs text-[#F5F2EA] focus:outline-none focus:border-[#B08D57] font-serif"
                />
              </div>

              <div>
                <label className="block text-xs font-serif text-[#B08D57] mb-1">
                  Official Email <span className="text-neutral-500 font-sans font-normal text-[10px]">(optional — auto-generates if blank)</span>
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. elena.rostova@westmun.org (or leave blank to auto-generate)"
                  className="w-full bg-[#0d0a08] border border-[#B08D57]/40 px-3 py-2 text-xs text-[#F5F2EA] focus:outline-none focus:border-[#B08D57] font-serif"
                />
              </div>

              <div>
                <label className="block text-xs font-serif text-[#B08D57] mb-1">
                  Unique 4-Digit Password
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={accessKey}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setAccessKey(digits);
                      setPassword(digits);
                    }}
                    placeholder="e.g. 5821"
                    className="flex-1 bg-[#0d0a08] border border-[#B08D57]/40 px-3 py-2 text-xs font-mono text-[#D4AF37] focus:outline-none focus:border-[#B08D57] tracking-widest text-center"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const pin = String(Math.floor(1000 + Math.random() * 9000));
                      setAccessKey(pin);
                      setPassword(pin);
                    }}
                    className="px-2.5 py-2 bg-[#1b1512] hover:bg-[#251d18] text-[#B08D57] text-xs font-serif border border-[#B08D57]/30 transition"
                  >
                    🎲 Random
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif text-[#B08D57] mb-1">Department / Role</label>
                <select
                  value={role}
                  onChange={(e) => {
                    const newRole = e.target.value as StaffRole;
                    setRole(newRole);
                    if (!customTitle || customTitle === ROLE_LABELS[role]?.title) {
                      setCustomTitle(ROLE_LABELS[newRole]?.title || '');
                    }
                  }}
                  className="w-full bg-[#0d0a08] border border-[#B08D57]/40 px-3 py-2 text-xs text-[#F5F2EA] focus:outline-none focus:border-[#B08D57] font-serif cursor-pointer"
                >
                  <option value="volunteers">Volunteers (Pass Holder)</option>
                  <option value="media_and_press">Media & Press (Pass Holder)</option>
                  <option value="dcc">DCC (Pass Holder)</option>
                  <option value="marketing">Marketing (Pass Holder)</option>
                  <option value="designers">Design (Pass Holder)</option>
                  <option value="executive">Executive Board (Pass Holder)</option>
                  <option value="logistics">Logistics (Pass Holder)</option>
                  <option value="pr">Public Relations (Pass Holder)</option>
                  <option value="hr">Human Resources (HR) (Pass Holder)</option>
                  <option value="ceremonies">Ceremonies (Pass Holder)</option>
                  <option value="security">Security (Scanner Authorized)</option>
                  <option value="it">IT & Systems (Scanner Authorized)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-serif text-[#B08D57]">Exact Role Title (Badge & Display)</label>
                  <span className="text-[10px] text-[#A89F91] font-serif">e.g. Head of Media & Press, Co-Head DCC</span>
                </div>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Head of Media & Press, Co-Head DCC"
                  className="w-full bg-[#0d0a08] border border-[#B08D57]/40 px-3 py-2 text-xs text-[#E5C578] placeholder-[#6E5D4A] focus:outline-none focus:border-[#B08D57] font-serif"
                />
              </div>

              <div>
                <label className="block text-xs font-serif text-[#B08D57] mb-1">Assigned Gate / Station</label>
                <input
                  type="text"
                  value={assignedGate}
                  onChange={(e) => setAssignedGate(e.target.value)}
                  placeholder="e.g. Diplomatic Chamber"
                  className="w-full bg-[#0d0a08] border border-[#B08D57]/40 px-3 py-2 text-xs text-[#F5F2EA] focus:outline-none focus:border-[#B08D57] font-serif"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#B08D57]/20">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-3 py-1.5 bg-[#181310] text-[#B08D57] hover:text-[#F5F2EA] text-xs font-serif"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#6E4E2E] hover:bg-[#B08D57] text-[#120f0d] font-bold text-xs uppercase tracking-wider font-serif border border-[#B08D57]"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Save Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Onboarding Credentials Modal */}
      {selectedMemberForCredentials && (
        <OnboardingCredentialsModal
          member={selectedMemberForCredentials}
          isOpen={!!selectedMemberForCredentials}
          onClose={() => setSelectedMemberForCredentials(null)}
          onResetPassword={resetStaffPassword}
          onGenerateNewPassword={generateNewStaffPassword}
        />
      )}

      {/* Batch All 32 Passes Modal */}
      {isBatchCredentialsOpen && (
        <BatchCredentialsModal
          staffMembers={staffMembers}
          isOpen={isBatchCredentialsOpen}
          onClose={() => setIsBatchCredentialsOpen(false)}
        />
      )}

      {/* Deployment Guide Modal */}
      {isDeployGuideOpen && (
        <DeploymentGuideModal
          isOpen={isDeployGuideOpen}
          onClose={() => setIsDeployGuideOpen(false)}
        />
      )}
    </div>
  );
};
