-- 슈퍼관리자가 profiles를 삭제할 수 있도록 DELETE 정책 추가
-- 기존 rejectAdmin 및 신규 사용자 관리 탭 삭제 기능 지원

CREATE POLICY "profiles_superadmin_delete"
  ON profiles
  FOR DELETE
  USING (
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid())
  );
