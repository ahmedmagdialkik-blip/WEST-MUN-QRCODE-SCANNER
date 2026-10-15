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
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  Crown,
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

export const DashboardView: React.FC = () => {
  const { stats, settings, guests, logs, undoCheckIn, currentUser, setActiveTab } = useVenue();

  const isManagement =
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'ceremony_director' ||
    currentUser?.role === 'security';

  const categories = ['VIP', 'General Admission', 'Artist', 'Backstage', 'Press'] as const;
  const categoryStats = categories.map((cat) => {
    const total = guests.filter((g) => g.category === cat).length;
    const checked = guests.filter((g) => g.category === cat && g.status === 'Checked-In').length;
    const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { category: cat, total, checked, percent };
  });

  const gateCounts: Record<string, number> = {};
  logs
    .filter((l) => l.type === 'CHECK_IN')
    .forEach((l) => {
      gateCounts[l.gate] = (gateCounts[l.gate] || 0) + 1;
    });

  const isNearCapacity = stats.capacityPercent >= settings.warningCapacityPercentage;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-5 pb-24 text-white">
      {/* Event Header in Black & Gold */}
      <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-black border border-amber-500/40 rounded-3xl p-5 shadow-[0_4px_30px_rgba(212,175,55,0.12)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-xs uppercase font-black tracking-widest text-amber-300">
                Live Door Synchronization • {currentUser ? ROLE_LABELS[currentUser.role]?.title : 'Staff'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              {settings.currentEventName}
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Venue: <span className="text-amber-300 font-semibold">{settings.venueName}</span> • Date: {settings.eventDate}
            </p>
          </div>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('scanner');
            }}
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition cursor-pointer active:scale-95"
          >
            <span>Scan Tickets</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {isNearCapacity && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-center gap-2.5 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Venue is nearing maximum capacity ({stats.capacityPercent}% full). Coordinate door entry pacing with Security and Ceremony Director.
            </span>
          </div>
        )}
      </div>

      {/* Primary Capacity Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Checked In */}
        <div className="bg-gradient-to-b from-neutral-950 to-black border border-amber-500/35 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-amber-300/80">Inside Venue</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
            {stats.checkedInCount}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Validated attendees</p>
        </div>

        {/* Capacity Remaining */}
        <div className="bg-gradient-to-b from-neutral-950 to-black border border-amber-500/35 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-amber-300/80">Available</span>
            <Users className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-yellow-200">
            {stats.capacityRemaining}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Remaining entry slots</p>
        </div>

        {/* Max Capacity */}
        <div className="bg-gradient-to-b from-neutral-950 to-black border border-amber-500/35 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-amber-300/80">Capacity Cap</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {settings.totalCapacity}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Venue safety limit</p>
        </div>

        {/* Pending Manifest */}
        <div className="bg-gradient-to-b from-neutral-950 to-black border border-amber-500/35 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-amber-300/80">Pending List</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            {stats.pendingCount}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Awaiting door arrival</p>
        </div>
      </div>

      {/* Gold Occupancy Gauge */}
      <div className="bg-gradient-to-b from-neutral-950 to-black border border-amber-500/35 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-xs uppercase font-black tracking-wider text-amber-200">
              Real-Time Occupancy Gauge
            </span>
          </div>
          <span className="text-sm font-mono font-black text-amber-300">
            {stats.capacityPercent}% Full
          </span>
        </div>

        <div className="w-full h-4 bg-black rounded-full overflow-hidden p-0.5 border border-amber-500/40">
          <div
            className={`h-full rounded-full transition-all duration-500 shadow-md ${
              stats.capacityPercent > 90
                ? 'bg-red-500 shadow-red-500/50'
                : stats.capacityPercent > 75
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-amber-500/50'
                : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
            }`}
            style={{ width: `${Math.min(100, stats.capacityPercent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2 font-mono">
          <span>0 (Empty)</span>
          <span>{Math.round(settings.totalCapacity * 0.5)} (50%)</span>
          <span>{settings.totalCapacity} (Maximum Capacity)</span>
        </div>
      </div>

      {/* Admission Breakdown By Ticket Tier */}
      <div className="bg-gradient-to-b from-neutral-950 to-black border border-amber-500/35 rounded-2xl p-4 sm:p-5 shadow-lg">
        <h3 className="text-xs uppercase font-black tracking-wider text-amber-200 mb-3">
          Admission Breakdown By Ticket Tier
        </h3>

        <div className="space-y-3">
          {categoryStats.map((item) => (
            <div key={item.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-200">{item.category}</span>
                <span className="text-neutral-400 font-mono">
                  <span className="text-amber-300 font-bold">{item.checked}</span> / {item.total} checked in ({item.percent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-neutral-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    item.category === 'VIP'
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                      : item.category === 'Artist'
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-600'
                      : 'bg-amber-500/80'
                  }`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Entrance Gate Traffic & Live Activity Stream */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gate Traffic */}
        <div className="bg-gradient-to-b from-neutral-950 to-black border border-amber-500/35 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase font-black tracking-wider text-amber-200">
              Scans By Entrance Gate
            </h3>
            <MapPin className="w-4 h-4 text-amber-400" />
          </div>

          {Object.keys(gateCounts).length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">No door scans recorded yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(gateCounts).map(([gate, count]) => (
                <div
                  key={gate}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-amber-500/20 text-xs"
                >
                  <span className="font-semibold text-neutral-200 truncate max-w-[200px]">{gate}</span>
                  <span className="font-mono font-bold text-amber-300">{count} check-ins</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Timeline Stream */}
        <div className="bg-gradient-to-b from-neutral-950 to-black border border-amber-500/35 rounded-2xl p-4 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase font-black tracking-wider text-amber-200">
              Live Activity Feed
            </h3>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>

          {logs.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">Waiting for door activity...</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {logs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    log.type === 'CHECK_IN'
                      ? 'bg-neutral-900 border-amber-500/20'
                      : log.type === 'UNDO_CHECK_IN'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : log.type === 'SECURITY_FLAG'
                      ? 'bg-red-950/60 border-2 border-red-500 text-white'
                      : 'bg-red-950/40 border border-red-500/50 text-red-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-white truncate">{log.guestName}</p>
                      {log.type === 'DENIED_ATTEMPT' && (
                        <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded bg-red-600 text-white">
                          Re-Scan Blocked
                        </span>
                      )}
                      {log.type === 'SECURITY_FLAG' && (
                        <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded bg-amber-400 text-black">
                          Security Flag
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-amber-400/80 truncate mt-0.5">
                      {log.ticketId} • {log.scannerName} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {log.reason && (
                      <p className="text-[9px] text-neutral-400 italic truncate mt-0.5">{log.reason}</p>
                    )}
                  </div>

                  {log.type === 'CHECK_IN' && isManagement && (
                    <button
                      onClick={() => {
                        playClickSound();
                        const found = guests.find((g) => g.ticketId === log.ticketId);
                        if (found) undoCheckIn(found.id);
                      }}
                      className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px] text-amber-300 transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 border border-neutral-700"
                      title="Undo check-in"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>Undo</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
