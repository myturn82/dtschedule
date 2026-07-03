// supabase.functions.invoke()가 non-2xx 응답을 받으면 error.message는 항상
// "Edge Function returned a non-2xx status code"로 뭉뚱그려진다.
// 실제 에러 문구는 error.context(원본 Response)의 JSON 바디에 들어있으므로 꺼내서 사용한다.
export async function getFunctionErrorMessage(error: unknown, fallback = '오류가 발생했습니다.'): Promise<string> {
  if (!error) return fallback
  const context = (error as { context?: Response }).context
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.json()
      if (body?.error) return body.error as string
    } catch { /* 본문이 JSON이 아니면 무시하고 폴백 */ }
  }
  return (error as Error).message ?? fallback
}
