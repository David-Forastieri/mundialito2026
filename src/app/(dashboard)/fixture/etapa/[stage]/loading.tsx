export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Back skeleton */}
      <div className="h-4 w-20 bg-gray-200 rounded-full" />

      {/* Header skeleton */}
      <div className="bg-gray-200 rounded-2xl h-28 px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-3 w-28 bg-gray-300 rounded-full mb-2" />
            <div className="h-9 w-48 bg-gray-300 rounded-xl mb-1" />
            <div className="h-3 w-36 bg-gray-300 rounded-full" />
          </div>
          <div className="h-8 w-14 bg-gray-300 rounded-xl" />
        </div>
      </div>

      {/* Matches skeleton */}
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 h-16" />
        ))}
      </div>
    </div>
  )
}
