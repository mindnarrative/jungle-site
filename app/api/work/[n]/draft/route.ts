import { NextResponse } from 'next/server';
import { getWork, jungleText, saveWork } from '@/lib/model';
import { writeTarget } from '@/lib/target';

export const dynamic = 'force-dynamic';

// 정글 초고(여섯째 지면)를 낸다. 내면 같은 씨앗의 서가가 이 학생에게 열린다.
export async function POST(req: Request, { params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  const t = await writeTarget(new URL(req.url).searchParams.get('as'));
  if (!t) return NextResponse.json({ error: '낼 수 있는 사람이 아닙니다.' }, { status: 403 });
  const w = await getWork(t.student.id, n);
  if (!w || jungleText(w).replace(/\s/g, '').length < 200) return NextResponse.json({ error: '정글을 이백 자 넘게 쓴 뒤에 낼 수 있습니다.' }, { status: 400 });
  w.draftAt = w.draftAt || new Date().toISOString();
  await saveWork(w);
  return NextResponse.json({ draftAt: w.draftAt });
}
