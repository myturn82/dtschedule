export function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-gray-700 dark:text-gray-300 mt-3 mb-1 px-1">
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-4 rounded bg-pink-100 dark:bg-pink-900 border border-pink-300 dark:border-pink-700" />
        <span>★ 밤타임 (18~22시)</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700" />
        <span>★ 토요일 운영 (10~14시)</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-4 rounded bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500" />
        <span>BREAKTIME (12~13시)</span>
      </div>
    </div>
  )
}
