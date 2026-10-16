import React, { useState } from 'react';
import { useVenue } from '../../context/VenueContext';
import { StaffMember, StaffRole, ROLE_LABELS, isScannerOrAdminRole } from '../../types/venue';
import { DeploymentGuideModal } from './DeploymentGuideModal';
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
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

export const TeamManagementView: React.FC = () => {
  const {
    staffMembers,
    currentUser,
    addStaffMember,
    updateStaffMember,
    removeStaffMember,
    settings,
    updateSettings,
    loadSampleData,
  } = useVenue();

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // New staff form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('gold2026');
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

  const canAddStaff = isSuperAdmin || isHR || isSecurity || isIT;

  const togglePasswordVisibility = (id: string) => {
    playClickSound();
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddStaffModal = (defaultRole?: StaffRole) => {
    playClickSound();
    if (isIT) {
      setRole('it');
    } else if (isSecurity) {
      setRole('security');
    } else if (defaultRole) {
      setRole(defaultRole);
    } else {
      setRole('security');
    }
    setAccessKey(String(Math.floor(1000 + Math.random() * 9000)));
    setIsAddStaffOpen(true);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const assignedRole: StaffRole = isIT ? 'it' : isSecurity ? 'security' : role;
    const canScan = isScannerOrAdminRole(assignedRole);
    const pin = accessKey.trim() || String(Math.floor(1000 + Math.random() * 9000));
    const generatedTicketId = `MUN-STAFF-${assignedRole.toUpperCase()}-${pin}`;

    addStaffMember({
      name: name.trim(),
      email: email.trim(),
      password: password.trim() || 'gold2026',
      role: assignedRole,
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

    playClickSound();
    setName('');
    setEmail('');
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
    if (roleFilter === 'all') return true;
    return staff.role === roleFilter;
  });

  return (
    <div className="space-y-4 text-[#F5F2EA] pb-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#B08D57]/30 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="text-lg sm:text-xl font-bold tracking-wider text-[#F5F2EA] uppercase font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Executive Administration
            </h1>
            <span className="text-[10px] px-2 py-0.5 bg-[#221a15] text-[#B08D57] border border-[#B08D57]/40 font-mono">
              {staffMembers.length} Accounts
            </span>
          </div>
          <p
            className="text-xs text-[#B08D57]/80 font-serif mt-0.5"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Manage team assignments, credential passes, and security authorizations
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

      {/* Role Filter Tabs */}
      <div className="bg-[#14100e] border border-[#B08D57]/40 p-3 space-y-2 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-serif">
          {[
            'all',
            'it',
            'security',
            'super_admin',
            'executive',
            'secretary',
            'marketing',
            'designers',
            'media_and_press',
            'volunteers',
            'logistics',
            'pr',
            'hr',
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

      {/* Staff Cards List (Mobile responsive, no horizontal scroll) */}
      <div className="space-y-2.5">
        {filteredStaff.map((staff) => {
          const roleMeta = ROLE_LABELS[staff.role];
          const isRevealed = revealedPasswords[staff.id];
          const canScan = staff.canScan;

          const canRemove =
            staff.id !== currentUser?.id &&
            (isSuperAdmin ||
              (isIT && staff.role === 'it') ||
              (isSecurity && staff.role === 'security'));

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
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm sm:text-base font-bold text-[#F5F2EA] truncate tracking-wide"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {staff.name}
                    </span>

                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-[#221a15] text-[#B08D57] border border-[#B08D57]/40 font-serif">
                      {roleMeta?.title || staff.role}
                    </span>

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

                    {staff.id === 'staff-it-ahmed' && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#B08D57]/20 text-[#D4AF37] border border-[#B08D57]/60 font-serif">
                        ⭐ Admin of IT
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-400 mt-1.5 flex items-center gap-2 flex-wrap font-serif">
                    <span className="text-[#B08D57]">{staff.email}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-[#F5F2EA]/90 flex items-center gap-1 bg-[#0d0a08] px-2 py-0.5 border border-[#B08D57]/30">
                      <Lock className="w-3 h-3 text-[#B08D57]" />
                      <span>
                        Pass:{' '}
                        {staff.id === 'staff-it-ahmed' && currentUser?.id !== 'staff-it-ahmed'
                          ? '[CONFIDENTIAL]'
                          : isRevealed
                          ? staff.password || '344'
                          : '••••••••'}
                      </span>
                      {(staff.id !== 'staff-it-ahmed' || currentUser?.id === 'staff-it-ahmed') && (
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(staff.id)}
                          className="ml-1 text-neutral-400 hover:text-[#B08D57]"
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      )}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[#D4AF37] text-[11px]">{staff.ticketId}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {canRemove && (
                    <button
                      onClick={() => {
                        playClickSound();
                        removeStaffMember(staff.id);
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
