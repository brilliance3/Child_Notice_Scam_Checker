// Vercel Serverless: 문자 분석 요청을 단일 파일 로직으로 처리해 런타임 의존성 문제를 줄인다
type RiskLevel = 'low' | 'caution' | 'high' | 'critical';

type AnalyzeResult = {
  riskScore: number;
  riskLevel: RiskLevel;
  scamType: string;
  detectedUrls: string[];
  riskReasons: string[];
  recommendedActions: string[];
  confirmationMessage: string;
  reportText: string;
  riskSummary: string;
};

const URL_REGEX =
  /(https?:\/\/[^\s<>"'()[\]{}]+|www\.[^\s<>"'()[\]{}]+|(?:bit\.ly|t\.ly|tinyurl\.com|goo\.gl|me2\.kr)\/[^\s<>"'()[\]{}]+)/gi;

function normalizeMessage(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 2000);
}

function extractUrls(text: string): string[] {
  const raw = text.match(URL_REGEX) ?? [];
  const cleaned = raw.map((u) => u.trim().replace(/[),.;:]+$/g, ''));
  return [...new Set(cleaned)];
}

function classifyScamType(message: string): string {
  if (message.includes('급식') || message.includes('납부')) return '급식·납부 사칭 의심';
  if (message.includes('학원') || message.includes('교재비') || message.includes('수강료')) {
    return '학원 알림 사칭 의심';
  }
  if (message.includes('돌봄') || message.includes('방과후')) return '돌봄교실 사칭 의심';
  if (message.includes('체험학습') || message.includes('출결') || message.includes('학교')) {
    return '학교 알림 사칭 의심';
  }
  if (message.includes('배송') || message.includes('주소') || message.includes('택배')) {
    return '교재·배송 사칭 의심';
  }
  return '일반 피싱 의심';
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 81) return 'critical';
  if (score >= 61) return 'high';
  if (score >= 31) return 'caution';
  return 'low';
}

function calculateRisk(message: string, urls: string[]): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const add = (n: number, reason: string) => {
    score += n;
    reasons.push(reason);
  };

  const has = (arr: string[]) => arr.some((x) => message.includes(x));
  if (has(['결제', '납부', '미납', '입금', '환불', '수강료', '교재비', '급식비'])) {
    add(15, '결제·납부 등 금전 관련 표현이 포함되어 있습니다.');
  }
  if (has(['긴급', '오늘까지', '즉시', '정지', '취소', '제한', '마감', '불이익'])) {
    add(15, '오늘까지·긴급·정지·취소 등 압박성 표현이 포함되어 있습니다.');
  }
  if (has(['학교', '학원', '돌봄', '급식', '체험학습', '방과후', '출결'])) {
    add(10, '학교·학원·돌봄 등 자녀 관련 알림을 사칭할 수 있는 표현이 있습니다.');
  }
  if (has(['개인정보', '인증번호', '비밀번호', '계좌', '주민등록', '카드번호'])) {
    add(20, '개인정보·인증·계좌 등 민감 정보 입력 유도 표현이 포함되어 있습니다.');
  }
  if (urls.length && has(['아래 링크', '링크에서', '결제하세요', '결제 바랍', '입금해'])) {
    add(15, '외부 링크로 결제·입금을 유도하는 문구가 함께 있습니다.');
  }

  for (const url of urls.map((u) => u.toLowerCase())) {
    if (url.startsWith('http://')) add(10, 'HTTPS가 아닌 http 링크가 포함되어 있습니다.');
    if (/(bit\.ly|t\.ly|tinyurl\.com|goo\.gl|me2\.kr)/.test(url)) {
      add(15, '단축 URL(bit.ly, t.ly 등)이 포함되어 있습니다.');
    }
    if (/[0-9]{3,}/.test(url)) add(10, '도메인에 숫자가 과도하게 포함된 형태가 있습니다.');
    if ((url.match(/-/g) ?? []).length >= 2) add(10, '도메인에 하이픈이 여러 번 포함되어 있습니다.');
    if (/\.(xyz|top|site|click|shop|info|tk|ml|ga|cfd|zip|mov)(\/|$|\?|#)/.test(url)) {
      add(10, '피싱에 자주 쓰이는 의심 TLD(.site, .xyz 등)가 포함되어 있습니다.');
    }
  }

  return { score: Math.min(score, 100), reasons: [...new Set(reasons)] };
}

function coerceJsonBody(body: unknown): unknown {
  if (body == null) return null;
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
  const msg = (parsed as { message?: unknown }).message;
  if (typeof msg !== 'string') return null;
  const trimmed = msg.trim();
  return trimmed.length ? trimmed : null;
}

function buildResult(rawMessage: string): AnalyzeResult {
  const message = normalizeMessage(rawMessage);
  const urls = extractUrls(message);
  const { score, reasons } = calculateRisk(message, urls);
  const riskLevel = getRiskLevel(score);
  const scamType = classifyScamType(message);
  const recommendedActions = [
    '문자에 포함된 링크를 누르지 마세요.',
    '학교·학원·담임교사의 공식 연락처로 직접 사실 여부를 확인하세요.',
    '문자 내용을 캡처해 보관하고 필요 시 신고에 활용하세요.',
  ];
  const riskSummary = `규칙 기준 위험도는 ${score}점이며, ${scamType} 가능성을 의심할 수 있습니다. 이 결과는 참고용이며 100% 판별이 아닙니다.`;
  const confirmationMessage = [
    '안녕하세요. 방금 아래와 같은 알림 문자를 받았습니다.',
    '',
    '[문자 내용 요약]',
    message.length > 200 ? `${message.slice(0, 200)}…` : message,
    '',
    '혹시 실제 발송된 안내인지 확인 부탁드립니다.',
    '링크는 아직 클릭하지 않았습니다.',
  ].join('\n');
  const reportText = [
    '[피싱 의심 문자 분석 리포트]',
    '',
    `위험도: ${score}점 / 100점`,
    `사칭 유형: ${scamType}`,
    `탐지된 URL: ${urls.length ? urls.join(', ') : '없음'}`,
    '',
    '주요 위험 요소:',
    ...reasons.map((r) => `- ${r}`),
    '',
    '권장 조치:',
    ...recommendedActions.map((a) => `- ${a}`),
  ].join('\n');

  return {
    riskScore: score,
    riskLevel,
    scamType,
    detectedUrls: urls,
    riskReasons: reasons.length ? reasons : ['명확한 위험 요인이 충분히 탐지되지 않았습니다.'],
    recommendedActions,
    confirmationMessage,
    reportText,
    riskSummary,
  };
}

type ServerlessRequest = {
  method?: string;
  body?: unknown;
};

type ServerlessResponse = {
  status: (code: number) => { json: (payload: unknown) => void };
};

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
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

    const result = buildResult(message);
    res.status(200).json(result);
  } catch (err) {
    console.error('[api/analyze:fatal]', err);
    res.status(500).json({ error: '분석 중 오류가 발생했습니다.' });
  }
}
