export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-800/50 rounded ${className}`} />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-5">
      <Skeleton className="w-5 h-5 mb-3" />
      <Skeleton className="w-16 h-7 mb-2" />
      <Skeleton className="w-24 h-3" />
    </div>
  )
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-gray-800/30">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-3.5 flex items-center gap-4">
          <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-3/4 h-4" />
            <Skeleton className="w-1/2 h-3" />
          </div>
        </div>
      ))}
    </div>
  )
}
