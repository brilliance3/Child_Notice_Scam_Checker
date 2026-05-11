// Vercel Serverless: 문자 분석 요청을 받아 규칙·AI 기반 결과를 JSON으로 반환한다
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AnalyzeRequest } from '../src/types/analysis.ts';
import { runAnalyze } from '../src/server/runAnalyze.ts';

function readMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const msg = (body as AnalyzeRequest).message;
  if (typeof msg !== 'string') return null;
  const trimmed = msg.trim();
  return trimmed.length ? trimmed : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: '허용되지 않은 메서드입니다.' });
    return;
  }

  try {
    const message = readMessage(req.body);
    if (!message) {
      res.status(400).json({ error: 'message 필드에 분석할 문자를 입력해주세요.' });
      return;
    }

    const openAiApiKey = process.env.OPENAI_API_KEY;
    const result = await runAnalyze(message, openAiApiKey);
    res.status(200).json(result);
  } catch {
    res.status(500).json({ error: '분석 중 오류가 발생했습니다.' });
  }
}
