import { NextResponse } from 'next/server';
import { currentViewer } from '@/lib/auth';
import { lockedPost } from '@/lib/access';
import { getPost, markRead } from '@/lib/model';

export const dynamic = 'force-dynamic';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await currentViewer();
  if (!v) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const p = await getPost((await params).id);
  if (!p || p.hidden || (await lockedPost(v, p))) return NextResponse.json({ error: '읽을 수 없는 글입니다.' }, { status: 404 });
  await markRead(p.id, v.id);
  return NextResponse.json({ ok: true });
}
