// Vercel Serverless: 문자 분석 요청을 받아 규칙·AI 기반 결과를 JSON으로 반환한다
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AnalyzeRequest } from '../src/types/analysis.ts';
import { runAnalyze } from '../src/server/runAnalyze.ts';

function coerceJsonBody(body: unknown): unknown {
  if (body == null) return null;
  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString('utf8')) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as unknown;
    } catch {
      return null;
    }
  }
  return body;
}

function readMessage(body: unknown): string | null {
  const parsed = coerceJsonBody(body);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const msg = (parsed as AnalyzeRequest).message;
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

    const openAiApiKey = process.env.OPENAI_API_KEY?.trim() || undefined;
    const result = await runAnalyze(message, openAiApiKey);
    res.status(200).json(result);
  } catch (err) {
    console.error('[api/analyze]', err);
    res.status(500).json({ error: '분석 중 오류가 발생했습니다.' });
  }
}
