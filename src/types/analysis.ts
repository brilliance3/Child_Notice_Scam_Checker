// 문자 분석 API 요청·응답에 사용하는 타입 정의
export interface AnalyzeRequest {
  message: string;
}

export interface AnalyzeResult {
  riskScore: number;
  riskLevel: 'low' | 'caution' | 'high' | 'critical';
  scamType: string;
  detectedUrls: string[];
  riskReasons: string[];
  recommendedActions: string[];
  confirmationMessage: string;
  reportText: string;
  /** AI가 생성한 한 줄 요약(없으면 규칙 기반 요약 사용) */
  riskSummary?: string;
}
