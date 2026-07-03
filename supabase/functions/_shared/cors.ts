// 브라우저에서 호출을 허용할 오리진 목록.
// curl/GitHub Actions 등 서버 간 호출은 Origin 헤더 자체가 없어 CORS의 영향을 받지 않으므로
// 여기 없더라도 정상 동작한다 — 이 목록은 "브라우저에서" 응답을 읽을 수 있는지만 제어한다.
const ALLOWED_ORIGINS = ['https://dtschedule.vercel.app', 'http://localhost:5173']

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin')
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
