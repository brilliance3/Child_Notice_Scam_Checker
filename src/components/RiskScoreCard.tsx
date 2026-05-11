// 규칙·AI 요약을 바탕으로 위험도 점수와 단계를 카드 UI로 표시한다
import type { AnalyzeResult } from '../types/analysis';

const levelStyle: Record<
  AnalyzeResult['riskLevel'],
  { label: string; bar: string; text: string }
> = {
  low: {
    label: '낮음',
    bar: 'bg-emerald-500',
    text: 'text-emerald-800',
  },
  caution: {
    label: '주의',
    bar: 'bg-amber-400',
    text: 'text-amber-900',
  },
  high: {
    label: '높음',
    bar: 'bg-orange-500',
    text: 'text-orange-900',
  },
  critical: {
    label: '매우 높음',
    bar: 'bg-red-600',
    text: 'text-red-900',
  },
};

type Props = {
  result: AnalyzeResult;
};

export function RiskScoreCard({ result }: Props) {
  const style = levelStyle[result.riskLevel];
  const pct = Math.min(100, Math.max(0, result.riskScore));

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">위험도</p>
          <p className={`mt-1 text-4xl font-bold tabular-nums ${style.text}`}>
            {result.riskScore}
            <span className="text-lg font-semibold text-slate-500">/100</span>
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${style.text} bg-slate-50 ring-1 ring-slate-200`}
        >
          {style.label}
        </span>
      </div>
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${style.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-700">
        {result.riskSummary ??
          '자동 분석 결과이며, 100% 판별이 아닙니다. 공식 연락처로 한 번 더 확인하세요.'}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        사칭 유형: <span className="font-medium text-slate-800">{result.scamType}</span>
      </p>
    </section>
  );
}
