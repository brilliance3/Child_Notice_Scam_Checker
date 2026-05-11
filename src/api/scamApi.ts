// 프론트엔드에서 분석 API(/api/analyze)를 호출하는 클라이언트
import type { AnalyzeRequest, AnalyzeResult } from '../types/analysis';

export async function analyzeMessage(payload: AnalyzeRequest): Promise<AnalyzeResult> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = '요청에 실패했습니다.';
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return res.json() as Promise<AnalyzeResult>;
}
