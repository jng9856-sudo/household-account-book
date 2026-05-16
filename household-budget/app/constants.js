// 고정비 항목 (가계부 이미지 기준)
export const FIXED_EXPENSES = [
  { id: 'rent', name: '월세', amount: 600000, icon: '🏠', color: '#b06a4e' },
  { id: 'internet', name: '통신비(와이파이)', amount: 150000, icon: '📡', color: '#5d8a62' },
  { id: 'car_insurance', name: '자동차보험', amount: 210000, icon: '🚗', color: '#c9943a' },
  { id: 'sub1', name: '구독료 A', amount: 55790, icon: '📱', color: '#7a6e9a' },
  { id: 'sub2', name: '구독료 B', amount: 34300, icon: '📺', color: '#7a6e9a' },
  { id: 'electric', name: '전기료', amount: 13900, icon: '💡', color: '#e6b840' },
  { id: 'gas', name: '가스료', amount: 7890, icon: '🔥', color: '#e07840' },
  { id: 'water1', name: '수도 A', amount: 11500, icon: '💧', color: '#4a90b8' },
  { id: 'water2', name: '수도 B', amount: 17000, icon: '💧', color: '#4a90b8' },
  { id: 'cctv', name: 'CCTV', amount: 15750, icon: '📷', color: '#6a6a7a' },
  { id: 'cleaning', name: '청소', amount: 5500, icon: '🧹', color: '#7a9e7e' },
]

export const FIXED_TOTAL = FIXED_EXPENSES.reduce((sum, e) => sum + e.amount, 0)

// 변동비 카테고리
export const VARIABLE_CATEGORIES = [
  { id: 'food', name: '식비', icon: '🛒', color: '#e07840' },
  { id: 'dining', name: '외식', icon: '🍽️', color: '#c9943a' },
  { id: 'transport', name: '교통', icon: '🚌', color: '#4a90b8' },
  { id: 'shopping', name: '쇼핑', icon: '🛍️', color: '#b06a4e' },
  { id: 'health', name: '의료/약', icon: '💊', color: '#5d8a62' },
  { id: 'beauty', name: '미용', icon: '✂️', color: '#9a6aaa' },
  { id: 'culture', name: '문화/여가', icon: '🎬', color: '#e05a7a' },
  { id: 'education', name: '교육', icon: '📚', color: '#5a7aaa' },
  { id: 'cafe', name: '카페/간식', icon: '☕', color: '#8a6040' },
  { id: 'pet', name: '반려동물', icon: '🐾', color: '#7a9e7e' },
  { id: 'gift', name: '경조사/선물', icon: '🎁', color: '#e07098' },
  { id: 'savings', name: '저축/투자', icon: '💰', color: '#3a8a5a' },
  { id: 'fixed_extra', name: '고정비 추가', icon: '📌', color: '#6a6a7a' },
  { id: 'etc', name: '기타', icon: '📝', color: '#9a9a8a' },
]

export const ALL_CATEGORIES = [...VARIABLE_CATEGORIES]

export const formatKRW = (amount) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const getCategoryById = (id) => {
  return ALL_CATEGORIES.find(c => c.id === id) || { name: '기타', icon: '📝', color: '#9a9a8a' }
}
