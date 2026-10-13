'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 아이들의 글(서가)과 씨앗을 앞에, 수업 안내와 소개를 뒤에 둔다.
const items = [
  { href: '/jungle', label: '이야기 정글' },
  { href: '/seeds', label: '씨앗' },
  { href: '/write', label: '내 정글' },
  { href: '/classes', label: '수업 안내' },
  { href: '/about', label: '정글이란' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="menu" aria-label="주 메뉴">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={path.startsWith(i.href) ? 'page' : undefined}>{i.label}</Link>
      ))}
    </nav>
  );
}
