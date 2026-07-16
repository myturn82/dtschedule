import { useState, useCallback } from 'react'

export function useAiParse<TArgs extends unknown[], TProposal>(
  parseFn: (...args: TArgs) => Promise<{ proposal: TProposal | null; error: string | null }>
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (...args: TArgs): Promise<TProposal | null> => {
    setLoading(true); setError(null)
    const { proposal, error: err } = await parseFn(...args)
    setLoading(false)
    if (err) { setError(err); return null }
    return proposal
  }, [parseFn])

  return { run, loading, error, setError }
}
