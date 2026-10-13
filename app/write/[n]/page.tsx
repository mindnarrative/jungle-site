import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getWork, propositionOf, worksOf } from '@/lib/model';
import { seed, shortTitle } from '@/lib/seeds';
import { writeTarget } from '@/lib/target';
import Workbook from './Workbook';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '내 정글', robots: { index: false } };

export default async function WritePage({ params, searchParams }: { params: Promise<{ n: string }>; searchParams: Promise<{ as?: string }> }) {
  const n = Number((await params).n);
  const s = seed(n);
  if (!s) notFound();
  const as = (await searchParams).as || null;
  const t = await writeTarget(as);
  if (!t) redirect(as ? '/teacher' : '/login');
  const w = await getWork(t.student.id, n);
  // 지난 씨앗에서 가져온 명제: 이 씨앗이 아닌 글 가운데 가장 최근에 손댄 글의 명제.
  const others = (await worksOf(t.student.id)).filter((x) => x.n !== n && propositionOf(x)).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const carry = others[0] ? propositionOf(others[0]) : '';
  const who = t.student.pen || t.student.name;
  return (
    <div className="stack-lg">
      <div className="stack">
        <p className="small"><Link href={t.proxy ? `/teacher/student/${t.student.id}` : '/write'}>← {t.proxy ? `${who}의 글 모음` : '내 정글'}</Link></p>
        <h1>{n}. {shortTitle(s)}</h1>
        <p className="muted">{s.era} · 오늘의 사물 — {s.object}</p>
      </div>
      <Workbook seed={s} asId={t.proxy ? t.student.id : null} who={who} staff={t.proxy}
        initial={w?.pages || {}} carry={carry} draftAt={w?.draftAt || null}
        mission1={w?.mission1 ? { ok: w.mission1.ok, note: w.mission1.note } : undefined}
        mission2={w?.mission2 ? { ok: w.mission2.ok, note: w.mission2.note } : undefined} />
    </div>
  );
}
