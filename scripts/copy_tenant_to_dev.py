#!/usr/bin/env python3
"""
운영 DB의 특정 테넌트 데이터를 개발 DB로 복사.
auth.users 참조(user_id)는 NULL 처리 (auth는 프로젝트 간 공유 불가).
"""
import json, sys, urllib.request, urllib.error

TOKEN    = open('/c/Users/mytur/.supabase/access-token').read().strip()
PROD_REF = 'bjnmaajhcmhxwonybnqc'
DEV_REF  = 'mcuszdvophmqrwostcah'
PROD_TID = '5ce56d3f-8cd7-4d61-bec9-d6cc04a9d0d7'
DEV_TID  = 'ec6baec1-b257-4097-b4d0-ce158ea969f4'

# 이 테이블들의 user_id 는 auth.users FK → NULL 처리
NULL_USER_TABLES = {'lesson_packages', 'assignments'}

def api_query(ref, sql, label=''):
    url  = f'https://api.supabase.com/v1/projects/{ref}/database/query'
    body = json.dumps({'query': sql}).encode('utf-8')
    req  = urllib.request.Request(url, body,
           {'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        msg = e.read().decode('utf-8')
        print(f'  ❌ HTTP {e.code} {label}: {msg[:200]}')
        return None

def lit(v):
    """Python 값 → SQL 리터럴"""
    if v is None:
        return 'NULL'
    if isinstance(v, bool):
        return 'TRUE' if v else 'FALSE'
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v).replace("'", "''")
    return f"'{s}'"

def copy_table(table, order_by='id'):
    print(f'\n▶ {table}')

    # 1. 운영에서 조회
    rows = api_query(PROD_REF,
        f"SELECT * FROM {table} WHERE tenant_id = '{PROD_TID}' ORDER BY {order_by}",
        'SELECT')
    if rows is None:
        return
    if not rows:
        print(f'  (운영 데이터 없음)')
        return
    print(f'  운영 {len(rows)}건 조회')

    # 2. 개발에서 삭제
    api_query(DEV_REF, f"DELETE FROM {table} WHERE tenant_id = '{DEV_TID}'", 'DELETE')
    print(f'  개발 기존 데이터 삭제')

    # 3. 개발에 삽입
    cols = list(rows[0].keys())
    ok = err = 0
    for row in rows:
        vals = []
        for c in cols:
            v = row[c]
            if c == 'tenant_id':
                v = DEV_TID
            elif c == 'user_id' and table in NULL_USER_TABLES:
                v = None
            vals.append(lit(v))
        sql = (f"INSERT INTO {table} ({', '.join(cols)}) "
               f"VALUES ({', '.join(vals)}) ON CONFLICT DO NOTHING")
        res = api_query(DEV_REF, sql, f'INSERT row')
        if res is not None:
            ok += 1
        else:
            err += 1
    print(f'  삽입 완료 {ok}건' + (f', 실패 {err}건' if err else ''))

# ── 부모 테이블 먼저, 자식 테이블 나중에 ──
copy_table('tenant_roles',        'id')
copy_table('time_slots',          'id')
copy_table('lesson_package_types','id')
copy_table('slot_settings',       'id')
copy_table('schedule_rules',      'id')
copy_table('date_overrides',      'date')
copy_table('lesson_packages',     'created_at')
copy_table('assignments',         'year, month, day, created_at')

print('\n✅ 완료')
