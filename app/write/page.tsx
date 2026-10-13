import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentViewer } from '@/lib/auth';
import { pagesDone, worksOf } from '@/lib/model';
import { seed, seeds, shortTitle } from '@/lib/seeds';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '내 정글', robots: { index: false } };

export default async function MyJungle() {
  const v = await currentViewer();
  if (!v) {
    return (
      <div className="read stack">
        <h1>내 정글</h1>
        <p className="lead">내 정글은 수업을 듣는 학생이 씨앗 하나를 열한 지면에 걸쳐 쓰는 곳입니다. 선생님이 만들어 준 계정으로 로그인해 주세요.</p>
        <div className="row"><Link className="btn" href="/login">로그인</Link><Link className="btn ghost" href="/classes">수업 안내</Link></div>
      </div>
    );
  }
  if (v.role === 'parent') redirect('/family');
  if (v.role !== 'student') redirect('/teacher');
  const works = (await worksOf(v.id)).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const started = new Set(works.map((w) => w.n));
  return (
    <div className="stack-lg">
      <div className="stack read">
        <h1>{v.pen || v.name}의 정글</h1>
        <p className="lead">씨앗 하나를 삼 주 동안 씁니다. 첫 주에는 감각, 둘째 주에는 감정, 셋째 주에는 이해와 관념과 인식의 지면을 채웁니다. 쓴 것은 저절로 저장됩니다.</p>
      </div>
      {works.length > 0 && (
        <section>
          <h2 className="part-h">쓰고 있는 씨앗</h2>
          <div className="seed-grid">
            {works.map((w) => { const s = seed(w.n)!; const d = pagesDone(w); return (
              <Link key={w.n} href={`/write/${w.n}`} className="seed-card">
                <span className="no">{w.n}번째 씨앗 · {d}/11 지면</span>
                <p className="t">{shortTitle(s)}</p>
                <p className="e">{w.postId ? '서가에 올라 있습니다' : w.draftAt ? '정글 초고를 냈습니다' : '쓰는 중'}</p>
              </Link>); })}
          </div>
        </section>
      )}
      <section>
        <h2 className="part-h">새 씨앗 열기</h2>
        <p className="small muted" style={{ marginBottom: 12 }}>선생님이 정해 준 씨앗부터 엽니다.</p>
        <div className="seed-grid">
          {seeds().filter((s) => !started.has(s.n)).map((s) => (
            <Link key={s.n} href={`/write/${s.n}`} className="seed-card">
              <span className="no">{s.n}번째 씨앗 · {s.object}</span>
              <p className="t">{shortTitle(s)}</p>
              <p className="e">{s.era}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
