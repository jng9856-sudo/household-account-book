import './globals.css'

export const metadata = {
  title: '우리집 가계부',
  description: '남규 & 와이프의 생활비 기록장',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
