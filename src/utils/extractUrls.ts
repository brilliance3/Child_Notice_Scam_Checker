// 입력 문자열에서 http(s), www, 주요 단축 URL 패턴을 추출한다
const URL_REGEX =
  /(https?:\/\/[^\s<>"'()[\]{}]+|www\.[^\s<>"'()[\]{}]+|(?:bit\.ly|t\.ly|tinyurl\.com|goo\.gl|me2\.kr)\/[^\s<>"'()[\]{}]+)/gi;

function stripTrailingPunctuation(url: string): string {
  return url.replace(/[),.;:]+$/g, '');
}

export function extractUrls(text: string): string[] {
  const raw = text.match(URL_REGEX) ?? [];
  const cleaned = raw.map((u) => stripTrailingPunctuation(u.trim()));
  return [...new Set(cleaned)];
}
