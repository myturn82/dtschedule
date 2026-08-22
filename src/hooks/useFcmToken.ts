import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useFcmToken() {
  const { profile } = useAuth()

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !profile?.id) return

    let active = true
    const userId = profile.id

    async function init() {
      let perm = await PushNotifications.checkPermissions()
      if (perm.receive === 'prompt') {
        perm = await PushNotifications.requestPermissions()
      }
      if (perm.receive !== 'granted') return

      await PushNotifications.register()

      PushNotifications.addListener('registration', async ({ value: token }) => {
        if (!active) return
        await supabase.from('push_tokens').upsert(
          { user_id: userId, token, platform: 'android' },
          { onConflict: 'user_id,token' },
        )
      })

      PushNotifications.addListener('registrationError', (err) => {
        console.error('[FCM] 토큰 등록 실패:', err.error)
      })

      // 앱이 포그라운드일 때 수신된 알림 (OS 알림창 없이 수신됨)
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[FCM] 포그라운드 알림:', notification.title)
      })

      // 사용자가 OS 알림을 탭해서 앱 진입
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[FCM] 알림 탭:', action.notification.title)
      })
    }

    init()

    return () => {
      active = false
      PushNotifications.removeAllListeners()
    }
  }, [profile?.id])
}
