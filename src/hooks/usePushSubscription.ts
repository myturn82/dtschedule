import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useTenant } from '../contexts/TenantContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const cleaned = base64String.trim()
  const padding = '='.repeat((4 - (cleaned.length % 4)) % 4)
  const base64 = (cleaned + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const result = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    result[i] = rawData.charCodeAt(i)
  }
  return result
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
    console.log('[Push] subscribe() called', { profileId: profile?.id, tenantId: tenant?.id, vapid: !!VAPID_PUBLIC_KEY, supported: isSupported, isSubscribed })
    if (!profile?.id || !tenant?.id || !VAPID_PUBLIC_KEY || !isSupported) {
      console.warn('[Push] subscribe blocked:', { profileId: !!profile?.id, tenantId: !!tenant?.id, vapid: !!VAPID_PUBLIC_KEY, supported: isSupported })
      return
    }
    setIsLoading(true)
    try {
      console.log('[Push] waiting for serviceWorker.ready...')
      const reg = await navigator.serviceWorker.ready
      console.log('[Push] SW ready, subscribing pushManager...')
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      console.log('[Push] pushManager.subscribe() success, endpoint:', sub.endpoint.slice(0, 40))
      const keyBuffer = sub.getKey('p256dh')
      const authBuffer = sub.getKey('auth')
      const p256dh = keyBuffer
        ? btoa(String.fromCharCode(...new Uint8Array(keyBuffer)))
        : ''
      const auth = authBuffer
        ? btoa(String.fromCharCode(...new Uint8Array(authBuffer)))
        : ''
      console.log('[Push] upserting to DB...', { user_id: profile.id, tenant_id: tenant.id })
      const { error: upsertErr } = await supabase.from('push_subscriptions').upsert(
        { user_id: profile.id, tenant_id: tenant.id, endpoint: sub.endpoint, p256dh, auth },
        { onConflict: 'endpoint' }
      )
      if (upsertErr) {
        console.error('[Push] DB save failed:', upsertErr.message, upsertErr.code, upsertErr.details)
        return
      }
      console.log('[Push] DB save success!')
      setIsSubscribed(true)
    } catch (err) {
      console.error('[Push] subscribe failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribe() {
    console.log('[Push] unsubscribe() called', { isSubscribed })
    if (!isSupported) return
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      console.log('[Push] current browser subscription:', sub ? sub.endpoint.slice(0, 40) : 'none')
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
        console.log('[Push] unsubscribed from browser + DB')
      }
      setIsSubscribed(false)
    } finally {
      setIsLoading(false)
    }
  }

  return { isSubscribed, isLoading, isSupported, subscribe, unsubscribe }
}
