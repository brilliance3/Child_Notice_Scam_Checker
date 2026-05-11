// 규칙 기반 위험 점수(0~100)와 근거 문구를 계산한다
import {
  BRAND_SQUAT_KEYWORDS,
  CHILD_NOTICE_KEYWORDS,
  EXTERNAL_PAYMENT_PHRASES,
  PAYMENT_KEYWORDS,
  PERSONAL_INFO_KEYWORDS,
  SHORTENER_HOST_FRAGMENTS,
  SUSPICIOUS_TLD_REGEX,
  URGENCY_KEYWORDS,
} from '../data/riskRules';

export type RiskLevel = 'low' | 'caution' | 'high' | 'critical';

export interface RiskScoreBreakdown {
  score: number;
  reasons: string[];
}

function tryParseHostname(url: string): string | null {
  try {
    const withProto = url.startsWith('http') ? url : `https://${url}`;
    return new URL(withProto).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function hasVagueInstitutionLabel(message: string): boolean {
  const vague = ['[학교알림]', '[학교]', '[알림]', '[공지]', '[긴급]'];
  const hasBracket = /\[[^\]]{1,12}\]/.test(message);
  const hasNamedSchool = /\[[가-힣a-zA-Z0-9]{2,20}(초등학교|중학교|고등학교|학교|유치원)\]/.test(
    message,
  );
  if (hasNamedSchool) return false;
  if (vague.some((v) => message.includes(v))) return true;
  if (hasBracket && !/[가-힣]{2,}/.test(message.split('\n')[0] ?? '')) return false;
  return false;
}

function hasBrandSquattingInHost(hostname: string): boolean {
  const h = hostname.replace(/^www\./, '');
  let hits = 0;
  for (const kw of BRAND_SQUAT_KEYWORDS) {
    if (h.includes(kw)) hits += 1;
  }
  return hits >= 2;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 81) return 'critical';
  if (score >= 61) return 'high';
  if (score >= 31) return 'caution';
  return 'low';
}

export function calculateRiskScore(message: string, urls: string[]): RiskScoreBreakdown {
  let score = 0;
  const reasons: string[] = [];
  const lowerMessage = message.toLowerCase();

  const add = (delta: number, reason: string) => {
    score += delta;
    reasons.push(reason);
  };

  if (PAYMENT_KEYWORDS.some((k) => message.includes(k))) {
    add(15, '결제·납부·급식 등 금전 관련 표현이 포함되어 있습니다.');
  }

  if (URGENCY_KEYWORDS.some((k) => message.includes(k))) {
    add(15, '오늘까지·긴급·정지·취소 등 압박성 표현이 포함되어 있습니다.');
  }

  if (CHILD_NOTICE_KEYWORDS.some((k) => message.includes(k))) {
    add(10, '학교·학원·돌봄·급식 등 자녀 관련 알림을 사칭할 수 있는 표현이 있습니다.');
  }

  if (PERSONAL_INFO_KEYWORDS.some((k) => lowerMessage.includes(k.toLowerCase()))) {
    add(20, '개인정보·인증·계좌 등 민감 정보 입력을 유도할 수 있는 표현이 있습니다.');
  }

  if (
    urls.length > 0 &&
    EXTERNAL_PAYMENT_PHRASES.some((p) => message.includes(p))
  ) {
    add(15, '외부 링크로 결제·입금을 유도하는 문구가 함께 있습니다.');
  }

  if (hasVagueInstitutionLabel(message)) {
    add(10, '기관명이 구체적이지 않은 알림 형태입니다.');
  }

  let anyHttp = false;
  let anyShortener = false;
  let suspiciousTld = false;
  let digitNoise = false;
  let hyphenNoise = false;
  let brandSquat = false;

  for (const url of urls) {
    const n = url.toLowerCase();
    if (n.startsWith('http://')) anyHttp = true;

    if (SHORTENER_HOST_FRAGMENTS.some((s) => n.includes(s))) {
      anyShortener = true;
    }

    if (SUSPICIOUS_TLD_REGEX.test(n)) suspiciousTld = true;

    if (/[0-9]{3,}/.test(n)) digitNoise = true;

    if ((n.match(/-/g) ?? []).length >= 2) hyphenNoise = true;

    const host = tryParseHostname(url);
    if (host && hasBrandSquattingInHost(host)) brandSquat = true;
  }

  if (anyHttp) {
    add(10, 'HTTPS가 아닌 http 링크가 포함되어 있습니다.');
  }

  if (anyShortener) {
    add(15, '단축 URL(bit.ly, t.ly 등)이 포함되어 있습니다.');
  }

  if (digitNoise) {
    add(10, '도메인에 숫자가 과도하게 포함된 형태가 있습니다.');
  }

  if (hyphenNoise) {
    add(10, '도메인에 하이픈이 여러 번 포함된 형태가 있습니다.');
  }

  if (suspiciousTld) {
    add(10, '피싱에 자주 쓰이는 의심 TLD(.site, .xyz 등)가 포함되어 있습니다.');
  }

  if (brandSquat) {
    add(10, '도메인에 school·edu·pay 등 교육·결제 관련 단어가 조합되어 있습니다.');
  }

  return {
    score: Math.min(score, 100),
    reasons: [...new Set(reasons)],
  };
}
