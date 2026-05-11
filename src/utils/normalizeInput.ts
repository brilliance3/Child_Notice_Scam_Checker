// 사용자 입력 문자열을 분석용으로 정리한다(공백 정리, 길이 제한)
const MAX_MESSAGE_LENGTH = 2000;

export function normalizeMessage(raw: string): string {
  const collapsed = raw.trim().replace(/\s+/g, ' ');
  return collapsed.slice(0, MAX_MESSAGE_LENGTH);
}
