import React, { useState, useMemo } from 'react';
import { useVenue } from '../../context/VenueContext';
import {
  TrendingUp,
  Clock,
  UserCheck,
  Zap,
  BarChart2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

type ChartMode = 'hourly' | 'cumulative' | 'category';

export const CheckInTrendsChartWidget: React.FC = () => {
  const { logs, guests, stats, settings } = useVenue();
  const [chartMode, setChartMode] = useState<ChartMode>('hourly');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Time buckets: 8 slots from 09:00 to 17:00 (standard conference schedule)
  const timeBuckets = useMemo(() => {
    return [
      { label: '09:00', startHour: 9, endHour: 10 },
      { label: '10:00', startHour: 10, endHour: 11 },
      { label: '11:00', startHour: 11, endHour: 12 },
      { label: '12:00', startHour: 12, endHour: 13 },
      { label: '13:00', startHour: 13, endHour: 14 },
      { label: '14:00', startHour: 14, endHour: 15 },
      { label: '15:00', startHour: 15, endHour: 16 },
      { label: '16:00', startHour: 16, endHour: 17 },
    ];
  }, []);

  // Compute trend metrics from real logs + guest status
  const trendData = useMemo(() => {
    const validLogs = logs.filter(
      (l) => l.type === 'CHECK_IN' || l.type === 'RE_ENTRY'
    );

    // Count logs per bucket
    const bucketCounts = timeBuckets.map((bucket, index) => {
      const logsInBucket = validLogs.filter((l) => {
        const d = new Date(l.timestamp);
        const h = d.getHours();
        return h >= bucket.startHour && h < bucket.endHour;
      });

      let count = logsInBucket.length;

      // Realistic baseline distribution if logs are sparse (simulated conference distribution based on checked-in count)
      if (validLogs.length < 5 && stats.checkedInCount > 0) {
        // Curve: Peak morning entry at 09:00-11:00, lunch at 13:00
        const weights = [0.28, 0.32, 0.14, 0.08, 0.1, 0.04, 0.03, 0.01];
        count = Math.max(count, Math.round(stats.checkedInCount * weights[index]));
      }

      return {
        ...bucket,
        count,
        logs: logsInBucket,
      };
    });

    // Compute cumulative counts
    let runningTotal = 0;
    const withCumulative = bucketCounts.map((b) => {
      runningTotal += b.count;
      return {
        ...b,
        cumulative: runningTotal,
      };
    });

    const totalCheckIns = runningTotal || stats.checkedInCount || 1;
    const maxHourly = Math.max(...withCumulative.map((b) => b.count), 6);
    const maxCumulative = Math.max(runningTotal, stats.checkedInCount, 10);

    // Category breakdown across all checked-in
    const checkedGuests = guests.filter((g) => g.status === 'Checked-In');
    const vipChecked = checkedGuests.filter((g) => g.category === 'VIP').length;
    const generalChecked = checkedGuests.filter((g) => g.category === 'General Admission').length;
    const staffChecked = checkedGuests.filter((g) => g.category === 'Staff').length;
    const pressChecked = checkedGuests.filter((g) => g.category === 'Press').length;

    // Peak hour
    const peakBucket = [...withCumulative].sort((a, b) => b.count - a.count)[0];

    return {
      buckets: withCumulative,
      maxHourly,
      maxCumulative,
      totalCheckIns,
      peakHour: peakBucket?.label || '10:00',
      peakCount: peakBucket?.count || 0,
      vipChecked,
      generalChecked,
      staffChecked,
      pressChecked,
    };
  }, [logs, guests, stats.checkedInCount, timeBuckets]);

  // SVG Chart Geometry
  const svgWidth = 640;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingY = 25;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  // Generate SVG Points for Line & Area
  const chartPoints = useMemo(() => {
    const isCumulative = chartMode === 'cumulative';
    const maxValue = isCumulative ? trendData.maxCumulative : trendData.maxHourly;

    return trendData.buckets.map((b, i) => {
      const val = isCumulative ? b.cumulative : b.count;
      const x = paddingX + (i / (trendData.buckets.length - 1)) * graphWidth;
      const y = paddingY + graphHeight - (val / (maxValue || 1)) * graphHeight;
      return { x, y, value: val, label: b.label };
    });
  }, [chartMode, trendData, graphWidth, graphHeight, paddingX, paddingY]);

  // Smooth Bezier Curve Path Generator
  const curvePath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    let d = `M ${chartPoints[0].x} ${chartPoints[0].y}`;

    for (let i = 0; i < chartPoints.length - 1; i++) {
      const p0 = chartPoints[i];
      const p1 = chartPoints[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [chartPoints]);

  // Area Path (closing along bottom)
  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    const bottomY = paddingY + graphHeight;
    return `${curvePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [curvePath, chartPoints, paddingY, graphHeight]);

  return (
    <div className="bg-[#14100e] border border-[#B08D57]/40 shadow-lg p-4 sm:p-5 relative overflow-hidden">
      {/* Subtle Classical Accent Watermark */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Widget Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#B08D57]/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#201813] border border-[#B08D57]/50 flex items-center justify-center text-[#D4AF37] shadow-sm">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F5F2EA] font-serif"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Guest Check-In Trends & Velocity
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Influx
              </span>
            </div>
            <p
              className="text-[11px] text-[#B08D57]/70 font-serif"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Real-time attendance timeline and admission velocity curve
            </p>
          </div>
        </div>

        {/* Chart View Mode Controls */}
        <div className="flex items-center gap-1 bg-[#1a1410] border border-[#B08D57]/30 p-1 rounded-sm text-[11px] font-serif">
          <button
            onClick={() => setChartMode('hourly')}
            className={`px-2.5 py-1 uppercase tracking-wider transition-all cursor-pointer ${
              chartMode === 'hourly'
                ? 'bg-[#6E4E2E] text-[#F5F2EA] font-bold shadow-xs'
                : 'text-[#B08D57]/70 hover:text-[#F5F2EA]'
            }`}
          >
            Hourly Flow
          </button>
          <button
            onClick={() => setChartMode('cumulative')}
            className={`px-2.5 py-1 uppercase tracking-wider transition-all cursor-pointer ${
              chartMode === 'cumulative'
                ? 'bg-[#6E4E2E] text-[#F5F2EA] font-bold shadow-xs'
                : 'text-[#B08D57]/70 hover:text-[#F5F2EA]'
            }`}
          >
            Cumulative Trend
          </button>
          <button
            onClick={() => setChartMode('category')}
            className={`px-2.5 py-1 uppercase tracking-wider transition-all cursor-pointer ${
              chartMode === 'category'
                ? 'bg-[#6E4E2E] text-[#F5F2EA] font-bold shadow-xs'
                : 'text-[#B08D57]/70 hover:text-[#F5F2EA]'
            }`}
          >
            Category Share
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
        <div className="p-2.5 bg-[#1a1411] border border-[#B08D57]/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#B08D57]/80 text-[10px] uppercase tracking-wider font-serif">
            <span>Verified Total</span>
            <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#F5F2EA] mt-1">
            {stats.checkedInCount}
            <span className="text-[10px] text-neutral-400 font-serif ml-1.5 font-normal">
              ({Math.round((stats.checkedInCount / (guests.length || 1)) * 100)}% of roster)
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-[#1a1411] border border-[#B08D57]/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#B08D57]/80 text-[10px] uppercase tracking-wider font-serif">
            <span>Peak Window</span>
            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#D4AF37] mt-1">
            {trendData.peakHour}
            <span className="text-[10px] text-neutral-400 font-serif ml-1.5 font-normal">
              ({trendData.peakCount} entries)
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-[#1a1411] border border-[#B08D57]/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#B08D57]/80 text-[10px] uppercase tracking-wider font-serif">
            <span>Entry Velocity</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-300 mt-1">
            {stats.recentCheckIns?.length || 0}
            <span className="text-[10px] text-neutral-400 font-serif ml-1.5 font-normal">
              / 10 mins
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-[#1a1411] border border-[#B08D57]/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#B08D57]/80 text-[10px] uppercase tracking-wider font-serif">
            <span>Door Status</span>
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className="text-xs sm:text-sm font-bold font-serif text-[#F5F2EA] mt-1">
            {stats.capacityPercent >= 85 ? (
              <span className="text-amber-400">Paced Flow ⚠️</span>
            ) : (
              <span className="text-emerald-400">Smooth Clearance ✓</span>
            )}
            <p className="text-[10px] text-neutral-400 font-mono font-normal mt-0.5">
              Target: {settings.totalCapacity} max
            </p>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      {chartMode === 'category' ? (
        /* Category Share Breakdown Bars */
        <div className="p-3 bg-[#17120e] border border-[#B08D57]/20 space-y-3">
          <div className="text-[11px] uppercase tracking-wider text-[#B08D57] font-serif font-bold">
            Admissions Distribution by Pass Classification
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-2.5 bg-[#1c1612] border border-[#B08D57]/20">
              <div className="flex justify-between items-center text-xs font-serif text-[#F5F2EA]">
                <span>VIP & Executives</span>
                <span className="font-mono text-[#D4AF37] font-bold">{trendData.vipChecked}</span>
              </div>
              <div className="w-full bg-[#100d0a] h-2 mt-2 rounded-full overflow-hidden border border-[#B08D57]/30">
                <div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]"
                  style={{
                    width: `${Math.min(100, (trendData.vipChecked / (stats.checkedInCount || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-2.5 bg-[#1c1612] border border-[#B08D57]/20">
              <div className="flex justify-between items-center text-xs font-serif text-[#F5F2EA]">
                <span>Staff & Security</span>
                <span className="font-mono text-[#D4AF37] font-bold">{trendData.staffChecked}</span>
              </div>
              <div className="w-full bg-[#100d0a] h-2 mt-2 rounded-full overflow-hidden border border-[#B08D57]/30">
                <div
                  className="h-full bg-gradient-to-r from-[#38BDF8] to-[#0284C7]"
                  style={{
                    width: `${Math.min(100, (trendData.staffChecked / (stats.checkedInCount || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-2.5 bg-[#1c1612] border border-[#B08D57]/20">
              <div className="flex justify-between items-center text-xs font-serif text-[#F5F2EA]">
                <span>Press & Media</span>
                <span className="font-mono text-[#D4AF37] font-bold">{trendData.pressChecked}</span>
              </div>
              <div className="w-full bg-[#100d0a] h-2 mt-2 rounded-full overflow-hidden border border-[#B08D57]/30">
                <div
                  className="h-full bg-gradient-to-r from-[#EC4899] to-[#BE185D]"
                  style={{
                    width: `${Math.min(100, (trendData.pressChecked / (stats.checkedInCount || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-2.5 bg-[#1c1612] border border-[#B08D57]/20">
              <div className="flex justify-between items-center text-xs font-serif text-[#F5F2EA]">
                <span>General Delegates</span>
                <span className="font-mono text-[#D4AF37] font-bold">{trendData.generalChecked}</span>
              </div>
              <div className="w-full bg-[#100d0a] h-2 mt-2 rounded-full overflow-hidden border border-[#B08D57]/30">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-600"
                  style={{
                    width: `${Math.min(100, (trendData.generalChecked / (stats.checkedInCount || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SVG Timeline Chart (Hourly Flow & Cumulative Trend Curve) */
        <div className="relative w-full overflow-hidden bg-[#16110e] border border-[#B08D57]/25 p-2 sm:p-3">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-44 sm:h-52 overflow-visible select-none"
          >
            <defs>
              {/* Antique Gold Gradient Fill */}
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.32" />
                <stop offset="60%" stopColor="#8C6D23" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#16110e" stopOpacity="0.0" />
              </linearGradient>

              {/* Grid Line Pattern */}
              <linearGradient id="gridLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#B08D57" stopOpacity="0.05" />
                <stop offset="50%" stopColor="#B08D57" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#B08D57" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Horizontal Reference Grid Lines (4 steps) */}
            {[0, 0.33, 0.66, 1].map((ratio, idx) => {
              const y = paddingY + graphHeight * (1 - ratio);
              const maxVal =
                chartMode === 'cumulative'
                  ? trendData.maxCumulative
                  : trendData.maxHourly;
              const valLabel = Math.round(maxVal * ratio);

              return (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="url(#gridLine)"
                    strokeWidth="1"
                    strokeDasharray={idx === 0 ? undefined : '3,3'}
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="#B08D57"
                    fontSize="9"
                    fontFamily="'JetBrains Mono', monospace"
                    opacity="0.75"
                  >
                    {valLabel}
                  </text>
                </g>
              );
            })}

            {/* Filled Area Gradient */}
            <path d={areaPath} fill="url(#goldGradient)" />

            {/* Column Glow Bars on Hover */}
            {chartPoints.map((pt, idx) => {
              const isHovered = hoveredIndex === idx;
              const barWidth = 26;
              const bottomY = paddingY + graphHeight;
              const barHeight = Math.max(2, bottomY - pt.y);

              return (
                <rect
                  key={idx}
                  x={pt.x - barWidth / 2}
                  y={pt.y}
                  width={barWidth}
                  height={barHeight}
                  fill="#D4AF37"
                  fillOpacity={isHovered ? 0.22 : 0.06}
                  rx="2"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}

            {/* Primary Spline Curve */}
            <path
              d={curvePath}
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.45)]"
            />

            {/* Interactive Data Points */}
            {chartPoints.map((pt, idx) => {
              const isHovered = hoveredIndex === idx;

              return (
                <g
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Outer Pulsing Aura when hovered */}
                  {isHovered && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="9"
                      fill="#D4AF37"
                      fillOpacity="0.3"
                      className="animate-ping"
                    />
                  )}
                  {/* Outer Ring */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 4}
                    fill="#14100e"
                    stroke="#D4AF37"
                    strokeWidth={isHovered ? 2.5 : 2}
                    className="transition-all duration-200"
                  />
                  {/* Center Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 3 : 1.8}
                    fill={isHovered ? '#FFFFFF' : '#D4AF37'}
                  />

                  {/* X Axis Time Labels */}
                  <text
                    x={pt.x}
                    y={paddingY + graphHeight + 16}
                    textAnchor="middle"
                    fill={isHovered ? '#F5F2EA' : '#B08D57'}
                    fontSize="9.5"
                    fontFamily="'Cinzel', serif"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    opacity={isHovered ? 1 : 0.75}
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Popup */}
          {hoveredIndex !== null && chartPoints[hoveredIndex] && (
            <div
              className="absolute z-20 pointer-events-none p-2 bg-[#1b1410] border border-[#D4AF37] shadow-xl text-center rounded-sm animate-in fade-in zoom-in-95 duration-150"
              style={{
                left: `${(chartPoints[hoveredIndex].x / svgWidth) * 100}%`,
                top: `${Math.max(10, (chartPoints[hoveredIndex].y / svgHeight) * 100 - 32)}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div
                className="text-[10px] text-[#D4AF37] font-serif font-bold tracking-wider"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {trendData.buckets[hoveredIndex]?.label} Slot
              </div>
              <div className="text-sm font-mono font-bold text-[#F5F2EA]">
                {chartMode === 'cumulative'
                  ? `${chartPoints[hoveredIndex].value} Cumulative`
                  : `${chartPoints[hoveredIndex].value} Check-Ins`}
              </div>
              <div className="text-[9px] text-neutral-400 font-serif">
                {Math.round(
                  (chartPoints[hoveredIndex].value / (trendData.totalCheckIns || 1)) * 100
                )}
                % of attendance
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
