import { NextResponse } from 'next/server';
import { currentViewer } from '@/lib/auth';
import { lockedPost } from '@/lib/access';
import { getPost, getReads, toggleVote } from '@/lib/model';

export const dynamic = 'force-dynamic';

// 추천: 한 사람이 한 글에 한 번, 다시 누르면 거둔다. 자기 글은 추천할 수 없고, 끝까지 읽은 글만 추천할 수 있다.
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await currentViewer();
  if (!v) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const p = await getPost((await params).id);
  if (!p || p.hidden || (await lockedPost(v, p))) return NextResponse.json({ error: '추천할 수 없는 글입니다.' }, { status: 404 });
  if (p.studentId === v.id) return NextResponse.json({ error: '내가 쓴 글은 추천할 수 없습니다.' }, { status: 400 });
  if (!(await getReads(p.id))[v.id]) return NextResponse.json({ error: '끝까지 읽은 뒤에 추천할 수 있습니다.' }, { status: 400 });
  return NextResponse.json({ voted: await toggleVote(p.id, v.id) });
}
