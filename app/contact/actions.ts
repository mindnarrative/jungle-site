'use server';

import { headers } from 'next/headers';
import { addInquiry } from '@/lib/model';

const recent = new Map<string, number[]>();

export async function sendInquiry(_: { ok?: string; error?: string } | null, f: FormData) {
  if (String(f.get('website') || '')) return { ok: '접수했습니다.' }; // 자동 등록기 걸러내기
  const ip = ((await headers()).get('x-forwarded-for') || 'local').split(',')[0].trim();
  const now = Date.now();
  const list = (recent.get(ip) || []).filter((t) => now - t < 3600e3);
  if (list.length >= 5) return { error: '한 시간 뒤에 다시 보내 주세요.' };
  const name = String(f.get('name') || '').trim().slice(0, 40);
  const contact = String(f.get('contact') || '').trim().slice(0, 60);
  const kind = String(f.get('kind') || '').trim().slice(0, 30);
  const body = String(f.get('body') || '').trim().slice(0, 1500);
  if (!name || !contact) return { error: '이름과 연락처를 적어 주세요.' };
  await addInquiry({ name, contact, kind, body });
  recent.set(ip, [...list, now]);
  return { ok: '접수했습니다. 적어 주신 연락처로 연락드리겠습니다.' };
}
