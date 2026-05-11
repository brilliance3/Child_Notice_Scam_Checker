// 추출된 URL 목록과 주요 위험 요인 불릿 리스트를 렌더링한다
import type { AnalyzeResult } from '../types/analysis';

type Props = {
  result: AnalyzeResult;
};

export function RiskReasonList({ result }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">탐지된 URL</h2>
      {result.detectedUrls.length ? (
        <ul className="mt-2 space-y-1 break-all text-sm text-slate-800">
          {result.detectedUrls.map((u) => (
            <li key={u} className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              {u}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-600">문자에서 URL 패턴을 찾지 못했습니다.</p>
      )}

      <h2 className="mt-6 text-base font-semibold text-slate-900">주요 위험 요인</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-800">
        {result.riskReasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </section>
  );
}
