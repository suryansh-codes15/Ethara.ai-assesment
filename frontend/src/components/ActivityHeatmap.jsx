import { useMemo } from 'react';

const WEEKS = 52;
const DAYS = 7;

const getColor = (count) => {
  if (!count || count === 0) return 'rgba(255,255,255,0.04)';
  if (count === 1) return 'rgba(99,102,241,0.25)';
  if (count === 2) return 'rgba(99,102,241,0.45)';
  if (count <= 4) return 'rgba(99,102,241,0.65)';
  return 'rgba(99,102,241,0.9)';
};

export default function ActivityHeatmap({ data = {} }) {
  const cells = useMemo(() => {
    const today = new Date();
    const result = [];
    for (let w = WEEKS - 1; w >= 0; w--) {
      const week = [];
      for (let d = 0; d < DAYS; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (w * 7 + (DAYS - 1 - d)));
        const key = date.toISOString().slice(0, 10);
        week.push({ date: key, count: data[key] || 0 });
      }
      result.push(week);
    }
    return result;
  }, [data]);

  const months = useMemo(() => {
    const today = new Date();
    const labels = [];
    let lastMonth = -1;
    cells.forEach((week, wi) => {
      const d = new Date(week[0].date);
      if (d.getMonth() !== lastMonth) {
        labels.push({ wi, label: d.toLocaleString('default', { month: 'short' }) });
        lastMonth = d.getMonth();
      }
    });
    return labels;
  }, [cells]);

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Month labels */}
        <div className="flex ml-8 mb-1">
          {months.map(({ wi, label }) => (
            <div key={wi} className="text-[10px] text-[var(--text-muted)]" style={{ marginLeft: `${wi * 13}px`, position: 'absolute', position: 'static' }}>
              {label}
            </div>
          ))}
        </div>

        <div className="flex gap-1.5">
          {/* Day labels */}
          <div className="flex flex-col gap-1 justify-end pb-0.5">
            {[1, 3, 5].map(d => (
              <div key={d} className="text-[9px] text-[var(--text-muted)] h-[10px] leading-[10px] w-6">
                {DAY_LABELS[d]}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {cells.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    title={`${cell.date}: ${cell.count} task${cell.count !== 1 ? 's' : ''} done`}
                    className="w-2.5 h-2.5 rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-indigo-400"
                    style={{ background: getColor(cell.count) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-[var(--text-muted)]">Less</span>
          {[0, 1, 2, 3, 5].map(c => (
            <div key={c} className="w-2.5 h-2.5 rounded-sm" style={{ background: getColor(c) }} />
          ))}
          <span className="text-[10px] text-[var(--text-muted)]">More</span>
        </div>
      </div>
    </div>
  );
}
