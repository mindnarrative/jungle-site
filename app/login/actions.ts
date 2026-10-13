'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { allowLogin, checkAdminPassword, cookieOptions, makeSession, passwordMatches, SESSION_COOKIE } from '@/lib/auth';
import { getAccount, normId } from '@/lib/model';

export async function login(_: string | null, form: FormData): Promise<string | null> {
  if (!(await allowLogin())) return '짧은 시간에 너무 여러 번 시도했습니다. 10분 뒤에 다시 해 주세요.';
  const id = normId(String(form.get('id') || ''));
  const pw = String(form.get('pw') || '');
  let who: string | null = null;
  if (id === 'admin') { if (checkAdminPassword(pw)) who = 'admin'; }
  else {
    const a = await getAccount(id).catch(() => null);
    if (a && !a.disabled && passwordMatches(pw, a.salt, a.hash)) who = a.id;
  }
  if (!who) return '아이디나 비밀번호가 맞지 않습니다.';
  const t = makeSession(who);
  (await cookies()).set(SESSION_COOKIE, t.value, cookieOptions(t.maxAge));
  const a = who === 'admin' ? null : await getAccount(who);
  redirect(who === 'admin' ? '/admin' : a?.role === 'teacher' ? '/teacher' : a?.role === 'parent' ? '/family' : '/write');
}
