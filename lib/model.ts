import 'server-only';
import { randomBytes } from 'node:crypto';
import { store } from '@/lib/store';

// 이야기 정글의 저장 구조.
//   acct:<아이디>          계정(학생·보호자·교사)
//   accounts               계정 아이디 목록
//   class:<반id> / classes 반
//   work:<학생>:<씨앗>      한 학생이 한 씨앗에서 쓴 열한 지면
//   worklist:<학생>        그 학생이 연 씨앗 번호들
//   post:<글id> / posts     서가에 오른 글(공개 승인 때 찍어 둔 사본)
//   votes:<글id>           추천 { 추천한 사람: 시각 }
//   reads:<글id>           끝까지 읽은 기록 { 읽은 사람: 시각 } — 추천 단추와 훗날 인세의 근거
//   picks                  이달의 정글
//   inquiries              상담·도입 문의

export type Role = 'student' | 'parent' | 'teacher';
export type Account = {
  id: string; role: Role; name: string; salt: string; hash: string; createdAt: string;
  pen?: string; grade?: string; classId?: string;               // 학생
  consent?: { at: string; by: string } | null;                  // 학생: 보호자 서면 동의를 받은 기록
  childIds?: string[];                                          // 보호자
  disabled?: boolean;
  hq?: { batch: string; code: string; at: string; link?: string; status?: string; seed?: number | null; memo?: string }; // 분석 서버
};
export type Klass = { id: string; name: string; teacherIds: string[]; studentIds: string[]; createdAt: string };
export type Judge = { ok: boolean; note: string; at: string; by: string };
export type Feedback = { axes: { name: string; grade: number | null; why: string }[]; line: string; at: string; by: string };
export type Pages = Record<string, unknown>;
export type Work = {
  studentId: string; n: number; pages: Pages; startedAt: string; updatedAt: string;
  draftAt?: string; mission1?: Judge; mission2?: Judge; feedback?: Feedback; postId?: string; enteredBy?: string;
};
export type Post = {
  id: string; studentId: string; n: number; pen: string; grade: string; classId: string;
  headword: string; jungle: string; nongeul: string; proposition: string;
  publishedAt: string; by: string; hidden?: boolean;
};
export type Pick = { postId: string; month: string; at: string };
export type Inquiry = { id: string; name: string; contact: string; kind: string; body: string; at: string; done?: boolean };

const s = () => store();
const now = () => new Date().toISOString();
export const newId = (p: string) => `${p}${Date.now().toString(36)}${randomBytes(3).toString('hex')}`;
export const normId = (id: string) => id.trim().toLowerCase();
export const ID_RULE = /^[a-z0-9][a-z0-9._-]{2,19}$/;

// ---- 계정
export const getAccount = (id: string) => s().get<Account>(`acct:${normId(id)}`);
export async function saveAccount(a: Account, isNew = false) {
  await s().set(`acct:${a.id}`, a);
  if (isNew) await s().lpush('accounts', a.id);
}
export async function allAccounts() {
  const ids = await s().lrange('accounts', 0, -1);
  const list = await Promise.all(ids.map((id) => getAccount(id)));
  return list.filter(Boolean) as Account[];
}

// ---- 반
export const getClass = (id: string) => s().get<Klass>(`class:${id}`);
export const saveClass = (k: Klass) => s().set(`class:${k.id}`, k);
export async function createClass(name: string, teacherIds: string[]) {
  const k: Klass = { id: newId('c'), name, teacherIds, studentIds: [], createdAt: now() };
  await saveClass(k); await s().lpush('classes', k.id);
  return k;
}
export async function allClasses() {
  const ids = await s().lrange('classes', 0, -1);
  return (await Promise.all(ids.map(getClass))).filter(Boolean) as Klass[];
}
export async function classesOf(teacherId: string) {
  return (await allClasses()).filter((k) => teacherId === 'admin' || k.teacherIds.includes(teacherId));
}
export async function studentsOf(k: Klass) {
  return (await Promise.all(k.studentIds.map(getAccount))).filter(Boolean) as Account[];
}

// ---- 글
export const getWork = (studentId: string, n: number) => s().get<Work>(`work:${studentId}:${n}`);
export async function workList(studentId: string) {
  return (await s().get<number[]>(`worklist:${studentId}`)) || [];
}
export async function worksOf(studentId: string) {
  const ns = await workList(studentId);
  return (await Promise.all(ns.map((n) => getWork(studentId, n)))).filter(Boolean) as Work[];
}
export async function saveWork(w: Work) {
  w.updatedAt = now();
  await s().set(`work:${w.studentId}:${w.n}`, w);
  const ns = await workList(w.studentId);
  if (!ns.includes(w.n)) await s().set(`worklist:${w.studentId}`, [...ns, w.n].sort((a, b) => a - b));
}
export async function openWork(studentId: string, n: number) {
  return (await getWork(studentId, n)) || { studentId, n, pages: {}, startedAt: now(), updatedAt: now() } as Work;
}

// 지면에서 글 본문만 뽑는다.
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const pg = (w: Work, k: string) => (w.pages[k] as Record<string, unknown>) || {};
export const jungleText = (w: Work) => str(pg(w, 'p6').text);
export const nongeulText = (w: Work) => str(pg(w, 'p9').body);
export const headwordOf = (w: Work) => {
  const p3 = pg(w, 'p3'); const heads = (p3.heads as string[]) || []; const i = Number(p3.pick);
  return (Number.isInteger(i) && heads[i]) || heads.find((h) => h?.trim()) || '';
};
export const propositionOf = (w: Work) => str(pg(w, 'p11').carry).trim() || str(pg(w, 'p10').prop).trim();
export const charCount = (w: Work) => [jungleText(w), nongeulText(w), str(pg(w, 'p11').scene)].join('').replace(/\s/g, '').length;
// 한 지면에 아이가 무엇이라도 적었는가.
export function hasWriting(v: unknown): boolean {
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.some(hasWriting);
  if (v && typeof v === 'object') return Object.values(v).some(hasWriting);
  return false;
}
export const PAGE_KEYS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11'];
export const pagesDone = (w: Work) => PAGE_KEYS.filter((k) => hasWriting(w.pages[k])).length;

// ---- 서가
export const getPost = (id: string) => s().get<Post>(`post:${id}`);
export async function allPosts(includeHidden = false) {
  const ids = await s().lrange('posts', 0, -1);
  const list = (await Promise.all(ids.map(getPost))).filter(Boolean) as Post[];
  return includeHidden ? list : list.filter((p) => !p.hidden);
}
export async function publish(w: Work, a: Account, by: string) {
  const prev = w.postId ? await getPost(w.postId) : null;
  const p: Post = {
    id: prev?.id || newId('p'), studentId: a.id, n: w.n, pen: a.pen || '이름 없는 아이', grade: a.grade || '', classId: a.classId || '',
    headword: headwordOf(w), jungle: jungleText(w), nongeul: nongeulText(w), proposition: propositionOf(w),
    publishedAt: prev?.publishedAt || now(), by, hidden: false,
  };
  await s().set(`post:${p.id}`, p);
  if (!prev) await s().lpush('posts', p.id);
  w.postId = p.id; await saveWork(w);
  return p;
}
export async function setPostHidden(id: string, hidden: boolean) {
  const p = await getPost(id); if (!p) return;
  p.hidden = hidden; await s().set(`post:${id}`, p);
}

export const getVotes = async (id: string) => (await s().get<Record<string, string>>(`votes:${id}`)) || {};
export const getReads = async (id: string) => (await s().get<Record<string, string>>(`reads:${id}`)) || {};
export async function markRead(id: string, who: string) {
  const r = await getReads(id); if (r[who]) return; r[who] = now(); await s().set(`reads:${id}`, r);
}
export async function toggleVote(id: string, who: string) {
  const v = await getVotes(id);
  if (v[who]) delete v[who]; else v[who] = now();
  await s().set(`votes:${id}`, v);
  return Boolean(v[who]);
}

// 서가의 높이: 추천 하나마다 1점, 일주일이 지날 때마다 그 추천의 무게가 절반이 된다.
const HALF_LIFE = 7 * 864e5;
export function heightOf(votes: Record<string, string>, at = Date.now()) {
  return Object.values(votes).reduce((sum, t) => sum + Math.pow(0.5, (at - Date.parse(t)) / HALF_LIFE), 0);
}
export const isNew = (p: Post, at = Date.now()) => at - Date.parse(p.publishedAt) < 7 * 864e5;

// ---- 이달의 정글
export const getPicks = async () => (await s().get<Pick[]>('picks')) || [];
export async function addPick(postId: string, month: string) {
  const list = (await getPicks()).filter((x) => x.month !== month || x.postId !== postId);
  await s().set('picks', [{ postId, month, at: now() }, ...list]);
}
export async function removePick(postId: string, month: string) {
  await s().set('picks', (await getPicks()).filter((x) => !(x.month === month && x.postId === postId)));
}

// ---- 문의
export async function addInquiry(q: Omit<Inquiry, 'id' | 'at'>) {
  const it: Inquiry = { ...q, id: newId('q'), at: now() };
  await s().set(`inq:${it.id}`, it); await s().lpush('inquiries', it.id);
}
export async function allInquiries() {
  const ids = await s().lrange('inquiries', 0, -1);
  return (await Promise.all(ids.map((id) => s().get<Inquiry>(`inq:${id}`)))).filter(Boolean) as Inquiry[];
}
export async function setInquiryDone(id: string, done: boolean) {
  const q = await s().get<Inquiry>(`inq:${id}`); if (!q) return; q.done = done; await s().set(`inq:${id}`, q);
}
