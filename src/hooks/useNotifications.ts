import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface AppNotification {
  id: string
  tenant_id: string
  user_id: string
  title: string
  body: string
  type: string
  is_read: boolean
  metadata: { date?: string; slot?: string }
  created_at: string
}

export function useNotifications() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    if (!profile?.id) return

    setLoading(true)
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setNotifications((data ?? []) as AppNotification[])
        setLoading(false)
      })

    const channel = supabase
      .channel(`notifications-${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as AppNotification, ...prev.slice(0, 19)])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          setNotifications(prev =>
            prev.map(n => n.id === (payload.new as AppNotification).id ? payload.new as AppNotification : n)
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.id])

  async function markAsRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  async function markAllAsRead() {
    if (!profile?.id) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false)
  }

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
