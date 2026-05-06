import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Assignment } from '../types'

interface RealtimeOptions {
  year: number
  month: number
  onInsert: (assignment: Assignment) => void
  onUpdate: (assignment: Assignment) => void
  onDelete: (id: string) => void
}

export function useRealtime({ year, month, onInsert, onUpdate, onDelete }: RealtimeOptions) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${year}-${month}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'assignments', filter: `year=eq.${year}` },
        payload => onInsert(payload.new as Assignment)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'assignments', filter: `year=eq.${year}` },
        payload => onUpdate(payload.new as Assignment)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'assignments' },
        payload => onDelete(payload.old.id as string)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [year, month, onInsert, onUpdate, onDelete])
}
