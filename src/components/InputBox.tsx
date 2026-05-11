// 의심 문자 또는 URL을 입력받는 텍스트 영역과 개인정보 주의 문구
type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function InputBox({ value, onChange, disabled }: Props) {
  return (
    <section className="space-y-2">
      <label htmlFor="msg" className="block text-sm font-medium text-slate-800">
        문자 또는 URL 입력
      </label>
      <textarea
        id="msg"
        name="message"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        maxLength={2000}
        rows={8}
        placeholder="수상한 문자 전문을 붙여넣거나 URL만 입력하세요."
        className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none ring-slate-300 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 disabled:opacity-60"
      />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{value.length} / 2000자</span>
        <span className="text-right text-[11px] leading-snug text-amber-800">
          주의: 자녀 이름, 전화번호, 주민등록번호, 계좌번호 등 개인정보는 지우고 입력해주세요.
        </span>
      </div>
    </section>
  );
}
