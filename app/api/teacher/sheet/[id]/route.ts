import { NextResponse } from 'next/server';
import { canSeeStudent } from '@/lib/access';
import { teacherSheet } from '@/lib/analyzer';
import { currentViewer } from '@/lib/auth';
import { getAccount } from '@/lib/model';

export const dynamic = 'force-dynamic';

// 교사용 지도 카드는 분석 서버에서 이 서버가 대신 받아 온다. 분석 서버의 열쇠는 브라우저로 나가지 않는다.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await currentViewer();
  const st = await getAccount((await params).id);
  if (!v || (v.role !== 'teacher' && v.role !== 'admin') || !st || !(await canSeeStudent(v, st.id))) return NextResponse.json({ error: '볼 수 없습니다.' }, { status: 403 });
  if (!st.hq) return NextResponse.json({ error: '판독을 아직 맡기지 않았습니다.' }, { status: 404 });
  try {
    const html = await teacherSheet(st.hq.batch, st.hq.code);
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  } catch (e) {
    return new NextResponse(`<p style="font-family:sans-serif;padding:40px">${(e as Error).message}</p>`, { status: 502, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}
