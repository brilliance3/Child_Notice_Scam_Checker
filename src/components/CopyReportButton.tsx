// 확인 문구·신고용 리포트 등 긴 텍스트를 클립보드로 복사한다
import { useState } from 'react';

type Props = {
  label: string;
  text: string;
  variant?: 'primary' | 'secondary';
};

export function CopyReportButton({ label, text, variant = 'secondary' }: Props) {
  const [done, setDone] = useState(false);

  const base =
    'inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl px-4 text-base font-semibold transition active:scale-[0.99]';
  const styles =
    variant === 'primary'
      ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
      : 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50';

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      setDone(false);
    }
  }

  return (
    <button type="button" className={`${base} ${styles}`} onClick={onCopy}>
      {done ? '복사했습니다' : label}
    </button>
  );
}
