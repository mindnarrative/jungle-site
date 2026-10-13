import type { Metadata } from 'next';
import Link from 'next/link';
import { PARTS, seeds } from '@/lib/seeds';

export const metadata: Metadata = { title: '씨앗 스물셋' };

export default function SeedsPage() {
  const all = seeds();
  return (
    <div className="stack-lg">
      <div className="stack read">
        <h1>씨앗 스물셋</h1>
        <p className="lead">『세계사 정글』 서양사편의 스물세 장면입니다. 구석기에서 데탕트까지, 모두 서로 다른 선택을 한 두 사람이 각자의 자리에서 옳았던 순간을 골랐습니다. 씨앗 하나를 삼 주 동안 쓰고, 한 학기에 예닐곱 씨앗을 돕니다.</p>
      </div>
      {PARTS.map((part) => (
        <section key={part.name}>
          <h2 className="part-h">{part.name}</h2>
          <div className="seed-grid">
            {all.filter((s) => s.n >= part.from && s.n <= part.to).map((s) => (
              <Link key={s.n} href={`/seeds/${s.n}`} className="seed-card">
                <span className="no">{s.n}번째 씨앗 · 오늘의 사물 {s.object}</span>
                <p className="t">{s.title}</p>
                <p className="e">{s.era}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
