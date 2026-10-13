import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentViewer, isStaff } from '@/lib/auth';
import { lockedPost } from '@/lib/access';
import { getPost, getReads, getVotes } from '@/lib/model';
import { seed, shortTitle } from '@/lib/seeds';
import Recommend from './Recommend';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = await getPost((await params).id);
  return { title: p && !p.hidden ? p.headword || '정글' : '정글' };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await getPost((await params).id);
  if (!p || p.hidden) notFound();
  const v = await currentViewer();
  const s = seed(p.n);
  if (await lockedPost(v, p)) {
    return (
      <div className="read stack">
        <h1>아직 열리지 않은 글입니다</h1>
        <p className="lead">{p.n}. {s ? shortTitle(s) : ''}의 글은 내 정글 초고를 낸 다음에 읽을 수 있습니다.</p>
        <Link className="btn" href={`/write/${p.n}`}>내 정글 쓰러 가기</Link>
      </div>
    );
  }
  const votes = await getVotes(p.id);
  const reads = await getReads(p.id);
  const me = v && v.role !== 'admin' ? v.id : v?.role === 'admin' ? 'admin' : null;
  const own = !!v && v.id === p.studentId;

  return (
    <article className="read">
      <div className="post-head stack">
        <p className="kicker"><Link href={`/jungle?seed=${p.n}`}>{p.n}. {s ? shortTitle(s) : ''}</Link></p>
        <h1>{p.headword || '제목 없는 정글'}</h1>
        <p className="muted">{p.pen}{p.grade ? ` · ${p.grade}` : ''}</p>
        {isStaff(v) && <p><span className="pill gray">추천 {Object.keys(votes).length}</span> <span className="pill gray">끝까지 읽음 {Object.keys(reads).length}</span></p>}
      </div>

      <p className="writing-h">정글 · 장면 안에서</p>
      <div className="writing">{p.jungle || '정글 본문이 없습니다.'}</div>

      {p.nongeul && <>
        <p className="writing-h">논글 · 장면 밖에서</p>
        <div className="writing">{p.nongeul}</div>
      </>}

      {p.proposition && <p className="prop">{p.proposition}</p>}

      <p className="endmark" id="end">· · ·</p>
      <Recommend id={p.id} canVote={!!me && !own} initialRead={!!me && !!reads[me]} initialVoted={!!me && !!votes[me]} loggedIn={!!v} />
    </article>
  );
}
