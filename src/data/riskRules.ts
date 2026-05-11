// 규칙 기반 위험도 산정에 쓰는 키워드·가중치 상수
export const PAYMENT_KEYWORDS = [
  '결제',
  '납부',
  '미납',
  '입금',
  '환불',
  '수강료',
  '교재비',
  '급식비',
  '방과후비',
  '체험학습비',
];

export const URGENCY_KEYWORDS = [
  '긴급',
  '오늘까지',
  '즉시',
  '정지',
  '취소',
  '제한',
  '마감',
  '불이익',
  '이용 제한',
];

export const CHILD_NOTICE_KEYWORDS = [
  '학교',
  '학원',
  '돌봄',
  '급식',
  '체험학습',
  '방과후',
  '출결',
  '교실',
  '알리미',
  '나이스',
];

export const PERSONAL_INFO_KEYWORDS = [
  '개인정보',
  '인증번호',
  '비밀번호',
  '계좌',
  '주민등록',
  '카드번호',
  'cvv',
  'cvc',
];

export const EXTERNAL_PAYMENT_PHRASES = [
  '아래 링크',
  '링크에서',
  '링크로',
  '링크를',
  '아래 주소',
  '결제하세요',
  '결제 바랍',
  '결제해',
  '입금해',
];

export const SHORTENER_HOST_FRAGMENTS = ['bit.ly', 't.ly', 'tinyurl.com', 'goo.gl', 'me2.kr'];

export const SUSPICIOUS_TLD_REGEX =
  /\.(xyz|top|site|click|shop|info|tk|ml|ga|cfd|zip|mov)(\/|$|\?|#)/i;

export const BRAND_SQUAT_KEYWORDS = [
  'school',
  'edu',
  'pay',
  'child',
  'notice',
  'class',
  'student',
  'parent',
  'hakgyo',
];
