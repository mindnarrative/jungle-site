'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { currentViewer, hashPassword } from '@/lib/auth';
import { addPick, createClass, getAccount, getClass, ID_RULE, normId, removePick, saveAccount, saveClass, setInquiryDone, setPostHidden } from '@/lib/model';
import { thisMonth } from '@/lib/shelf';

type Result = { ok?: string; error?: string } | null;
const text = (f: FormData, k: string, max = 100) => String(f.get(k) || '').trim().slice(0, max);
async function admin() {
  const v = await currentViewer();
  if (v?.role !== 'admin') redirect('/login');
}

export async function addTeacher(_: Result, f: FormData): Promise<Result> {
  await admin();
  const id = normId(text(f, 'id', 20)); const pw = text(f, 'pw', 64); const name = text(f, 'name', 30);
  if (!ID_RULE.test(id)) return { error: '아이디는 영문 소문자·숫자로 3~20자입니다.' };
  if (pw.length < 8) return { error: '교사 비밀번호는 8자 이상으로 해 주세요.' };
  if (!name) return { error: '이름을 적어 주세요.' };
  if (await getAccount(id)) return { error: '이미 있는 아이디입니다.' };
  await saveAccount({ id, role: 'teacher', name, createdAt: new Date().toISOString(), ...hashPassword(pw) }, true);
  revalidatePath('/admin');
  return { ok: `${name} 선생님 계정을 만들었습니다.` };
}

export async function addClass(_: Result, f: FormData): Promise<Result> {
  await admin();
  const name = text(f, 'name', 40);
  const teachers = f.getAll('teacher').map(String).filter(Boolean);
  if (!name) return { error: '반 이름을 적어 주세요.' };
  await createClass(name, teachers);
  revalidatePath('/admin');
  return { ok: `${name} 반을 만들었습니다.` };
}

export async function setClassTeachers(f: FormData) {
  await admin();
  const k = await getClass(text(f, 'id')); if (!k) return;
  k.teacherIds = f.getAll('teacher').map(String).filter(Boolean);
  await saveClass(k);
  revalidatePath('/admin');
}

export async function setTeacherDisabled(f: FormData) {
  await admin();
  const a = await getAccount(text(f, 'id')); if (!a || a.role !== 'teacher') return;
  a.disabled = f.get('off') === '1'; await saveAccount(a);
  revalidatePath('/admin');
}

export async function hidePost(f: FormData) {
  await admin();
  await setPostHidden(text(f, 'id'), f.get('hide') === '1');
  revalidatePath('/admin'); revalidatePath('/jungle');
}

export async function pickPost(f: FormData) {
  await admin();
  const id = text(f, 'id'); const month = text(f, 'month') || thisMonth();
  if (f.get('remove') === '1') await removePick(id, month); else await addPick(id, month);
  revalidatePath('/admin'); revalidatePath('/jungle'); revalidatePath('/');
}

export async function doneInquiry(f: FormData) {
  await admin();
  await setInquiryDone(text(f, 'id'), f.get('done') === '1');
  revalidatePath('/admin');
}
