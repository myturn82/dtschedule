import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useTenant } from '../contexts/TenantContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0))).buffer
}

export function usePushSubscription() {
  const { profile } = useAuth()
  const { tenant } = useTenant()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isSupported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window

  useEffect(() => {
    if (!isSupported || !profile?.id) return
    navigator.serviceWorker.ready.then(async reg => {
      const sub = await reg.pushManager.getSubscription()
      setIsSubscribed(!!sub)
    }).catch(() => {})
  }, [profile?.id, isSupported])

  async function subscribe() {
    if (!profile?.id || !tenant?.id || !VAPID_PUBLIC_KEY || !isSupported) return
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const keyBuffer = sub.getKey('p256dh')
      const authBuffer = sub.getKey('auth')
      const p256dh = keyBuffer
        ? btoa(String.fromCharCode(...new Uint8Array(keyBuffer)))
        : ''
      const auth = authBuffer
        ? btoa(String.fromCharCode(...new Uint8Array(authBuffer)))
        : ''
      await supabase.from('push_subscriptions').upsert(
        { user_id: profile.id, tenant_id: tenant.id, endpoint: sub.endpoint, p256dh, auth },
        { onConflict: 'endpoint' }
      )
      setIsSubscribed(true)
    } catch (err) {
      console.error('Push subscription failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribe() {
    if (!isSupported) return
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setIsSubscribed(false)
    } finally {
      setIsLoading(false)
    }
  }

  return { isSubscribed, isLoading, isSupported, subscribe, unsubscribe }
}
