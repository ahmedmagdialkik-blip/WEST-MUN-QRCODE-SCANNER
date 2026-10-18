import React from 'react';
import { useVenue } from '../../context/VenueContext';
import { ROLE_LABELS } from '../../types/venue';
import {
  Users,
  UserCheck,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  ArrowUpRight,
  Crown,
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';
import { CheckInTrendsChartWidget } from './CheckInTrendsChartWidget';

export const DashboardView: React.FC = () => {
  const { stats, settings, guests, logs, undoCheckIn, currentUser, setActiveTab } = useVenue();

  const isManagement =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'it' ||
    currentUser?.role === 'security';

  const categories = ['VIP', 'General Admission', 'Artist', 'Backstage', 'Press', 'Staff'] as const;
  const categoryStats = categories.map((cat) => {
    const total = guests.filter((g) => g.category === cat).length;
    const checked = guests.filter((g) => g.category === cat && g.status === 'Checked-In').length;
    const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { category: cat, total, checked, percent };
  });

  const isNearCapacity = stats.capacityPercent >= settings.warningCapacityPercentage;

  return (
    <div className="space-y-4 text-[#F5F2EA] pb-16">
      {/* Event Header in Antique Gold & Charcoal */}
      <div className="bg-[#14110f] border border-[#B08D57]/50 p-4 sm:p-5 shadow-md relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#B08D57] animate-pulse" />
              <span
                className="text-[10px] uppercase font-bold tracking-widest text-[#B08D57] font-serif"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Live Diplomatic Synchronization • {currentUser ? ROLE_LABELS[currentUser.role]?.title : 'Staff'}
              </span>
            </div>
            <h1
              className="text-lg sm:text-2xl font-bold uppercase tracking-wider text-[#F5F2EA] font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {settings.currentEventName}
            </h1>
            <p
              className="text-xs text-[#B08D57]/80 font-serif mt-0.5"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Venue: <span className="text-[#F5F2EA] font-semibold">{settings.venueName}</span> • Date: {settings.eventDate}
            </p>
          </div>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('scanner');
            }}
            className="self-start sm:self-center px-3.5 py-2 bg-[#6E4E2E] hover:bg-[#B08D57] text-[#120f0d] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-sm border border-[#B08D57]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <span>Launch Scanner</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#120f0d]" />
          </button>
        </div>

        {isNearCapacity && (
          <div className="mt-3 p-2.5 bg-[#251814] border border-amber-500/40 flex items-center gap-2 text-xs text-amber-200 font-serif">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Venue is nearing maximum capacity ({stats.capacityPercent}% full). Coordinate door entry pacing with Security and IT Directorate.
            </span>
          </div>
        )}
      </div>

      {/* Primary Capacity Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Checked In */}
        <div className="bg-[#14100e] border border-[#B08D57]/30 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#B08D57]/80 mb-1.5">
            <span
              className="text-[10px] uppercase font-bold tracking-wider font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Inside Venue
            </span>
            <UserCheck className="w-4 h-4 text-[#B08D57]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#F5F2EA]">
            {stats.checkedInCount}
          </div>
          <p className="text-[10px] text-neutral-400 font-serif mt-0.5">Validated delegates</p>
        </div>

        {/* Capacity Remaining */}
        <div className="bg-[#14100e] border border-[#B08D57]/30 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#B08D57]/80 mb-1.5">
            <span
              className="text-[10px] uppercase font-bold tracking-wider font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Available
            </span>
            <Users className="w-4 h-4 text-[#B08D57]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#D4AF37]">
            {stats.capacityRemaining}
          </div>
          <p className="text-[10px] text-neutral-400 font-serif mt-0.5">Of {settings.totalCapacity} maximum</p>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-[#14100e] border border-[#B08D57]/30 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#B08D57]/80 mb-1.5">
            <span
              className="text-[10px] uppercase font-bold tracking-wider font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Occupancy
            </span>
            <TrendingUp className="w-4 h-4 text-[#B08D57]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#F5F2EA]">
            {stats.capacityPercent}%
          </div>
          <div className="w-full bg-[#201814] h-1.5 mt-2 border border-[#B08D57]/20 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isNearCapacity ? 'bg-amber-400' : 'bg-[#B08D57]'
              }`}
              style={{ width: `${Math.min(100, stats.capacityPercent)}%` }}
            />
          </div>
        </div>

        {/* Check-In Velocity */}
        <div className="bg-[#14100e] border border-[#B08D57]/30 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#B08D57]/80 mb-1.5">
            <span
              className="text-[10px] uppercase font-bold tracking-wider font-serif"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Velocity
            </span>
            <Clock className="w-4 h-4 text-[#B08D57]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#F5F2EA]">
            {stats.recentCheckIns?.length || 0}
          </div>
          <p className="text-[10px] text-neutral-400 font-serif mt-0.5">Last 10 minutes</p>
        </div>
      </div>

      {/* Summary Stats Widget: Guest Check-In Trends Chart */}
      <CheckInTrendsChartWidget />

      {/* Category Breakdown */}
      <div className="bg-[#14100e] border border-[#B08D57]/30 p-4 shadow-sm space-y-3">
        <h2
          className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F5F2EA] font-serif border-b border-[#B08D57]/20 pb-2"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Delegation Allocation Breakdown
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {categoryStats.map((cat) => (
            <div
              key={cat.category}
              className="p-3 bg-[#181310] border border-[#B08D57]/20 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold text-[#F5F2EA] font-serif"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {cat.category}
                </span>
                <span className="text-xs font-mono font-bold text-[#D4AF37]">
                  {cat.checked} / {cat.total}
                </span>
              </div>
              <div className="w-full bg-[#100d0a] h-1 mt-2.5 border border-[#B08D57]/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6E4E2E] to-[#B08D57]"
                  style={{ width: `${cat.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Security Scan Audit Feed */}
      <div className="bg-[#14100e] border border-[#B08D57]/30 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#B08D57]/20 pb-2">
          <h2
            className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F5F2EA] font-serif"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Recent Verification Logs
          </h2>
          <span className="text-[10px] text-[#B08D57] font-mono">
            {logs.length} Total Events
          </span>
        </div>

        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <div className="text-center py-6 text-xs text-neutral-500 font-serif">
              No verification scans recorded yet.
            </div>
          ) : (
            logs.slice(0, 15).map((log) => {
              const isSuccess = log.type === 'CHECK_IN' || log.type === 'RE_ENTRY';
              const isWarning = log.type === 'CHECK_OUT' || log.type === 'UNDO_CHECK_IN';

              return (
                <div
                  key={log.id}
                  className="p-2 sm:p-2.5 bg-[#171310] border border-[#B08D57]/20 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isSuccess
                          ? 'bg-emerald-400'
                          : isWarning
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-serif font-semibold text-[#F5F2EA] truncate">
                        {log.guestName}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono truncate">
                        {log.ticketId} • {log.scannerName}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-[#B08D57] font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                    <span
                      className={`text-[9px] uppercase font-serif tracking-wider ${
                        isSuccess
                          ? 'text-emerald-400'
                          : isWarning
                          ? 'text-amber-300'
                          : 'text-red-400'
                      }`}
                    >
                      {log.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
