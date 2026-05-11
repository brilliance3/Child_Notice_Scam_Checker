// 보호자가 취할 권장 행동을 순서 있는 목록으로 안내한다
import type { AnalyzeResult } from '../../lib/types/analysis';

type Props = {
  result: AnalyzeResult;
};

export function ActionGuide({ result }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">권장 행동</h2>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-slate-800">
        {result.recommendedActions.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ol>
    </section>
  );
}
