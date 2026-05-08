interface Props {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
}

export function ScheduleHeader({ year, month, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
      <button
        onClick={onPrev}
        aria-label="이전 달"
        className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs sm:text-sm dark:text-gray-200 shrink-0"
      >
        &lt; 이전
      </button>
      <h1 className="text-sm sm:text-xl font-bold text-gray-800 dark:text-gray-100 text-center leading-tight">
        <span className="sm:hidden">{year}년 {String(month).padStart(2, '0')}월<br /><span className="text-xs font-medium text-gray-500 dark:text-gray-400">자원봉사 스케줄</span></span>
        <span className="hidden sm:inline">{year}년 {String(month).padStart(2, '0')}월 자원봉사활동 스케줄</span>
      </h1>
      <button
        onClick={onNext}
        aria-label="다음 달"
        className="px-2 sm:px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs sm:text-sm dark:text-gray-200 shrink-0"
      >
        다음 &gt;
      </button>
    </div>
  )
}
