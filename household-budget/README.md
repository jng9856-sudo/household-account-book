# 🏡 우리집 가계부

남규 & 다경의 월별 가계부 웹앱

## 기능

- 📅 달력 형태로 날짜별 지출 기록
- 📌 고정비 자동 집계 (월세, 통신비, 보험 등)
- 📊 월별 통계 (카테고리별, 인별)
- 💾 브라우저 localStorage 저장 (서버 불필요)
- 📱 모바일 최적화

## 고정비 항목
- 월세: 600,000원
- 통신비(와이파이): 150,000원
- 자동차보험: 210,000원
- 구독료 A/B: 55,790 / 34,300원
- 전기료: 13,900원
- 가스료: 7,890원
- 수도 A/B: 11,500 / 17,000원
- CCTV: 15,750원
- 청소: 5,500원
- **월 고정비 합계: 1,121,630원**

## 변동비 카테고리
식비, 외식, 교통, 쇼핑, 의료/약, 미용, 문화/여가, 교육, 카페/간식, 반려동물, 경조사/선물, 저축/투자, 기타

---

## 로컬 실행

```bash
npm install
npm run dev
```

## GitHub + Vercel 배포

### 1. GitHub에 올리기
```bash
git init
git add .
git commit -m "init: 우리집 가계부"
git remote add origin https://github.com/YOUR_USERNAME/household-budget.git
git push -u origin main
```

### 2. Vercel 배포
1. [vercel.com](https://vercel.com) 접속 → GitHub 로그인
2. "New Project" → 이 repo 선택
3. Framework: **Next.js** (자동 감지됨)
4. "Deploy" 클릭
5. 완료! URL이 생성됩니다 🎉

> 이후 `git push` 할 때마다 자동으로 재배포됩니다.

## 기술 스택
- Next.js 14 (App Router)
- Tailwind CSS
- date-fns
- localStorage (서버리스 데이터 저장)
