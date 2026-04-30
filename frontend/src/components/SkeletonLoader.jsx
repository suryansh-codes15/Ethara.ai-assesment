export default function SkeletonLoader({ type = 'default' }) {
  if (type === 'stat') {
    return (
      <div className="card p-5 flex items-center gap-4">
        <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-7 w-16 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
    );
  }

  if (type === 'task') {
    return (
      <div className="rounded-xl p-3.5 space-y-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderLeft: '3px solid rgba(255,255,255,0.08)' }}>
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton w-5 h-5 rounded-full" />
        </div>
      </div>
    );
  }

  if (type === 'project') {
    return (
      <div className="card p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1">
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-5 w-36 rounded" />
          </div>
          <div className="skeleton w-10 h-10 rounded-full" />
        </div>
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-2 w-full rounded-full" />
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton w-7 h-7 rounded-full" />)}
          </div>
          <div className="skeleton h-4 w-16 rounded" />
        </div>
      </div>
    );
  }

  // default — full page skeleton
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-8 w-56 rounded-lg" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
        <div className="skeleton h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl p-3.5 space-y-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

const StatSkeleton = () => (
  <div className="card p-5 flex items-center gap-4">
    <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="skeleton h-7 w-16 rounded" />
      <div className="skeleton h-3 w-24 rounded" />
    </div>
  </div>
);
