// 상단 서비스명과 영문 부제를 보여주는 헤더 컴포넌트
export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur">
      <h1 className="text-center text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
        우리 아이 알림 사칭 탐지기
      </h1>
      <p className="mt-1 text-center text-sm text-slate-600">
        Child Notice Scam Checker
      </p>
    </header>
  );
}
