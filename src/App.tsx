// 메인 화면: 입력 → 분석 → 결과 카드와 복사 액션을 연결한다
import { useMemo, useState } from 'react';
import { analyzeMessage } from './api/scamApi';
import { ActionGuide } from './components/ActionGuide';
import { CopyReportButton } from './components/CopyReportButton';
import { Header } from './components/Header';
import { InputBox } from './components/InputBox';
import { RiskReasonList } from './components/RiskReasonList';
import { RiskScoreCard } from './components/RiskScoreCard';
import type { AnalyzeResult } from '../lib/types/analysis';
import { extractUrls } from '../lib/utils/extractUrls';

function IntroCard() {
  return (
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 text-left shadow-sm">
      <p className="text-base font-medium text-indigo-950">
        학교·학원·돌봄 알림처럼 보이는 수상한 문자를 확인하세요.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-indigo-900/90">
        수상한 학교·학원 알림을 받으셨나요? 문자 내용을 붙여넣으면 피싱 위험도를 확인해드립니다. 링크를
        누르기 전에 먼저 확인하세요.
      </p>
    </section>
  );
}

export default function App() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const previewUrls = useMemo(() => extractUrls(text), [text]);

  async function onAnalyze() {
    setError(null);
    if (!text.trim()) {
      setError('분석할 문자를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const data = await analyzeMessage({ message: text });
      setResult(data);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function onReset() {
    setResult(null);
    setError(null);
    setText('');
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6 pb-28">
        <IntroCard />

        <InputBox value={text} onChange={setText} disabled={loading} />

        {previewUrls.length > 0 && (
          <p className="text-xs text-slate-600">
            미리보기 URL {previewUrls.length}개: {previewUrls.join(', ')}
          </p>
        )}

        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading}
          className="min-h-[52px] w-full rounded-2xl bg-indigo-600 text-lg font-semibold text-white shadow-md transition hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '분석 중…' : '위험도 확인하기'}
        </button>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="flex flex-col gap-4">
            <RiskScoreCard result={result} />
            <RiskReasonList result={result} />
            <ActionGuide result={result} />

            <div className="grid gap-3 sm:grid-cols-2">
              <CopyReportButton label="확인 문구 복사하기" text={result.confirmationMessage} />
              <CopyReportButton label="신고용 리포트 복사하기" text={result.reportText} />
            </div>

            <button
              type="button"
              onClick={onReset}
              className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-white text-base font-semibold text-slate-900 hover:bg-slate-50"
            >
              다시 분석하기
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
