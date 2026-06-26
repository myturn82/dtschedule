-- 조직별 알림 설정
CREATE TABLE IF NOT EXISTS notification_settings (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id  uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_enabled boolean DEFAULT false NOT NULL,
  send_time  text DEFAULT '18:00' NOT NULL,
  recipients jsonb DEFAULT '{"assigned_members": true, "admins": false}'::jsonb NOT NULL,
  msg_template text DEFAULT '안녕하세요! 내일 {{date}} {{slot}} 배정이 있습니다. ({{org}})' NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 인앱 알림 기록
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id  uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL,
  type       text DEFAULT 'd1_reminder' NOT NULL,
  is_read    boolean DEFAULT false NOT NULL,
  metadata   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 웹 푸시 구독 정보
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tenant_id  uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  endpoint   text NOT NULL,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subscriptions(endpoint);

-- RLS 활성화
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions    ENABLE ROW LEVEL SECURITY;

-- notification_settings: 조직 admin이 조회/수정
CREATE POLICY "ns_tenant_admin" ON notification_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = notification_settings.tenant_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_approved = true
    )
  );

CREATE POLICY "ns_super_admin" ON notification_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- notifications: 본인 알림만 조회/수정
CREATE POLICY "notif_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- push_subscriptions: 본인 구독만 관리
CREATE POLICY "push_sub_own" ON push_subscriptions FOR ALL USING (user_id = auth.uid());

-- Realtime (INSERT 이벤트만 사용하므로 REPLICA IDENTITY FULL 불필요)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
