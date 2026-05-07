interface Props {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
}

export function ScheduleHeader({ year, month, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={onPrev}
        aria-label="이전 달"
        className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-gray-200"
      >
        &lt; 이전
      </button>
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
        {year}년 {String(month).padStart(2, '0')}월 자원봉사활동 스케줄
      </h1>
      <button
        onClick={onNext}
        aria-label="다음 달"
        className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-gray-200"
      >
        다음 &gt;
      </button>
    </div>
  )
}
