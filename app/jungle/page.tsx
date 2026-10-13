import type { Metadata } from 'next';
import Link from 'next/link';
import Shelf from '@/components/Shelf';
import { currentViewer, isStaff } from '@/lib/auth';
import { allPosts } from '@/lib/model';
import { arrange, monthPicks, weigh } from '@/lib/shelf';
import { seed, seeds, shortTitle } from '@/lib/seeds';
import { shelfLockFor } from '@/lib/access';

export const metadata: Metadata = { title: '이야기 정글' };
export const dynamic = 'force-dynamic';

export default async function JunglePage({ searchParams }: { searchParams: Promise<{ seed?: string }> }) {
  const { seed: q } = await searchParams;
  const n = Number(q) || 0;
  const v = await currentViewer();
  const all = await allPosts();
  const s = n ? seed(n) : null;
  const posts = s ? all.filter((p) => p.n === n) : all;
  const locked = s ? await shelfLockFor(v, n) : false;
  const picks = s ? [] : await weigh(await monthPicks());
  const counts = new Map<number, number>();
  all.forEach((p) => counts.set(p.n, (counts.get(p.n) || 0) + 1));

  return (
    <div className="stack-lg">
      <div className="stack read">
        <h1>{s ? `${n}. ${shortTitle(s)}의 서가` : '이야기 정글'}</h1>
        <p className="lead">
          아이들이 역사의 한 장면 안에서 쓴 정글과, 같은 장면 밖으로 나와 쓴 논글이 꽂힌 서가입니다.
          끝까지 읽은 사람이 추천을 하면 글이 위 칸으로 올라가고, 시간이 지나면 천천히 내려옵니다.
          서가의 위 칸은 잘 쓴 글이라는 뜻이 아니라 많이 읽힌 글이라는 뜻입니다.
        </p>
      </div>

      {!s && picks.length > 0 && (
        <section>
          <div className="section-h"><h2>이달의 정글</h2><span className="small muted">본사가 고른 글</span></div>
          <div className="books">
            {picks.map((p) => {
              const ps = seed(p.n);
              return (
                <Link key={p.id} href={`/jungle/${p.id}`} className="book top">
                  <span className="h">{p.headword || '제목 없는 정글'}</span>
                  <span className="meta">{ps ? `${p.n}. ${shortTitle(ps)}` : ''}<br />{p.pen}{p.grade ? ` · ${p.grade}` : ''}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <nav aria-label="씨앗별 서가" className="row">
        <Link className={`btn small ${s ? 'ghost' : ''}`} href="/jungle">모든 씨앗</Link>
        {seeds().filter((x) => counts.get(x.n)).map((x) => (
          <Link key={x.n} className={`btn small ${n === x.n ? '' : 'ghost'}`} href={`/jungle?seed=${x.n}`}>{x.n}. {shortTitle(x)}</Link>
        ))}
      </nav>

      {locked ? (
        <div className="box warm lock">
          <div className="stack">
            <h3>이 서가는 내 정글을 쓴 뒤에 열립니다</h3>
            <p>같은 씨앗의 다른 친구 글은 내 정글 초고(여섯째 지면)를 낸 다음에 읽을 수 있습니다. 남의 장면을 먼저 보면 내 장면이 그 장면을 따라가게 되기 때문입니다.</p>
            <Link className="btn small" href={`/write/${n}`}>내 정글 쓰러 가기</Link>
          </div>
        </div>
      ) : (
        <Shelf shelves={await arrange(posts)} staff={isStaff(v)} />
      )}
    </div>
  );
}
