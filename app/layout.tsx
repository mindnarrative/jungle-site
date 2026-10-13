import { storeReady } from '@/lib/store';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import Nav from '@/components/Nav';
import { currentViewer } from '@/lib/auth';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: { default: '이야기 정글', template: '%s · 이야기 정글' },
  description: '역사의 한 장면에서 아이가 정글(정서를 담은 글짓기)과 논글(논리를 담은 글짓기)을 쓰고, 그 글이 다른 아이에게 읽히는 곳.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0b3b30' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const v = await currentViewer().catch(() => null);
  const who = v ? (v.role === 'student' ? v.pen || v.name : v.name) : null;
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap" />
      </head>
      <body>
        <header className="top">
          <div className="wrap bar">
            <Link className="brand" href="/">
              <span className="mark" aria-hidden="true" />
              <span><b>이야기 정글</b><small>정서를 담은 글짓기 · 논리를 담은 글짓기</small></span>
            </Link>
            <div className="util">
              {v?.role === 'teacher' && <Link href="/teacher">교사실</Link>}
              {v?.role === 'admin' && <><Link href="/teacher">교사실</Link><Link href="/admin">본사</Link></>}
              {v?.role === 'parent' && <Link href="/family">우리 아이</Link>}
              {v?.role === 'student' && <Link href="/path">내 글이 지나간 길</Link>}
              {who ? <Link href="/logout" prefetch={false}>{who} · 나가기</Link> : <Link href="/login">로그인</Link>}
            </div>
            <Nav />
          </div>
        </header>
        <main className="wrap">
          {(!storeReady() || !process.env.SESSION_SECRET) && (
            <p className="notice" style={{ marginBottom: 24 }}>
              사이트 설정이 아직 끝나지 않았습니다.{!storeReady() && ' 저장소(Upstash Redis)를 연결해 주세요.'}{!process.env.SESSION_SECRET && ' 환경 변수 SESSION_SECRET을 넣어 주세요.'} 넣은 뒤에는 Redeploy가 필요합니다.
            </p>
          )}
          {children}
        </main>
        <footer>
          <div className="wrap foot">
            <div>
              <p className="foot-name">이야기 정글</p>
              <p>아이는 같은 사건을 두 번 씁니다. 한 번은 안에서, 한 번은 밖에서.</p>
            </div>
            <div>
              <p className="foot-h">읽기</p>
              <Link href="/jungle">이야기 정글</Link>
              <Link href="/seeds">씨앗 스물셋</Link>
            </div>
            <div>
              <p className="foot-h">배우기</p>
              <Link href="/classes">수업 안내</Link>
              <Link href="/about">정글이란</Link>
              <Link href="/contact">상담·도입 문의</Link>
            </div>
            <div>
              <p className="foot-h">약속</p>
              <Link href="/privacy">아이의 글과 개인정보</Link>
              <Link href="/login">로그인</Link>
            </div>
            <div className="foot-legal">
              <p>{SITE.operator} · 대표 {SITE.director} · {SITE.place} · 사업자등록번호 {SITE.bizNo}</p>
              <p>전화 {SITE.phone} · 메일 {SITE.email}</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
