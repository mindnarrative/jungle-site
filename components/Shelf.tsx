import Link from 'next/link';
import type { Shelved, Shelves } from '@/lib/shelf';
import { seed, shortTitle } from '@/lib/seeds';

function Book({ p, tier, staff }: { p: Shelved; tier: 'top' | 'mid' | 'low' | 'new'; staff: boolean }) {
  const s = seed(p.n);
  return (
    <Link href={`/jungle/${p.id}`} className={`book ${tier === 'top' ? 'top' : tier === 'low' ? 'low' : ''}`}>
      <span>
        {tier === 'new' && <span className="badge">새로 들어온 글</span>}
        <span className="h">{p.headword || '제목 없는 정글'}</span>
      </span>
      <span className="meta">
        {s ? `${p.n}. ${shortTitle(s)}` : ''}<br />
        {p.pen}{p.grade ? ` · ${p.grade}` : ''}
        {staff && <><br /><span className="pill gray">추천 {p.votes}</span></>}
      </span>
    </Link>
  );
}

function Row({ label, list, tier, staff }: { label: string; list: Shelved[]; tier: 'top' | 'mid' | 'low' | 'new'; staff: boolean }) {
  if (!list.length) return null;
  return (
    <div className="shelf">
      <p className="shelf-label">{label}</p>
      <div className="books">{list.map((p) => <Book key={p.id} p={p} tier={tier} staff={staff} />)}</div>
    </div>
  );
}

export default function Shelf({ shelves, staff }: { shelves: Shelves; staff: boolean }) {
  const none = !shelves.fresh.length && !shelves.top.length && !shelves.middle.length && !shelves.low.length;
  if (none) return <div className="empty">아직 이 서가에 꽂힌 글이 없습니다. 첫 글은 겨울특강의 아이들이 씁니다.</div>;
  return (
    <div>
      <Row label="윗칸 · 많이 읽힌 글" list={shelves.top} tier="top" staff={staff} />
      <Row label="새로 들어온 글" list={shelves.fresh} tier="new" staff={staff} />
      <Row label="가운데 칸" list={shelves.middle} tier="mid" staff={staff} />
      <Row label="아랫칸 · 아직 읽힐 차례를 기다리는 글" list={shelves.low} tier="low" staff={staff} />
    </div>
  );
}
