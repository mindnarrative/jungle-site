import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { teacherOwnsClass } from '@/lib/access';
import { requireViewer } from '@/lib/auth';
import { getClass, headwordOf, jungleText, studentsOf, worksOf, type Work } from '@/lib/model';
import { seed, shortTitle } from '@/lib/seeds';
import WorkView from '@/components/WorkView';
import PrintButton from './PrintButton';
import { iga } from '@/lib/josa';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '문고집', robots: { index: false } };

// 반별 문고집. 정글북_만들기(2026.8.28)의 원칙을 따른다 — 아이의 문장은 한 글자도 고치지 않고,
// 글과 글 사이의 이음새 서술만 붙인다. 차례는 글의 제목이 아니라 아이가 만든 표제어로 뽑는다.
export default async function BookPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ seed?: string }> }) {
  const { classId } = await params;
  const only = (await searchParams).seed?.split(',').map(Number).filter(Boolean) || [];
  const v = await requireViewer();
  const k = await getClass(classId);
  if (!k) notFound();
  const kids = await studentsOf(k);
  const allowed = (await teacherOwnsClass(v, classId)) || kids.some((s) => s.id === v.id) || (v.role === 'parent' && kids.some((s) => (v.childIds || []).includes(s.id)));
  if (!allowed) notFound();

  const entries: { pen: string; w: Work }[] = [];
  for (const s of kids) for (const w of await worksOf(s.id)) {
    if ((!only.length || only.includes(w.n)) && jungleText(w).trim()) entries.push({ pen: s.pen || '이름 없는 아이', w });
  }
  entries.sort((a, b) => a.w.n - b.w.n || a.pen.localeCompare(b.pen, 'ko'));
  const seedsIn = [...new Set(entries.map((e) => e.w.n))];

  return (
    <div className="read">
      <div className="no-print row" style={{ marginBottom: 20 }}><PrintButton /><span className="small muted">브라우저의 인쇄에서 ‘PDF로 저장’을 고르면 파일이 됩니다.</span></div>
      <section className="book-page book-cover">
        <p className="muted">이야기 정글 · 반 문고집</p>
        <h1 style={{ margin: '14px 0' }}>{k.name}</h1>
        <p className="serif">{seedsIn.map((n) => shortTitle(seed(n)!)).join(' · ')}</p>
        <p className="muted" style={{ marginTop: 30 }}>{kids.map((s) => s.pen).join(' · ')}</p>
      </section>
      <section className="book-page">
        <h2>차례</h2>
        <ol className="prose">{entries.map((e, i) => <li key={i}>{headwordOf(e.w) || '제목 없는 정글'} <span className="muted small">— {e.pen}</span></li>)}</ol>
      </section>
      {entries.map((e, i) => {
        const s = seed(e.w.n)!;
        const first = i === 0 || entries[i - 1].w.n !== e.w.n;
        return (
          <section key={i} className="book-page">
            {first && <p className="muted serif" style={{ marginBottom: 18 }}>{s.n}번째 씨앗, {shortTitle(s)}({s.era}). 아이들은 이 장면 안으로 들어가 한 사람의 눈으로 하루를 살았고, 다시 걸어 나와 그 자리에서 무슨 일이 벌어졌는지를 따졌다.</p>}
            <p className="small muted">{iga(e.pen)} 쓴 이야기</p>
            <WorkView w={e.w} />
          </section>
        );
      })}
      {entries.length === 0 && <div className="empty">아직 문고집에 엮을 정글이 없습니다.</div>}
    </div>
  );
}
