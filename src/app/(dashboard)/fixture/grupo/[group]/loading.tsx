export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Back skeleton */}
      <div className="h-4 w-20 bg-gray-200 rounded-full" />

      {/* Header card skeleton */}
      <div className="rounded-2xl overflow-hidden">
        <div className="bg-gray-200 h-36 px-5 py-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="h-3 w-24 bg-gray-300 rounded-full mb-2" />
              <div className="h-10 w-28 bg-gray-300 rounded-xl" />
            </div>
            <div className="h-8 w-14 bg-gray-300 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 bg-gray-300 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Matches skeleton */}
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 h-16" />
        ))}
      </div>
    </div>
  )
}
