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
  Cloud,
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

  // IT and Security have the ability to add members to their team; Super Admin & HR can add to all
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

    // Enforce role boundaries for IT and Security
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
      assignedGate: 'MUN Venue',
      canScan,
      canManualCheckIn: canScan,
      canRevokeCheckIn: canScan,
      canManageStaff: ['super_admin', 'hr', 'security', 'it'].includes(assignedRole),
      canExportData: ['super_admin', 'it', 'security', 'marketing', 'secretary', 'doc_department', 'pr'].includes(assignedRole),
      isActive: true,
      lastActiveTime: new Date().toISOString(),
    });

    playClickSound();
    setIsAddStaffOpen(false);
    setName('');
    setEmail('');
    setPassword('gold2026');
    setAccessKey(String(Math.floor(1000 + Math.random() * 9000)));
  };

  const handleSaveVenueSettings = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    updateSettings({
      venueName: venueName.trim(),
      currentEventName: currentEventName.trim(),
      totalCapacity: Number(totalCapacity) || 1200,
      warningCapacityPercentage: Number(warningCapacity) || 85,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const filteredStaff =
    roleFilter === 'all'
      ? staffMembers
      : staffMembers.filter((s) => s.role === roleFilter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6 pb-28 text-white">
      <DeploymentGuideModal isOpen={isDeployGuideOpen} onClose={() => setIsDeployGuideOpen(false)} />

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-gradient-to-b from-neutral-900 to-black border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-200">
                    {isIT ? 'Add IT Team Member' : isSecurity ? 'Add Security Member' : 'Add Staff Member'}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    {isIT
                      ? 'Provision scanner credentials for a new IT team member'
                      : isSecurity
                      ? 'Provision scanner credentials for a new Security officer'
                      : 'Create staff credentials and official venue pass'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddStaffOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-amber-200/90 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder={isIT ? 'e.g. Youssef IT' : isSecurity ? 'e.g. Mostafa Security' : 'e.g. Layan Ahmed'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-200/90 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder={isIT ? 'e.g. youssef.it@munvenue.org' : isSecurity ? 'e.g. mostafa.sec@munvenue.org' : 'e.g. staff@munvenue.org'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-200/90 mb-1">Account Password *</label>
                <input
                  type="text"
                  required
                  placeholder="Set account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-200/90 mb-1">Department Role</label>
                  {isIT ? (
                    <div className="w-full bg-neutral-900 border border-amber-500/40 rounded-xl px-2.5 py-2 text-xs text-amber-300 font-bold">
                      IT & Technical (Scanner)
                    </div>
                  ) : isSecurity ? (
                    <div className="w-full bg-neutral-900 border border-amber-500/40 rounded-xl px-2.5 py-2 text-xs text-amber-300 font-bold">
                      Security (Scanner & Door)
                    </div>
                  ) : (
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as StaffRole)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-400"
                    >
                      <optgroup label="Door Scanners (Security & IT Only)">
                        <option value="security">Security (Scanner & Door Access)</option>
                        <option value="it">IT & Technical (Scanner & Controls)</option>
                        <option value="super_admin">Secretary General (Super Admin)</option>
                      </optgroup>
                      <optgroup label="Pass Holders (Personal QR Pass Screen)">
                        <option value="executive">Executive Board & Leadership (Executive Pass)</option>
                        <option value="secretary">Secretariat (Secretariat Pass)</option>
                        <option value="marketing">Marketing (Marketing Pass)</option>
                        <option value="designers">Design (Design Team Pass)</option>
                        <option value="media_and_press">Media & Press (Press Pass)</option>
                        <option value="volunteers">Volunteers (Staff Pass)</option>
                        <option value="logistics">Logistics (Logistics Pass)</option>
                        <option value="pr">Public Relations (VIP Liaison Pass)</option>
                        <option value="hr">Human Resources (HR Pass)</option>
                        <option value="ceremonies">Ceremonies (Ceremonies Pass)</option>
                        <option value="dcc">DCC (DCC Pass)</option>
                        <option value="doc_department">Documentation (Staff Pass)</option>
                      </optgroup>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-200/90 mb-1">Quick Door PIN</label>
                  <input
                    type="text"
                    required
                    placeholder="4-digit PIN"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-200/90 mb-1">Venue Gate Assignment</label>
                <input
                  type="text"
                  placeholder="MUN Venue"
                  value={assignedGate}
                  onChange={(e) => setAssignedGate(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  {isIT ? 'Add to IT Team' : isSecurity ? 'Add to Security Team' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Header & Role Information */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Crown className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              MUN Venue Staff & Team Management
            </h1>
          </div>
          <p className="text-xs text-neutral-400">
            Only <strong className="text-amber-300 font-semibold">Security and IT</strong> are authorized to scan. IT and Security can add members to their team.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canAddStaff && (
            <button
              onClick={() => openAddStaffModal()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isIT ? '+ Add IT Member' : isSecurity ? '+ Add Security Member' : '+ Add Staff'}</span>
            </button>
          )}

          <button
            onClick={() => {
              playClickSound();
              setIsDeployGuideOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-neutral-900 border border-amber-500/40 hover:border-amber-400 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md shadow-amber-500/10"
          >
            <Cloud className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Deployment</span>
          </button>
        </div>
      </div>

      {/* Dedicated Team Card for IT / Security / Admin */}
      {(isIT || isSecurity) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-neutral-950 to-neutral-900 border border-amber-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-200">
                  {isIT ? 'IT & Technical Team Portal' : 'Security Door Access Portal'}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SCANNER & TEAM MGMT
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5">
                You have active door camera scanner rights and the ability to add fellow members to the{' '}
                <strong className="text-amber-300 font-bold">{isIT ? 'IT' : 'Security'}</strong> team.
              </p>
            </div>
          </div>
          <button
            onClick={() => openAddStaffModal(isIT ? 'it' : 'security')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md shrink-0 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member to {isIT ? 'IT' : 'Security'} Team</span>
          </button>
        </div>
      )}

      {/* Section 1: Staff & Department Directory */}
      <div className="bg-gradient-to-b from-neutral-950 to-black border border-amber-500/35 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-200">Department Roster & Credentials</h2>
              <p className="text-[11px] text-neutral-400">
                Official staff accounts with designated roles written for each member
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-amber-400 bg-black px-2.5 py-1 rounded-lg border border-neutral-800">
              Total Staff: {staffMembers.length}
            </span>
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-1">
          <span className="text-[10px] text-amber-400/80 uppercase font-bold mr-1">Filter:</span>
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
            'ceremonies',
            'dcc',
          ].map((r) => (
            <button
              key={r}
              onClick={() => {
                playClickSound();
                setRoleFilter(r);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize whitespace-nowrap transition cursor-pointer ${
                roleFilter === r
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {r === 'all' ? 'All Roles' : r === 'it' ? 'IT' : r.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Staff Table / Cards */}
        <div className="space-y-2.5">
          {filteredStaff.map((staff) => {
            const roleMeta = ROLE_LABELS[staff.role];
            const isRevealed = revealedPasswords[staff.id];
            const canScan = staff.canScan;

            // IT members can remove IT members (except themselves)
            // Security members can remove Security members (except themselves)
            // Super Admin can remove anyone (except themselves)
            const canRemove =
              staff.id !== currentUser?.id &&
              (isSuperAdmin ||
                (isIT && staff.role === 'it') ||
                (isSecurity && staff.role === 'security'));

            return (
              <div
                key={staff.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  staff.id === currentUser?.id
                    ? 'bg-neutral-950 border-amber-400/60 ring-1 ring-amber-500/30'
                    : 'bg-neutral-950/80 border-neutral-800/90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">{staff.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {roleMeta?.title || staff.role}
                      </span>
                      {canScan ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Scanner Active
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                          Pass Only
                        </span>
                      )}
                      {staff.id === currentUser?.id && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500 text-neutral-950">
                          You
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-400 mt-1.5 flex items-center gap-2 flex-wrap">
                      <span>{staff.email}</span>
                      <span>•</span>
                      {/* Password reveal */}
                      <span className="text-amber-300 font-mono flex items-center gap-1 bg-black px-2 py-0.5 rounded border border-neutral-800">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Password: {isRevealed ? (staff.password || 'gold2026') : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(staff.id)}
                          className="ml-1 text-neutral-400 hover:text-amber-400 cursor-pointer"
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </span>
                      <span>•</span>
                      <span className="text-neutral-300 font-mono">PIN: {staff.accessKey}</span>
                      <span>•</span>
                      <span className="text-amber-400/90 font-mono text-[11px]">{staff.ticketId}</span>
                    </p>

                    <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
                      <DoorOpen className="w-3 h-3 text-neutral-500" />
                      <span>Assigned Gate: {staff.assignedGate}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Scan status indicator */}
                    <div
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                        canScan
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${canScan ? 'bg-amber-400' : 'bg-neutral-600'}`} />
                      <span>{canScan ? 'Can Scan' : 'Pass Holder'}</span>
                    </div>

                    {canRemove && (
                      <button
                        onClick={() => {
                          playClickSound();
                          removeStaffMember(staff.id);
                        }}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-950/40 transition cursor-pointer"
                        title="Remove Team Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Venue Capacity & Event Config */}
      <div className="bg-gradient-to-b from-neutral-950 to-black border border-amber-500/35 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-200">Venue Capacity & Safety Rules</h2>
            <p className="text-[11px] text-neutral-400">Set venue threshold and event metadata</p>
          </div>
        </div>

        <form onSubmit={handleSaveVenueSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1">Venue Name</label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1">Current Event Name</label>
              <input
                type="text"
                value={currentEventName}
                onChange={(e) => setCurrentEventName(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1">
                Total Legal Venue Capacity Limit
              </label>
              <input
                type="number"
                min="10"
                max="50000"
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(Number(e.target.value))}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1">
                Warning Threshold Percentage (%)
              </label>
              <input
                type="number"
                min="50"
                max="99"
                value={warningCapacity}
                onChange={(e) => setWarningCapacity(Number(e.target.value))}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-yellow-400 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Audio Chimes</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={settings.vibrationEnabled}
                  onChange={(e) => updateSettings({ vibrationEnabled: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <Vibrate className="w-3.5 h-3.5 text-amber-400" />
                <span>Haptic Vibration</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={settings.strictAntiPassback}
                  onChange={(e) => updateSettings({ strictAntiPassback: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Strict Anti-Passback (Lock Re-Scans)</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              {settingsSaved && (
                <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-neutral-950 text-xs font-black uppercase tracking-wider transition cursor-pointer active:scale-95"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Demo Reset */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-400">
        <div>
          <span className="font-semibold text-white">Reset Demo Roster & Guest Manifest</span>
          <p className="text-[11px] text-neutral-500">
            Restore pristine VIP/GA attendees and pre-configured accounts for all 10 departments.
          </p>
        </div>
        <button
          onClick={() => {
            playClickSound();
            loadSampleData();
          }}
          className="px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-amber-500/30 hover:border-amber-400 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Restore 10 Department Roster</span>
        </button>
      </div>
    </div>
  );
};
