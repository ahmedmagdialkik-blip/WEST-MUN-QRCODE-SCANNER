/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DepartmentTeamView: Team Delegation & Role Assignment Console
 *
 * Enables all Heads and Co-Heads to:
 * 1. View everyone on their team (co-heads and members under them)
 * 2. Assign specific roles, directives, and stations to the people under them
 * 3. Monitor live venue presence and door check-in status of their team
 * 4. Add/recruit new members directly into their department
 */

import React, { useState, useMemo } from 'react';
import { useVenue } from '../../context/VenueContext';
import { StaffMember, StaffRole, ROLE_LABELS, TeamTask, TaskPriority } from '../../types/venue';
import {
  DEPARTMENTS,
  isHeadOrCoHead,
  getUserManagedDepartments,
  getMemberLeadershipTier,
  canAssignRoleTo,
} from '../../utils/teamHierarchy';
import {
  Shield,
  Users,
  UserCheck,
  UserPlus,
  Crown,
  Sparkles,
  MapPin,
  Clock,
  Search,
  Check,
  Copy,
  Edit3,
  X,
  FileText,
  BadgeCheck,
  ArrowRight,
  Filter,
  Layers,
  ChevronDown,
  CheckSquare,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { playClickSound, playSuccessChime, playWarningBuzzer } from '../../utils/audio';

interface DepartmentTeamViewProps {
  onBackToPass?: () => void;
  showBackToPassButton?: boolean;
}

export const DepartmentTeamView: React.FC<DepartmentTeamViewProps> = ({
  onBackToPass,
  showBackToPassButton = false,
}) => {
  const {
    staffMembers,
    currentUser,
    guests,
    assignTeamMemberRole,
    addStaffMember,
    updateStaffMember,
    tasks,
    createTask,
    completeTask,
    deleteTask,
  } = useVenue();

  // Active section view: 'roster' (team members & roles) vs 'tasks' (assigned tasks & directives)
  const [activeSection, setActiveSection] = useState<'roster' | 'tasks'>('roster');

  // Task Filter state
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState<string>('all');

  // Task Assignment Modal state
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [taskTitleInput, setTaskTitleInput] = useState('');
  const [taskDescInput, setTaskDescInput] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('normal');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Determine which departments the current user can view/manage
  const managedDepts = useMemo(() => getUserManagedDepartments(currentUser), [currentUser]);

  // Selected department (defaults to user's primary role or first available)
  const [selectedDept, setSelectedDept] = useState<StaffRole>(() => {
    if (currentUser?.role && DEPARTMENTS[currentUser.role]) {
      return currentUser.role;
    }
    return managedDepts[0] || 'media_and_press';
  });

  const deptMeta = DEPARTMENTS[selectedDept] || DEPARTMENTS.media_and_press;

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'leaders' | 'members' | 'checked_in'>('all');

  // Role Assignment Modal state
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [roleTitle, setRoleTitle] = useState('');
  const [assignedStation, setAssignedStation] = useState('');
  const [operationalNotes, setOperationalNotes] = useState('');

  // Add Member Modal state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberStation, setNewMemberStation] = useState('');
  const [newMemberPin, setNewMemberPin] = useState(String(Math.floor(1000 + Math.random() * 9000)));

  // Toast notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // Get all staff members belonging to the active department
  const departmentMembers = useMemo(() => {
    return staffMembers.filter((m) => m.role === selectedDept);
  }, [staffMembers, selectedDept]);

  // Separate leadership (Heads & Co-Heads) from team members
  const leaders = useMemo(() => {
    return departmentMembers.filter((m) => {
      const tier = getMemberLeadershipTier(m);
      return tier === 'head' || tier === 'co_head';
    });
  }, [departmentMembers]);

  const teamMembersUnder = useMemo(() => {
    return departmentMembers.filter((m) => {
      const tier = getMemberLeadershipTier(m);
      return tier === 'member';
    });
  }, [departmentMembers]);

  // Filtered members based on search and tab
  const filteredMembers = useMemo(() => {
    return departmentMembers.filter((m) => {
      // Search matching
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesName = m.name.toLowerCase().includes(query);
        const matchesRole = (m.customTitle || '').toLowerCase().includes(query);
        const matchesGate = (m.assignedGate || '').toLowerCase().includes(query);
        const matchesTicket = (m.ticketId || '').toLowerCase().includes(query);
        if (!matchesName && !matchesRole && !matchesGate && !matchesTicket) return false;
      }

      // Tier filter
      const tier = getMemberLeadershipTier(m);
      if (tierFilter === 'leaders' && tier === 'member') return false;
      if (tierFilter === 'members' && tier !== 'member') return false;

      if (tierFilter === 'checked_in') {
        const guestRec = guests.find(
          (g) =>
            (m.ticketId && g.ticketId.toLowerCase() === m.ticketId.toLowerCase()) ||
            g.name.toLowerCase() === m.name.toLowerCase()
        );
        if (guestRec?.status !== 'Checked-In') return false;
      }

      return true;
    });
  }, [departmentMembers, searchQuery, tierFilter, guests]);

  // Stats
  const checkedInCount = useMemo(() => {
    return departmentMembers.filter((m) => {
      const g = guests.find(
        (guest) =>
          (m.ticketId && guest.ticketId.toLowerCase() === m.ticketId.toLowerCase()) ||
          guest.name.toLowerCase() === m.name.toLowerCase()
      );
      return g?.status === 'Checked-In';
    }).length;
  }, [departmentMembers, guests]);

  // Open role assignment modal
  const handleOpenAssignModal = (member: StaffMember) => {
    playClickSound();
    setEditingMember(member);
    setRoleTitle(member.customTitle || ROLE_LABELS[member.role]?.title || '');
    setAssignedStation(member.assignedGate || deptMeta.suggestedStations[0] || 'MUN Venue');
    setOperationalNotes('');
  };

  // Submit role assignment
  const handleSaveRoleAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    if (!roleTitle.trim()) {
      playWarningBuzzer();
      showToast('error', 'Please enter a valid role title.');
      return;
    }

    if (assignTeamMemberRole) {
      assignTeamMemberRole(editingMember.id, roleTitle.trim(), {
        assignedGate: assignedStation.trim() || undefined,
        notes: operationalNotes.trim() || undefined,
      });
    } else {
      updateStaffMember(editingMember.id, {
        customTitle: roleTitle.trim(),
        assignedGate: assignedStation.trim() || undefined,
      });
    }

    playSuccessChime();
    showToast('success', `Assigned specific role "${roleTitle.trim()}" to ${editingMember.name}`);
    setEditingMember(null);
  };

  // Submit adding a new member
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      playWarningBuzzer();
      showToast('error', 'Member name is required.');
      return;
    }

    const assignedTitle = newMemberRole.trim() || deptMeta.presetRoles[0] || 'Team Coordinator';
    const assignedStationClean = newMemberStation.trim() || deptMeta.suggestedStations[0] || 'MUN Venue';
    const emailClean =
      newMemberEmail.trim() ||
      `${newMemberName.trim().toLowerCase().replace(/\s+/g, '.')}@westmun.org`;

    const newStaff = addStaffMember({
      name: newMemberName.trim(),
      email: emailClean,
      password: newMemberPin || '1234',
      role: selectedDept,
      accessKey: newMemberPin || '1234',
      customTitle: assignedTitle,
      assignedGate: assignedStationClean,
      canScan: selectedDept === 'security' || selectedDept === 'it',
      canManualCheckIn: selectedDept === 'security' || selectedDept === 'it',
      canRevokeCheckIn: selectedDept === 'security' || selectedDept === 'it',
      canManageStaff: false,
      canExportData: true,
      isActive: true,
    });

    playSuccessChime();
    showToast(
      'success',
      `Recruited ${newStaff.name} as "${assignedTitle}" to ${deptMeta.shortName}!`
    );

    // Reset form
    setIsAddMemberOpen(false);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('');
    setNewMemberStation('');
    setNewMemberPin(String(Math.floor(1000 + Math.random() * 9000)));
  };

  const handleCopyTicket = (member: StaffMember) => {
    playClickSound();
    const code = member.ticketId || member.accessKey;
    navigator.clipboard?.writeText(code);
    setCopiedId(member.id);
    showToast('success', `Copied credential code for ${member.name}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Department Tasks calculations
  const deptTasks = useMemo(() => {
    return tasks.filter((t) => t.department === selectedDept);
  }, [tasks, selectedDept]);

  const pendingTasks = useMemo(() => deptTasks.filter((t) => t.status === 'pending'), [deptTasks]);
  const completedTasks = useMemo(() => deptTasks.filter((t) => t.status === 'completed'), [deptTasks]);
  const completionPercentage =
    deptTasks.length > 0 ? Math.round((completedTasks.length / deptTasks.length) * 100) : 0;

  // Filtered tasks based on status filter and assignee filter
  const filteredTasks = useMemo(() => {
    return deptTasks.filter((t) => {
      if (taskStatusFilter === 'pending' && t.status !== 'pending') return false;
      if (taskStatusFilter === 'completed' && t.status !== 'completed') return false;
      if (taskAssigneeFilter !== 'all' && !t.assigneeIds.includes(taskAssigneeFilter)) return false;
      return true;
    });
  }, [deptTasks, taskStatusFilter, taskAssigneeFilter]);

  // Handle task creation
  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitleInput.trim()) {
      playWarningBuzzer();
      showToast('error', 'Please enter a task title.');
      return;
    }
    if (selectedAssigneeIds.length === 0) {
      playWarningBuzzer();
      showToast('error', 'Please select at least one team member to assign this task to.');
      return;
    }

    const assigneeNames = selectedAssigneeIds.map((id) => {
      const m = departmentMembers.find((member) => member.id === id);
      return m ? m.name : id;
    });

    createTask({
      title: taskTitleInput.trim(),
      description: taskDescInput.trim() || 'No additional instructions specified.',
      department: selectedDept,
      assignerId: currentUser?.id || 'staff-leader',
      assignerName: currentUser?.name || 'Department Leadership',
      assignerRole: currentUser?.customTitle || deptMeta.title,
      assigneeIds: selectedAssigneeIds,
      assigneeNames,
      dueDate: taskDueDate || undefined,
      priority: taskPriority,
    });

    playSuccessChime();
    showToast(
      'success',
      `Assigned task "${taskTitleInput.trim()}" to ${selectedAssigneeIds.length} team member(s)!`
    );
    setIsAssignTaskOpen(false);
    setTaskTitleInput('');
    setTaskDescInput('');
    setSelectedAssigneeIds([]);
    setTaskDueDate('');
    setTaskPriority('normal');
    setActiveSection('tasks');
  };

  // Handle manual complete task from leadership console
  const handleCompleteTask = (task: TeamTask) => {
    if (completingTaskId) return;
    setCompletingTaskId(task.id);
    playClickSound();

    const res = completeTask(task.id, {
      id: currentUser?.id || 'staff-lead',
      name: currentUser?.name || 'Department Leadership',
    });

    if (res.success) {
      showToast('success', `Task marked as Completed!`);
    } else if (res.error) {
      showToast('error', res.error);
    }
    setTimeout(() => setCompletingTaskId(null), 300);
  };

  // Handle deleting a task
  const handleDeleteTask = (taskId: string, title: string) => {
    playClickSound();
    deleteTask(taskId);
    showToast('success', `Removed task "${title}".`);
  };

  return (
    <div className="w-full space-y-4 pb-20 select-none animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-16 right-4 z-50 px-4 py-2.5 shadow-2xl flex items-center gap-2 border text-xs font-serif tracking-wide transition-all ${
            toast.type === 'success'
              ? 'bg-[#181310] text-[#D4AF37] border-[#B08D57]/70'
              : 'bg-[#2a0e0e] text-red-200 border-red-500/70'
          }`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {toast.type === 'success' ? (
            <Sparkles className="w-4 h-4 text-[#B08D57]" />
          ) : (
            <X className="w-4 h-4 text-red-400" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Navigation / Back to Pass Bar (for Heads on mobile/pass screen) */}
      {showBackToPassButton && onBackToPass && (
        <div className="flex items-center justify-between pb-2 border-b border-[#B08D57]/30">
          <button
            onClick={() => {
              playClickSound();
              onBackToPass();
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#181310] hover:bg-[#251e19] border border-[#B08D57]/50 text-[#F5F2EA] text-xs font-serif tracking-wider transition cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>← Return to My Diplomatic Pass</span>
          </button>

          <span
            className="text-[11px] text-[#B08D57] font-serif uppercase tracking-widest hidden sm:inline"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Department Leadership Console
          </span>
        </div>
      )}

      {/* Department Header Banner */}
      <div className="relative bg-[#161210] border border-[#B08D57]/60 p-4 sm:p-5 shadow-xl overflow-hidden">
        {/* Antique Gold Corner Accents */}
        <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-[#B08D57]/70 pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-[#B08D57]/70 pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-[#B08D57]/70 pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-[#B08D57]/70 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] uppercase tracking-[0.2em] font-serif px-2 py-0.5 bg-[#221a14] text-[#B08D57] border border-[#B08D57]/40"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Official Roster
              </span>
              <span className="text-xs text-neutral-400 font-serif">
                Logged in as <strong className="text-[#F5F2EA]">{currentUser?.name}</strong> (
                {currentUser?.customTitle || ROLE_LABELS[currentUser?.role || 'volunteers']?.title})
              </span>
            </div>

            <h1
              className="text-lg sm:text-xl font-bold tracking-wide text-[#F5F2EA] font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {deptMeta.title}
            </h1>
            <p className="text-xs text-neutral-300 font-serif max-w-xl leading-relaxed">
              {deptMeta.description}
            </p>
          </div>

          {/* Action Buttons: Add Member & Department Switcher if multi-authorized */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {managedDepts.length > 1 && (
              <div className="relative">
                <select
                  value={selectedDept}
                  onChange={(e) => {
                    playClickSound();
                    setSelectedDept(e.target.value as StaffRole);
                  }}
                  className="bg-[#1e1713] text-[#F5F2EA] text-xs font-serif px-2.5 py-1.5 border border-[#B08D57]/50 focus:border-[#B08D57] outline-hidden cursor-pointer"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {managedDepts.map((d) => (
                    <option key={d} value={d} className="bg-[#161210] text-[#F5F2EA]">
                      {DEPARTMENTS[d]?.shortName || d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => {
                playClickSound();
                setSelectedAssigneeIds([]);
                setIsAssignTaskOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b261b] hover:bg-[#253625] border border-emerald-600/70 text-emerald-300 text-xs font-serif tracking-wider transition cursor-pointer shadow-md font-bold"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Assign Task</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setIsAddMemberOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#261d17] hover:bg-[#34271f] border border-[#B08D57] text-[#D4AF37] text-xs font-serif tracking-wider transition cursor-pointer shadow-md"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <UserPlus className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>+ Recruit Team Member</span>
            </button>
          </div>
        </div>

        {/* Leadership Bar (Who are the Heads & Co-Heads) */}
        <div className="mt-4 pt-3.5 border-t border-[#B08D57]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-serif">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#B08D57] font-semibold flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>Department Leadership:</span>
            </span>
            {leaders.length === 0 ? (
              <span className="text-neutral-400 italic">No head assigned yet</span>
            ) : (
              leaders.map((ldr) => {
                const isCurrent = ldr.id === currentUser?.id;
                return (
                  <span
                    key={ldr.id}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[11px] ${
                      isCurrent
                        ? 'bg-[#2d221a] text-[#F5F2EA] border-[#B08D57] font-bold shadow-xs'
                        : 'bg-[#181310] text-neutral-300 border-[#B08D57]/30'
                    }`}
                  >
                    <span>{ldr.name}</span>
                    <span className="text-[#B08D57] text-[10px]">
                      ({ldr.customTitle || (getMemberLeadershipTier(ldr) === 'head' ? 'Head' : 'Co-Head')})
                    </span>
                    {isCurrent && <span className="text-emerald-400 text-[10px]">★ (You)</span>}
                  </span>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-neutral-400">
            <span>
              Total: <strong className="text-[#F5F2EA]">{departmentMembers.length}</strong>
            </span>
            <span>·</span>
            <span>
              Inside Venue:{' '}
              <strong className="text-emerald-400">
                {checkedInCount} / {departmentMembers.length}
              </strong>
            </span>
            <span>·</span>
            <span>
              Under Leadership: <strong className="text-[#F5F2EA]">{teamMembersUnder.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Primary Section Switcher: Roster vs Tasks */}
      <div className="flex items-center gap-2 border-b border-[#B08D57]/30 pb-2">
        <button
          onClick={() => {
            playClickSound();
            setActiveSection('roster');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-serif uppercase tracking-wider transition border cursor-pointer ${
            activeSection === 'roster'
              ? 'bg-[#261d17] text-[#D4AF37] border-[#B08D57] font-bold shadow-md'
              : 'bg-[#15100c] text-neutral-400 border-[#B08D57]/30 hover:text-[#F5F2EA]'
          }`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <Users className="w-3.5 h-3.5 text-[#B08D57]" />
          <span>Team Roster & Roles ({departmentMembers.length})</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActiveSection('tasks');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-serif uppercase tracking-wider transition border cursor-pointer relative ${
            activeSection === 'tasks'
              ? 'bg-[#261d17] text-[#D4AF37] border-[#B08D57] font-bold shadow-md'
              : 'bg-[#15100c] text-neutral-400 border-[#B08D57]/30 hover:text-[#F5F2EA]'
          }`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <CheckSquare className="w-3.5 h-3.5 text-[#B08D57]" />
          <span>Tasks & Directives ({deptTasks.length})</span>
          {pendingTasks.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              {pendingTasks.length} pending
            </span>
          )}
        </button>
      </div>

      {activeSection === 'roster' ? (
        <>
          {/* Roster Controls & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#B08D57]/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${deptMeta.shortName} team members or assigned roles...`}
            className="w-full pl-9 pr-3 py-1.5 bg-[#140f0c] border border-[#B08D57]/40 text-[#F5F2EA] text-xs placeholder:text-neutral-500 font-serif focus:border-[#B08D57] outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 bg-[#140f0c] p-0.5 border border-[#B08D57]/30 text-xs font-serif overflow-x-auto">
          <button
            onClick={() => {
              playClickSound();
              setTierFilter('all');
            }}
            className={`px-2.5 py-1 text-[11px] uppercase tracking-wider transition ${
              tierFilter === 'all'
                ? 'bg-[#261d17] text-[#D4AF37] border border-[#B08D57]/60 font-semibold'
                : 'text-neutral-400 hover:text-[#F5F2EA]'
            }`}
          >
            All ({departmentMembers.length})
          </button>
          <button
            onClick={() => {
              playClickSound();
              setTierFilter('members');
            }}
            className={`px-2.5 py-1 text-[11px] uppercase tracking-wider transition ${
              tierFilter === 'members'
                ? 'bg-[#261d17] text-[#D4AF37] border border-[#B08D57]/60 font-semibold'
                : 'text-neutral-400 hover:text-[#F5F2EA]'
            }`}
          >
            Team Members ({teamMembersUnder.length})
          </button>
          <button
            onClick={() => {
              playClickSound();
              setTierFilter('leaders');
            }}
            className={`px-2.5 py-1 text-[11px] uppercase tracking-wider transition ${
              tierFilter === 'leaders'
                ? 'bg-[#261d17] text-[#D4AF37] border border-[#B08D57]/60 font-semibold'
                : 'text-neutral-400 hover:text-[#F5F2EA]'
            }`}
          >
            Heads & Co-Heads ({leaders.length})
          </button>
          <button
            onClick={() => {
              playClickSound();
              setTierFilter('checked_in');
            }}
            className={`px-2.5 py-1 text-[11px] uppercase tracking-wider transition ${
              tierFilter === 'checked_in'
                ? 'bg-[#261d17] text-emerald-400 border border-emerald-500/50 font-semibold'
                : 'text-neutral-400 hover:text-[#F5F2EA]'
            }`}
          >
            Inside ({checkedInCount})
          </button>
        </div>
      </div>

      {/* Team Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-[#15100e] border border-[#B08D57]/30 text-neutral-400 font-serif">
            <Users className="w-8 h-8 text-[#B08D57]/50 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#F5F2EA]">No team members match this filter</p>
            <p className="text-xs text-neutral-500 mt-1">
              Try adjusting your search query or recruit a new member to the team.
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const tier = getMemberLeadershipTier(member);
            const isLeader = tier === 'head' || tier === 'co_head';
            const isCurrentUser = member.id === currentUser?.id;
            const canAssign = canAssignRoleTo(currentUser, member);

            // Find guest record for live door check-in status
            const guestRecord = guests.find(
              (g) =>
                (member.ticketId && g.ticketId.toLowerCase() === member.ticketId.toLowerCase()) ||
                g.name.toLowerCase() === member.name.toLowerCase()
            );

            const isCheckedIn = guestRecord?.status === 'Checked-In';
            const hasLeft = guestRecord?.status === 'Left';

            return (
              <div
                key={member.id}
                className={`relative bg-[#161210] border p-3.5 transition-all shadow-md flex flex-col justify-between ${
                  isCurrentUser
                    ? 'border-[#B08D57] bg-[#1a1410]'
                    : isLeader
                    ? 'border-[#B08D57]/60'
                    : 'border-[#B08D57]/30 hover:border-[#B08D57]/50'
                }`}
              >
                <div>
                  {/* Card Header: Name + Badge Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 shrink-0 flex items-center justify-center text-xs font-serif font-bold border ${
                          isLeader
                            ? 'bg-[#33251c] text-[#D4AF37] border-[#B08D57]'
                            : 'bg-[#201813] text-[#F5F2EA] border-[#B08D57]/40'
                        }`}
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        {member.name.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3
                            className="text-sm font-bold text-[#F5F2EA] font-serif truncate"
                            style={{ fontFamily: "'Cinzel', serif" }}
                          >
                            {member.name}
                          </h3>
                          {isCurrentUser && (
                            <span className="text-[9px] uppercase tracking-widest px-1 py-0.2 bg-[#2d2119] text-[#B08D57] border border-[#B08D57]/40">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 font-serif truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    {/* Leadership Tier Tag */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {isLeader ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-serif uppercase tracking-wider text-[#D4AF37] px-1.5 py-0.5 bg-[#2b1f17] border border-[#B08D57]/50">
                          <Crown className="w-2.5 h-2.5 text-[#B08D57]" />
                          <span>{tier === 'head' ? 'Department Head' : 'Co-Head'}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-serif uppercase tracking-wider text-neutral-400 px-1.5 py-0.5 bg-[#1b1512] border border-[#B08D57]/20">
                          Team Member
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Designated Role Banner */}
                  <div className="my-2.5 p-2 bg-[#1b1512] border border-[#B08D57]/30 flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[9px] uppercase tracking-widest text-[#B08D57] font-serif block">
                        Designated Specific Role:
                      </span>
                      <p
                        className="text-xs font-bold text-[#F5F2EA] font-serif tracking-wide truncate"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        {member.customTitle || ROLE_LABELS[member.role]?.title || 'Staff Member'}
                      </p>
                    </div>

                    {/* Assign / Edit Role Action Button */}
                    {canAssign && (
                      <button
                        onClick={() => handleOpenAssignModal(member)}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 bg-[#281f18] hover:bg-[#382b22] border border-[#B08D57]/60 text-[#D4AF37] text-[10px] font-serif tracking-wider transition cursor-pointer"
                        title={`Assign specific role for ${member.name}`}
                      >
                        <Edit3 className="w-3 h-3 text-[#B08D57]" />
                        <span>Assign Role</span>
                      </button>
                    )}
                  </div>

                  {/* Metadata Row: Station & Door Status */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-serif text-neutral-300 py-1 border-t border-[#B08D57]/20">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 text-[#B08D57] shrink-0" />
                      <span className="truncate">{member.assignedGate || 'MUN Venue'}</span>
                    </div>

                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isCheckedIn
                            ? 'bg-emerald-400 animate-pulse'
                            : hasLeft
                            ? 'bg-amber-400'
                            : 'bg-neutral-500'
                        }`}
                      />
                      <span
                        className={`truncate text-[10px] ${
                          isCheckedIn
                            ? 'text-emerald-400 font-semibold'
                            : hasLeft
                            ? 'text-amber-400'
                            : 'text-neutral-400'
                        }`}
                      >
                        {isCheckedIn ? 'Inside Venue' : hasLeft ? 'Departed' : 'Pending Door'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Credential Pass Ticket ID */}
                <div className="mt-2.5 pt-2 border-t border-[#B08D57]/20 flex items-center justify-between text-[10px] font-serif text-neutral-400">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[#B08D57]">{member.ticketId || member.accessKey}</span>
                    <button
                      onClick={() => handleCopyTicket(member)}
                      className="text-neutral-400 hover:text-[#D4AF37] transition"
                      title="Copy Pass Code"
                    >
                      {copiedId === member.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <span className="text-neutral-500 text-[10px]">
                    PIN: <strong className="text-neutral-300 font-mono">{member.password || member.accessKey}</strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
        </>
      ) : (
        /* TASKS & DIRECTIVES MANAGEMENT VIEW */
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header Stats Bar */}
          <div className="bg-[#161210] border border-[#B08D57]/60 p-4 shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Total Tasks */}
            <div className="p-3 bg-[#1c1612] border border-[#B08D57]/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-serif block">
                  Total Tasks
                </span>
                <span className="text-xl font-bold text-[#F5F2EA] font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                  {deptTasks.length}
                </span>
              </div>
              <CheckSquare className="w-6 h-6 text-[#B08D57]" />
            </div>

            {/* Pending Tasks */}
            <div className="p-3 bg-[#241c14] border border-amber-600/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-300 uppercase tracking-wider font-serif block">
                  Pending Actions
                </span>
                <span className="text-xl font-bold text-amber-200 font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                  {pendingTasks.length}
                </span>
              </div>
              <Clock className="w-6 h-6 text-amber-400" />
            </div>

            {/* Completed Tasks */}
            <div className="p-3 bg-[#132219] border border-emerald-600/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-serif block">
                  Completed Tasks
                </span>
                <span className="text-xl font-bold text-emerald-200 font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                  {completedTasks.length}
                </span>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>

            {/* Completion Progress Bar */}
            <div className="p-3 bg-[#1c1612] border border-[#B08D57]/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-serif mb-1">
                <span className="text-neutral-400">Completion Rate:</span>
                <span className="text-[#D4AF37] font-bold font-mono text-sm">{completionPercentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#120e0c] rounded-xs overflow-hidden border border-[#B08D57]/30">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-[#D4AF37] to-emerald-400 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-[9px] text-neutral-500 font-mono mt-1 text-right">
                {completedTasks.length} of {deptTasks.length} Done
              </span>
            </div>
          </div>

          {/* Filter Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#140f0c] p-2.5 border border-[#B08D57]/30">
            {/* Status Tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTaskStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-serif uppercase tracking-wider transition border cursor-pointer ${
                  taskStatusFilter === 'all'
                    ? 'bg-[#2b2018] text-[#D4AF37] border-[#B08D57] font-bold'
                    : 'text-neutral-400 border-transparent hover:text-white'
                }`}
              >
                All ({deptTasks.length})
              </button>
              <button
                onClick={() => setTaskStatusFilter('pending')}
                className={`px-3 py-1.5 text-xs font-serif uppercase tracking-wider transition border cursor-pointer ${
                  taskStatusFilter === 'pending'
                    ? 'bg-[#2c2014] text-amber-300 border-amber-600/70 font-bold'
                    : 'text-neutral-400 border-transparent hover:text-white'
                }`}
              >
                Pending ({pendingTasks.length})
              </button>
              <button
                onClick={() => setTaskStatusFilter('completed')}
                className={`px-3 py-1.5 text-xs font-serif uppercase tracking-wider transition border cursor-pointer ${
                  taskStatusFilter === 'completed'
                    ? 'bg-[#15291b] text-emerald-300 border-emerald-600/70 font-bold'
                    : 'text-neutral-400 border-transparent hover:text-white'
                }`}
              >
                Completed ({completedTasks.length})
              </button>
            </div>

            {/* Filter by Assignee & Assign Task Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-neutral-400 font-serif">Assignee:</span>
              <select
                value={taskAssigneeFilter}
                onChange={(e) => setTaskAssigneeFilter(e.target.value)}
                className="bg-[#1c1511] text-[#F5F2EA] text-xs font-serif px-2.5 py-1.5 border border-[#B08D57]/40 focus:border-[#B08D57] outline-hidden cursor-pointer"
              >
                <option value="all">All Team Members</option>
                {departmentMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.customTitle || m.role})
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  playClickSound();
                  setSelectedAssigneeIds([]);
                  setIsAssignTaskOpen(true);
                }}
                className="px-3.5 py-1.5 bg-[#1b261b] hover:bg-[#253625] border border-emerald-600/80 text-emerald-200 text-xs font-serif tracking-wider flex items-center gap-1.5 transition cursor-pointer font-bold shrink-0 shadow-md"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Assign New Task</span>
              </button>
            </div>
          </div>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <div className="bg-[#161210] border border-[#B08D57]/40 p-10 text-center text-neutral-400 font-serif space-y-2.5">
              <CheckSquare className="w-8 h-8 text-[#B08D57]/50 mx-auto" />
              <p className="text-sm">No tasks found matching your filter criteria.</p>
              <button
                onClick={() => {
                  setSelectedAssigneeIds([]);
                  setIsAssignTaskOpen(true);
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#261d17] border border-[#B08D57] text-[#D4AF37] text-xs font-serif uppercase tracking-wider cursor-pointer font-bold shadow-md"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <Plus className="w-3.5 h-3.5 text-[#B08D57]" />
                <span>Assign First Task to Team</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredTasks.map((task) => {
                const isCompleted = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    className={`relative p-4 border transition-all ${
                      isCompleted
                        ? 'bg-[#111913] border-2 border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                        : 'bg-[#17120e] border-[#B08D57]/50 hover:border-[#B08D57] shadow-lg'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#B08D57]/20 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] uppercase font-bold px-2 py-0.5 border ${
                            isCompleted
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                              : task.priority === 'urgent'
                              ? 'bg-red-950 text-red-300 border-red-700'
                              : task.priority === 'high'
                              ? 'bg-amber-950 text-amber-300 border-amber-700'
                              : 'bg-[#231a14] text-[#D4AF37] border-[#B08D57]/40'
                          }`}
                        >
                          {isCompleted ? '✓ Completed' : `${task.priority || 'Normal'} Priority`}
                        </span>

                        {task.dueDate && (
                          <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#B08D57]" />
                            <span>Due: {task.dueDate}</span>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="text-neutral-500 hover:text-red-400 transition p-1 cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Task Title */}
                    <h3
                      className={`text-sm font-bold leading-snug ${
                        isCompleted ? 'text-emerald-300 line-through' : 'text-[#F5F2EA]'
                      }`}
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {task.title}
                    </h3>

                    {/* Task Description */}
                    <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed font-serif">
                      {task.description}
                    </p>

                    {/* Assignee Badges */}
                    <div className="mt-3 pt-2.5 border-t border-[#B08D57]/20 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-serif flex-wrap">
                        <Users className="w-3 h-3 text-[#B08D57] shrink-0" />
                        <span>Assigned to:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {task.assigneeNames.map((name, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-[#201813] text-[#D4AF37] border border-[#B08D57]/30 text-[10px]"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-[10px] text-neutral-500 font-serif">
                        Assigned by <strong className="text-neutral-300">{task.assignerName}</strong> ({task.assignerRole})
                      </div>
                    </div>

                    {/* Completion Status / Action */}
                    <div className="mt-3 pt-2.5 border-t border-[#B08D57]/20 flex items-center justify-between">
                      {isCompleted ? (
                        <div className="text-xs text-emerald-400 font-serif flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            Completed by <strong>{task.completedBy?.name}</strong>
                            {task.completedAt && (
                              <span className="text-[10px] text-neutral-400 block sm:inline sm:ml-1 font-mono">
                                ({new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCompleteTask(task)}
                          disabled={completingTaskId === task.id}
                          className="w-full py-1.5 px-3 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500 text-emerald-200 text-xs font-serif tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer font-bold shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{completingTaskId === task.id ? 'Completing...' : 'Mark as Completed (Trigger Notification)'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Assign Specific Role to Member */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#161210] border-2 border-[#B08D57] p-5 shadow-2xl relative text-[#F5F2EA] space-y-4">
            {/* Corner Accents */}
            <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-[#B08D57]" />
            <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-[#B08D57]" />
            <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-[#B08D57]" />
            <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-[#B08D57]" />

            <div className="flex items-start justify-between pb-3 border-b border-[#B08D57]/30">
              <div className="space-y-0.5">
                <span
                  className="text-[10px] uppercase tracking-widest text-[#B08D57] font-serif"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Department Role Assignment
                </span>
                <h2
                  className="text-base font-bold text-[#F5F2EA] font-serif"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Assign Specific Role for {editingMember.name}
                </h2>
                <p className="text-xs text-neutral-400 font-serif">
                  {deptMeta.title} · Member Credential: {editingMember.ticketId}
                </p>
              </div>

              <button
                onClick={() => setEditingMember(null)}
                className="p-1 hover:bg-[#251e19] text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoleAssignment} className="space-y-4 font-serif">
              {/* Preset Role Suggestions for this Department */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#B08D57] mb-1.5">
                  Suggested {deptMeta.shortName} Roles (Click to Apply):
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-[#120e0c] border border-[#B08D57]/30">
                  {deptMeta.presetRoles.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setRoleTitle(preset);
                      }}
                      className={`text-[10px] px-2 py-1 border transition ${
                        roleTitle === preset
                          ? 'bg-[#33251c] text-[#D4AF37] border-[#B08D57] font-bold shadow-xs'
                          : 'bg-[#1a1410] text-neutral-300 border-[#B08D57]/30 hover:border-[#B08D57]/60'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Role Title Input */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#B08D57] mb-1">
                  Designated Role Title *
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Lead Floor Runner, Stage Director, Press Moderator"
                  className="w-full px-3 py-2 bg-[#120e0c] border border-[#B08D57]/50 text-[#F5F2EA] text-xs font-serif focus:border-[#B08D57] outline-hidden"
                  required
                />
              </div>

              {/* Station / Location */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#B08D57] mb-1">
                  Assigned Station / Operational Zone
                </label>
                <div className="grid grid-cols-2 gap-2 mb-1.5">
                  {deptMeta.suggestedStations.slice(0, 4).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setAssignedStation(st);
                      }}
                      className={`text-[10px] p-1.5 border text-left truncate transition ${
                        assignedStation === st
                          ? 'bg-[#33251c] text-[#D4AF37] border-[#B08D57]'
                          : 'bg-[#140f0c] text-neutral-300 border-[#B08D57]/30'
                      }`}
                    >
                      📍 {st}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={assignedStation}
                  onChange={(e) => setAssignedStation(e.target.value)}
                  placeholder="Or enter custom station (e.g. Red Carpet Gate A)"
                  className="w-full px-3 py-1.5 bg-[#120e0c] border border-[#B08D57]/40 text-[#F5F2EA] text-xs font-serif focus:border-[#B08D57] outline-hidden"
                />
              </div>

              {/* Operational Directives / Notes */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#B08D57] mb-1">
                  Operational Directives & Shift Notes (Optional)
                </label>
                <textarea
                  value={operationalNotes}
                  onChange={(e) => setOperationalNotes(e.target.value)}
                  placeholder="e.g. Responsible for opening ceremony photography and immediate delivery to Media Suite."
                  rows={2}
                  className="w-full px-3 py-1.5 bg-[#120e0c] border border-[#B08D57]/40 text-[#F5F2EA] text-xs font-serif focus:border-[#B08D57] outline-hidden resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[#B08D57]/30 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 bg-[#1b1512] hover:bg-[#281f1a] border border-[#B08D57]/30 text-neutral-300 text-xs font-serif tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2d221a] hover:bg-[#3d2e23] border border-[#B08D57] text-[#D4AF37] text-xs font-serif uppercase tracking-widest transition cursor-pointer shadow-lg font-bold"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  ✓ Confirm & Assign Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Recruit / Add Member to Department */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#161210] border-2 border-[#B08D57] p-5 shadow-2xl relative text-[#F5F2EA] space-y-4">
            {/* Corner Accents */}
            <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-[#B08D57]" />
            <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-[#B08D57]" />
            <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-[#B08D57]" />
            <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-[#B08D57]" />

            <div className="flex items-start justify-between pb-3 border-b border-[#B08D57]/30">
              <div>
                <span
                  className="text-[10px] uppercase tracking-widest text-[#B08D57] font-serif"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Recruitment & Staffing
                </span>
                <h2
                  className="text-base font-bold text-[#F5F2EA] font-serif"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Add Team Member to {deptMeta.shortName}
                </h2>
              </div>

              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 hover:bg-[#251e19] text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3 font-serif">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#B08D57] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Reem Al Shammari"
                  className="w-full px-3 py-1.5 bg-[#120e0c] border border-[#B08D57]/50 text-[#F5F2EA] text-xs font-serif focus:border-[#B08D57] outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#B08D57] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="reem.alshammari@westmun.org (or leave blank to auto-generate)"
                  className="w-full px-3 py-1.5 bg-[#120e0c] border border-[#B08D57]/40 text-[#F5F2EA] text-xs font-serif focus:border-[#B08D57] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#B08D57] mb-1">
                  Assigned Specific Role *
                </label>
                <input
                  type="text"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  placeholder={deptMeta.presetRoles[0] || 'Team Coordinator'}
                  className="w-full px-3 py-1.5 bg-[#120e0c] border border-[#B08D57]/50 text-[#F5F2EA] text-xs font-serif focus:border-[#B08D57] outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#B08D57] mb-1">
                  Assigned Station / Location
                </label>
                <input
                  type="text"
                  value={newMemberStation}
                  onChange={(e) => setNewMemberStation(e.target.value)}
                  placeholder={deptMeta.suggestedStations[0] || 'MUN Venue'}
                  className="w-full px-3 py-1.5 bg-[#120e0c] border border-[#B08D57]/40 text-[#F5F2EA] text-xs font-serif focus:border-[#B08D57] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#B08D57] mb-1">
                  Access 4-Digit PIN
                </label>
                <input
                  type="text"
                  value={newMemberPin}
                  onChange={(e) => setNewMemberPin(e.target.value)}
                  maxLength={6}
                  className="w-full px-3 py-1.5 bg-[#120e0c] border border-[#B08D57]/40 text-[#F5F2EA] text-xs font-mono focus:border-[#B08D57] outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-[#B08D57]/30 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 bg-[#1b1512] hover:bg-[#281f1a] border border-[#B08D57]/30 text-neutral-300 text-xs font-serif tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2d221a] hover:bg-[#3d2e23] border border-[#B08D57] text-[#D4AF37] text-xs font-serif uppercase tracking-widest transition cursor-pointer shadow-lg font-bold"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  ✓ Recruit & Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Assign Task to Team Members */}
      {isAssignTaskOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#161210] border-2 border-emerald-600/80 p-5 shadow-2xl relative text-[#F5F2EA] space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Corner Accents */}
            <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-emerald-400 pointer-events-none" />
            <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-emerald-400 pointer-events-none" />
            <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-emerald-400 pointer-events-none" />
            <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-emerald-400 pointer-events-none" />

            <div className="flex items-start justify-between pb-3 border-b border-[#B08D57]/30">
              <div>
                <span
                  className="text-[10px] uppercase tracking-widest text-emerald-400 font-serif flex items-center gap-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  <CheckSquare className="w-3 h-3 text-emerald-400" />
                  <span>Task Assignment • {deptMeta.shortName}</span>
                </span>
                <h2
                  className="text-base font-bold text-[#F5F2EA] font-serif mt-0.5"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Assign Task to Team Member(s)
                </h2>
                <p className="text-xs text-neutral-400 font-serif">
                  Assigning as <strong className="text-[#D4AF37]">{currentUser?.name}</strong> ({currentUser?.customTitle || deptMeta.title})
                </p>
              </div>

              <button
                onClick={() => setIsAssignTaskOpen(false)}
                className="p-1 hover:bg-[#251e19] text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-3.5 font-serif">
              {/* Task Title */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#B08D57] mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={taskTitleInput}
                  onChange={(e) => setTaskTitleInput(e.target.value)}
                  placeholder="e.g. Verify Press Badges at Main Stage or Setup Resolution Screens"
                  className="w-full px-3 py-2 bg-[#120e0c] border border-[#B08D57]/50 text-[#F5F2EA] text-xs font-serif focus:border-[#B08D57] outline-hidden"
                  required
                />
              </div>

              {/* Task Description / Directives */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#B08D57] mb-1">
                  Description & Operational Directives
                </label>
                <textarea
                  value={taskDescInput}
                  onChange={(e) => setTaskDescInput(e.target.value)}
                  rows={2}
                  placeholder="Detail the exact instructions, check-in gate, or materials required..."
                  className="w-full px-3 py-2 bg-[#120e0c] border border-[#B08D57]/40 text-[#F5F2EA] text-xs font-serif focus:border-[#B08D57] outline-hidden resize-none"
                />
              </div>

              {/* Assignee Selection (Multi-select) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] uppercase tracking-wider text-[#B08D57]">
                    Assign To Team Members * ({selectedAssigneeIds.length} selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAssigneeIds(departmentMembers.map((m) => m.id))}
                      className="text-[10px] text-[#D4AF37] underline hover:text-white cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-neutral-600">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedAssigneeIds([])}
                      className="text-[10px] text-neutral-400 underline hover:text-white cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-40 overflow-y-auto p-2 bg-[#120e0c] border border-[#B08D57]/40 space-y-1">
                  {departmentMembers.map((member) => {
                    const isSelected = selectedAssigneeIds.includes(member.id);
                    return (
                      <label
                        key={member.id}
                        onClick={() => {
                          setSelectedAssigneeIds((prev) =>
                            prev.includes(member.id)
                              ? prev.filter((id) => id !== member.id)
                              : [...prev, member.id]
                          );
                        }}
                        className={`flex items-center justify-between p-2 border transition cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#2b2017] border-[#D4AF37] text-[#F5F2EA]'
                            : 'bg-[#181310] border-[#B08D57]/20 text-neutral-300 hover:border-[#B08D57]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent label
                            className="w-3.5 h-3.5 accent-[#B08D57] cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold block">{member.name}</span>
                            <span className="text-[10px] text-neutral-400">
                              {member.customTitle || member.role}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-[9px] font-mono text-emerald-400 font-bold">
                            ✓ ASSIGNED
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Priority & Due Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Priority */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#B08D57] mb-1">
                    Priority Level
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-1.5 bg-[#120e0c] border border-[#B08D57]/40 text-[#F5F2EA] text-xs font-serif focus:border-[#B08D57] outline-hidden cursor-pointer"
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Priority (Immediate)</option>
                  </select>
                </div>

                {/* Optional Due Date */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#B08D57] mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#120e0c] border border-[#B08D57]/40 text-[#F5F2EA] text-xs font-serif focus:border-[#B08D57] outline-hidden"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-[#1c140e] border border-amber-600/30 text-[11px] text-amber-300 leading-snug">
                ℹ️ <strong>Initial Status:</strong> This task will start as <strong>Pending</strong>. When a team member marks it completed, you will receive an instant animated notification, device buzz, subtle success chime, and self-drawing checkmark!
              </div>

              <div className="pt-3 border-t border-[#B08D57]/30 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignTaskOpen(false)}
                  className="px-4 py-2 bg-[#1b1512] hover:bg-[#281f1a] border border-[#B08D57]/30 text-neutral-300 text-xs font-serif tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1b2a1c] hover:bg-[#253c27] border border-emerald-500 text-emerald-200 text-xs font-serif uppercase tracking-widest transition cursor-pointer shadow-lg font-bold"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  ✓ Create & Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
