// 메시지 키워드로 사칭 유형(한글 라벨)을 분류한다
export function classifyScamType(message: string): string {
  if (message.includes('급식') || message.includes('납부')) {
    return '급식·납부 사칭 의심';
  }

  if (message.includes('학원') || message.includes('교재비') || message.includes('수강료')) {
    return '학원 알림 사칭 의심';
  }

  if (message.includes('돌봄') || message.includes('방과후')) {
    return '돌봄교실 사칭 의심';
  }

  if (message.includes('체험학습') || message.includes('출결') || message.includes('학교')) {
    return '학교 알림 사칭 의심';
  }

  if (message.includes('배송') || message.includes('주소') || message.includes('택배')) {
    return '교재·배송 사칭 의심';
  }

  return '일반 피싱 의심';
}
