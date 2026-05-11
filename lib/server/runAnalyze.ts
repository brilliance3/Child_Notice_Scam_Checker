// 규칙 분석과 OpenAI 호출을 묶어 최종 AnalyzeResult를 만든다
import type { AnalyzeResult } from '../types/analysis';
import { calculateRiskScore, getRiskLevel, type RiskLevel } from '../utils/calculateRiskScore';
import { classifyScamType } from '../utils/classifyScamType';
import { extractUrls } from '../utils/extractUrls';
import { normalizeMessage } from '../utils/normalizeInput';

interface AiAnalyzePayload {
  riskSummary?: string;
  riskReasons?: string[];
  recommendedActions?: string[];
  confirmationMessage?: string;
  reportText?: string;
}

function defaultActions(level: RiskLevel): string[] {
  const common = [
    '문자에 있는 링크는 누르지 마세요.',
    '학교·학원 행정실, 담임교사 등 공식 연락처로 직접 확인하세요.',
    '문자 화면을 캡처해 두면 신고·상담에 도움이 됩니다.',
  ];
  if (level === 'low') {
    return [
      '공식 학교 앱·홈페이지의 공지와 내용·발신 정보를 대조해 보세요.',
      '납부나 결제가 필요하면 안내된 공식 채널에서만 진행하세요.',
    ];
  }
  if (level === 'caution') {
    return [
      ...common,
      '급하게 결정하지 말고 가족과 짧게 상의한 뒤 공식 창구로 확인하세요.',
    ];
  }
  return common;
}

function buildFallbackSummary(score: number, level: RiskLevel, scamType: string): string {
  const levelKo =
    level === 'critical'
      ? '매우 높은 편'
      : level === 'high'
        ? '높은 편'
        : level === 'caution'
          ? '주의가 필요한 편'
          : '낮은 편';
  return `규칙 기준 위험도는 ${score}점이며, 전체적으로 ${levelKo}입니다. 분류는 「${scamType}」에 가깝습니다. 이 결과는 참고용이며 100% 판별이 아닙니다.`;
}

function buildFallbackConfirmation(message: string): string {
  const summary = message.length > 200 ? `${message.slice(0, 200)}…` : message;
  return [
    '안녕하세요. 방금 아래와 같은 알림 문자를 받았습니다.',
    '',
    '[문자 내용 요약]',
    summary,
    '',
    '혹시 학교 또는 학원에서 실제로 발송한 안내인지 확인 부탁드립니다.',
    '링크는 아직 클릭하지 않았습니다.',
  ].join('\n');
}

function buildFallbackReportText(input: {
  riskScore: number;
  riskLevel: RiskLevel;
  scamType: string;
  urls: string[];
  riskReasons: string[];
  recommendedActions: string[];
}): string {
  const levelLabel =
    input.riskLevel === 'critical'
      ? '매우 높음'
      : input.riskLevel === 'high'
        ? '높음'
        : input.riskLevel === 'caution'
          ? '주의'
          : '낮음';
  const lines = [
    '[피싱 의심 문자 분석 리포트]',
    '',
    `위험도: ${input.riskScore}점 / 100점 (${levelLabel})`,
    `사칭 유형: ${input.scamType}`,
    `탐지된 URL: ${input.urls.length ? input.urls.join(', ') : '없음'}`,
    '',
    '주요 위험 요소:',
    ...input.riskReasons.map((r) => `- ${r}`),
    '',
    '권장 조치:',
    ...input.recommendedActions.map((a) => `- ${a}`),
    '',
    '※ 본 리포트는 자동 분석 결과이며 법적·기술적 최종 판정이 아닙니다.',
  ];
  return lines.join('\n');
}

function safeJsonParse(content: string): AiAnalyzePayload | null {
  try {
    const cleaned = content.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as AiAnalyzePayload;
    return parsed;
  } catch {
    return null;
  }
}

async function callOpenAi(params: {
  apiKey: string;
  message: string;
  riskScore: number;
  urls: string[];
  scamType: string;
  ruleReasons: string[];
}): Promise<AiAnalyzePayload | null> {
  try {
    const system = [
      'You are a phishing and smishing risk analysis assistant for Korean parents.',
      '',
      'Your task is to analyze suspicious Korean SMS messages related to schools, academies, childcare, meal payments, field trips, after-school classes, and child-related notices.',
      '',
      'You must:',
      '1. Explain the risk in simple Korean.',
      '2. Never say that the message is 100% safe.',
      '3. Recommend not clicking suspicious links.',
      '4. Suggest verifying through official school, academy, or teacher contact channels.',
      '5. Avoid causing excessive panic.',
      '6. Return structured JSON only.',
    ].join('\n');

    const user = [
      'Analyze the following message.',
      '',
      `Message:\n${params.message}`,
      '',
      `Rule-based score:\n${params.riskScore}`,
      '',
      `Detected URLs:\n${params.urls.join(', ') || '(none)'}`,
      '',
      `Scam type:\n${params.scamType}`,
      '',
      'Rule-based hints:',
      ...params.ruleReasons.map((r) => `- ${r}`),
      '',
      'Return JSON with keys:',
      '- riskSummary (string, one short paragraph in Korean)',
      '- riskReasons (string array, max 6 items, Korean)',
      '- recommendedActions (string array, max 6 items, Korean)',
      '- confirmationMessage (string, Korean, polite template parents can send)',
      '- reportText (string, Korean multi-line report similar to a police/portal report summary)',
    ].join('\n');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return safeJsonParse(content);
  } catch (e) {
    console.error('[callOpenAi]', e);
    return null;
  }
}

export async function runAnalyze(rawMessage: string, openAiApiKey?: string): Promise<AnalyzeResult> {
  const message = normalizeMessage(rawMessage);
  const urls = extractUrls(message);
  const { score: riskScore, reasons: ruleReasons } = calculateRiskScore(message, urls);
  const riskLevel = getRiskLevel(riskScore);
  const scamType = classifyScamType(message);

  let riskReasons = ruleReasons;
  let recommendedActions = defaultActions(riskLevel);
  let confirmationMessage = buildFallbackConfirmation(message);
  let reportText = buildFallbackReportText({
    riskScore,
    riskLevel,
    scamType,
    urls,
    riskReasons,
    recommendedActions,
  });
  let riskSummary = buildFallbackSummary(riskScore, riskLevel, scamType);

  if (openAiApiKey) {
    let ai: Awaited<ReturnType<typeof callOpenAi>> = null;
    try {
      ai = await callOpenAi({
        apiKey: openAiApiKey,
        message,
        riskScore,
        urls,
        scamType,
        ruleReasons,
      });
    } catch (e) {
      console.error('[runAnalyze] OpenAI 단계', e);
    }
    if (ai) {
      if (typeof ai.riskSummary === 'string' && ai.riskSummary.trim()) {
        riskSummary = ai.riskSummary.trim();
      }
      if (Array.isArray(ai.riskReasons) && ai.riskReasons.length) {
        riskReasons = ai.riskReasons.filter((x) => typeof x === 'string' && x.trim());
      }
      if (Array.isArray(ai.recommendedActions) && ai.recommendedActions.length) {
        recommendedActions = ai.recommendedActions.filter((x) => typeof x === 'string' && x.trim());
      }
      if (typeof ai.confirmationMessage === 'string' && ai.confirmationMessage.trim()) {
        confirmationMessage = ai.confirmationMessage.trim();
      }
      if (typeof ai.reportText === 'string' && ai.reportText.trim()) {
        reportText = ai.reportText.trim();
      }
    }
  }

  return {
    riskScore,
    riskLevel,
    scamType,
    detectedUrls: urls,
    riskReasons,
    recommendedActions,
    confirmationMessage,
    reportText,
    riskSummary,
  };
}
