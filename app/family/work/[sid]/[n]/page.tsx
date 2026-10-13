import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { canSeeStudent } from '@/lib/access';
import { requireViewer } from '@/lib/auth';
import { getWork } from '@/lib/model';
import { seed, shortTitle } from '@/lib/seeds';
import WorkView from '@/components/WorkView';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '아이의 글', robots: { index: false } };

export default async function ChildWork({ params }: { params: Promise<{ sid: string; n: string }> }) {
  const { sid, n } = await params;
  const v = await requireViewer();
  if (!(await canSeeStudent(v, sid))) notFound();
  const w = await getWork(sid, Number(n));
  const s = seed(Number(n));
  if (!w || !s) notFound();
  return (
    <article className="read stack">
      <p className="small"><Link href="/family">← 우리 아이의 글</Link></p>
      <p className="muted">{s.n}번째 씨앗 · {shortTitle(s)}</p>
      <WorkView w={w} />
    </article>
  );
}
