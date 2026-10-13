import { NextResponse } from 'next/server';
import { openWork, PAGE_KEYS, saveWork } from '@/lib/model';
import { seed } from '@/lib/seeds';
import { writeTarget } from '@/lib/target';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!seed(n)) return NextResponse.json({ error: '없는 씨앗입니다.' }, { status: 404 });
  const t = await writeTarget(new URL(req.url).searchParams.get('as'));
  if (!t) return NextResponse.json({ error: '쓸 수 있는 사람이 아닙니다.' }, { status: 403 });
  const raw = await req.text();
  if (raw.length > 200_000) return NextResponse.json({ error: '글이 너무 깁니다.' }, { status: 413 });
  let body: { pages?: Record<string, unknown> };
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: '읽지 못했습니다.' }, { status: 400 }); }
  const w = await openWork(t.student.id, n);
  for (const k of PAGE_KEYS) if (body.pages && k in body.pages) w.pages[k] = body.pages[k];
  if (t.proxy) w.enteredBy = t.v.id;
  await saveWork(w);
  return NextResponse.json({ ok: true, updatedAt: w.updatedAt });
}
