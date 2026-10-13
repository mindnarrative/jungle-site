import 'server-only';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAccount, type Account } from '@/lib/model';

// 회원 가입 화면은 두지 않는다. 계정은 본사가 교사에게, 교사가 학생과 보호자에게 만들어 준다.
// 아이들의 계정이므로 보호자의 서면 동의를 받은 뒤에 교사가 연다(만 14세 미만 법정대리인 동의).
// 본사(관리자)는 환경 변수 ADMIN_PASSWORD 로 들어온다.

export const SESSION_COOKIE = 'jungle_session';
const SESSION_DAYS = 14;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET 환경 변수(32자 이상)가 필요합니다.');
  return s;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return { salt, hash: scryptSync(password, salt, 32).toString('hex') };
}

export function passwordMatches(password: string, salt: string, hash: string) {
  const got = scryptSync(password, salt, 32);
  const want = Buffer.from(hash, 'hex');
  return want.length === got.length && timingSafeEqual(got, want);
}

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('hex');

export function makeSession(who: string) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  const payload = `${Buffer.from(who).toString('base64url')}.${exp}`;
  return { value: `${payload}.${sign(payload)}`, maxAge: SESSION_DAYS * 86400 };
}

function readSession(raw: string | undefined) {
  if (!raw) return null;
  const [k, exp, sig] = raw.split('.');
  if (!k || !exp || !sig) return null;
  const want = Buffer.from(sign(`${k}.${exp}`), 'hex');
  const got = Buffer.from(sig, 'hex');
  if (want.length !== got.length || !timingSafeEqual(want, got) || Number(exp) < Date.now()) return null;
  return Buffer.from(k, 'base64url').toString();
}

export const cookieOptions = (maxAge: number) => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge });

export function checkAdminPassword(pw: string) {
  const want = process.env.ADMIN_PASSWORD;
  if (!want || want.length < 8) return false;
  const a = Buffer.from(pw), b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

// 지금 보고 있는 사람. 본사는 role 'admin' 인 가상의 계정으로 다룬다.
export type Viewer = Account | { id: 'admin'; role: 'admin'; name: '본사' };

export async function currentViewer(): Promise<Viewer | null> {
  const who = readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!who) return null;
  if (who === 'admin') return { id: 'admin', role: 'admin', name: '본사' };
  const a = await getAccount(who).catch(() => null);
  return a && !a.disabled ? a : null; // 계정을 막으면 남아 있는 로그인도 바로 끊긴다.
}

export async function requireViewer(roles?: string[]) {
  const v = await currentViewer();
  if (!v) redirect('/login');
  if (roles && !roles.includes(v.role)) redirect('/');
  return v;
}

export const isStaff = (v: Viewer | null) => !!v && (v.role === 'teacher' || v.role === 'admin');

// 로그인 시도 제한: 같은 주소에서 10분에 10번.
const tries = new Map<string, number[]>();
export async function allowLogin() {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  const now = Date.now();
  const list = (tries.get(ip) || []).filter((t) => now - t < 10 * 60e3);
  list.push(now);
  tries.set(ip, list);
  return list.length <= 10;
}
