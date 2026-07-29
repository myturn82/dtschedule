import { useEffect, useState } from 'react'
import { countOpenFeedback, type FeedbackScope } from '../lib/feedback'

type BadgeScope = Exclude<FeedbackScope, { kind: 'mine'; userId: string }> | null

export function useFeedbackBadge(scope: BadgeScope, reloadKey = 0) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!scope) { setCount(0); return }
    let cancelled = false
    countOpenFeedback(scope).then(n => { if (!cancelled) setCount(n) })
    return () => { cancelled = true }
  }, [scope?.kind, scope && 'tenantId' in scope ? scope.tenantId : null, reloadKey])

  return count
}
