import { NextResponse } from 'next/server';
import { getWork, saveWork } from '@/lib/model';
import { writeTarget } from '@/lib/target';

export const dynamic = 'force-dynamic';

// 미션 1(장면 후보)·미션 2(다섯 칸) 판정. 기준은 하나 — 갈등을 만들기에 적절한가.
export async function POST(req: Request) {
  const t = await writeTarget(new URL(req.url).searchParams.get('as'));
  if (!t?.proxy) return NextResponse.json({ error: '교사만 판정할 수 있습니다.' }, { status: 403 });
  const { n, which, ok, note } = (await req.json()) as { n: number; which: string; ok: boolean; note: string };
  if (which !== 'mission1' && which !== 'mission2') return NextResponse.json({ error: '판정 종류가 맞지 않습니다.' }, { status: 400 });
  const w = await getWork(t.student.id, Number(n));
  if (!w) return NextResponse.json({ error: '아직 쓴 글이 없습니다.' }, { status: 404 });
  w[which as "mission1" | "mission2"] = { ok: Boolean(ok), note: String(note || '').slice(0, 300), at: new Date().toISOString(), by: t.v.id };
  await saveWork(w);
  return NextResponse.json({ ok: true });
}
