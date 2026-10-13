'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { canSeeStudent, teacherOwnsClass } from '@/lib/access';
import { currentViewer, hashPassword } from '@/lib/auth';
import { hqReady, MIN_CHARS, recommendation, release, submitBatch } from '@/lib/analyzer';
import {
  charCount, getAccount, getClass, getWork, ID_RULE, jungleText, nongeulText, normId, publish, saveAccount, saveClass,
  saveWork, setPostHidden, worksOf, type Account,
} from '@/lib/model';
import { AXES } from '@/lib/site';

const now = () => new Date().toISOString();
const text = (f: FormData, k: string, max = 200) => String(f.get(k) || '').trim().slice(0, max);

async function staff() {
  const v = await currentViewer();
  if (!v || (v.role !== 'teacher' && v.role !== 'admin')) redirect('/login');
  return v;
}
async function ownStudent(id: string) {
  const v = await staff();
  const st = await getAccount(id);
  if (!st || st.role !== 'student' || !(await canSeeStudent(v, st.id))) throw new Error('이 학생을 다룰 수 없습니다.');
  return { v, st };
}

export type Result = { ok?: string; error?: string } | null;

// 학생 계정 만들기. 실명은 교사·본사만 보고, 서가와 결과지에는 가명만 나간다.
export async function addStudent(_: Result, f: FormData): Promise<Result> {
  const v = await staff();
  const classId = text(f, 'classId');
  if (!(await teacherOwnsClass(v, classId))) return { error: '이 반을 다룰 수 없습니다.' };
  const id = normId(text(f, 'id', 20)); const pw = text(f, 'pw', 64);
  const name = text(f, 'name', 30); const pen = text(f, 'pen', 20); const grade = text(f, 'grade', 10);
  if (!ID_RULE.test(id)) return { error: '아이디는 영문 소문자·숫자로 3~20자입니다.' };
  if (pw.length < 6) return { error: '비밀번호는 6자 이상으로 해 주세요.' };
  if (!name || !pen) return { error: '이름과 가명을 모두 적어 주세요.' };
  if (await getAccount(id)) return { error: '이미 있는 아이디입니다.' };
  const consent = f.get('consent') === 'on' ? { at: now(), by: v.id } : null;
  const a: Account = { id, role: 'student', name, pen, grade, classId, consent, createdAt: now(), ...hashPassword(pw) };
  await saveAccount(a, true);
  const k = (await getClass(classId))!; k.studentIds.push(id); await saveClass(k);
  // 보호자 계정을 함께 만들 때
  const pid = normId(text(f, 'pid', 20)); const ppw = text(f, 'ppw', 64);
  if (pid) {
    if (!ID_RULE.test(pid) || ppw.length < 6) return { ok: `학생 계정 ${id}를 만들었습니다. 보호자 아이디나 비밀번호가 규칙에 맞지 않아 보호자 계정은 만들지 않았습니다.` };
    const ex = await getAccount(pid);
    if (ex && ex.role !== 'parent') return { ok: `학생 계정 ${id}를 만들었습니다. 보호자 아이디 ${pid}는 이미 다른 계정입니다.` };
    if (ex) { ex.childIds = [...new Set([...(ex.childIds || []), id])]; await saveAccount(ex); }
    else await saveAccount({ id: pid, role: 'parent', name: `${name} 보호자`, childIds: [id], createdAt: now(), ...hashPassword(ppw) }, true);
  }
  revalidatePath(`/teacher/class/${classId}`);
  return { ok: `${pen}(${name}) 학생 계정을 만들었습니다.${pid ? ` 보호자 계정 ${pid}도 함께 만들었습니다.` : ''}` };
}

export async function setConsent(f: FormData) {
  const { v, st } = await ownStudent(text(f, 'id'));
  st.consent = f.get('on') === '1' ? { at: now(), by: v.id } : null;
  await saveAccount(st);
  revalidatePath(`/teacher/student/${st.id}`);
}

export async function updateStudent(_: Result, f: FormData): Promise<Result> {
  const { st } = await ownStudent(text(f, 'id'));
  const pen = text(f, 'pen', 20); const grade = text(f, 'grade', 10); const pw = text(f, 'pw', 64);
  if (pen) st.pen = pen;
  st.grade = grade;
  if (pw) { if (pw.length < 6) return { error: '비밀번호는 6자 이상으로 해 주세요.' }; Object.assign(st, hashPassword(pw)); }
  st.disabled = f.get('disabled') === 'on';
  await saveAccount(st);
  revalidatePath(`/teacher/student/${st.id}`);
  return { ok: '고쳤습니다.' };
}

// 첨삭 기록표: 네 축의 등급(1~5)과 그렇게 본 까닭, 이번 회차에 이어야 할 선.
export async function saveFeedback(_: Result, f: FormData): Promise<Result> {
  const { v, st } = await ownStudent(text(f, 'id'));
  const n = Number(f.get('n'));
  const w = await getWork(st.id, n);
  if (!w) return { error: '아직 쓴 글이 없습니다.' };
  w.feedback = {
    axes: AXES.map((name, i) => ({ name, grade: Number(f.get(`g${i}`)) || null, why: text(f, `w${i}`, 400) })),
    line: text(f, 'line', 500), at: now(), by: v.id,
  };
  await saveWork(w);
  revalidatePath(`/teacher/student/${st.id}`);
  return { ok: '첨삭 기록을 남겼습니다.' };
}

// 서가에 올리기: 보호자 동의 + 미션 1·2 통과 + 정글 초고가 있어야 한다. 아이의 문장은 고치지 않고 그대로 찍어 둔다.
export async function approvePost(_: Result, f: FormData): Promise<Result> {
  const { v, st } = await ownStudent(text(f, 'id'));
  const n = Number(f.get('n'));
  const w = await getWork(st.id, n);
  if (!w) return { error: '아직 쓴 글이 없습니다.' };
  if (!st.consent) return { error: '보호자의 서면 동의를 받은 기록이 없습니다. 동의를 받은 뒤에 기록하고 올려 주세요.' };
  if (!w.draftAt || !jungleText(w).trim()) return { error: '정글 초고가 아직 없습니다.' };
  if (!w.mission1?.ok || !w.mission2?.ok) return { error: '미션 1과 미션 2를 통과한 글만 서가에 올립니다.' };
  await publish(w, st, v.id);
  revalidatePath(`/teacher/student/${st.id}`); revalidatePath('/jungle');
  return { ok: '서가에 올렸습니다. 지금 쓴 글로 서가의 사본을 바꿀 때도 이 단추를 누릅니다.' };
}

export async function withdrawPost(f: FormData) {
  const { st } = await ownStudent(text(f, 'id'));
  const w = await getWork(st.id, Number(f.get('n')));
  if (w?.postId) await setPostHidden(w.postId, f.get('show') !== '1');
  revalidatePath(`/teacher/student/${st.id}`); revalidatePath('/jungle');
}

// 판독 요청: 한 학생의 정글·논글·다른 자리 글을 모아 분석 서버로 보낸다(실명 대신 가명과 코드).
export async function requestReading(_: Result, f: FormData): Promise<Result> {
  const { v, st } = await ownStudent(text(f, 'id'));
  if (!hqReady()) return { error: '분석 서버가 아직 연결되지 않았습니다(JUNGLE_HQ_URL, JUNGLE_HQ_KEY).' };
  const works = await worksOf(st.id);
  const total = works.reduce((s, w) => s + charCount(w), 0);
  if (total < MIN_CHARS) return { error: `글이 ${total.toLocaleString()}자 모였습니다. ${MIN_CHARS.toLocaleString()}자가 넘으면 판독할 수 있습니다.` };
  const body = works.map((w) => [`[${w.n}번째 씨앗 · 정글]`, jungleText(w), `[${w.n}번째 씨앗 · 논글]`, nongeulText(w)].join('\n\n')).join('\n\n');
  const code = st.id.replace(/[^\w-]/g, '_');
  const k = st.classId ? await getClass(st.classId) : null;
  try {
    const batch = await submitBatch(k?.name || '', v.name, [{ code, pen: st.pen || code, grade: st.grade || '', text: body, seed: works.at(-1)?.n ?? null, genre: '정글' }]);
    st.hq = { batch, code, at: now(), status: '대기' };
    await saveAccount(st);
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath(`/teacher/student/${st.id}`);
  return { ok: '판독을 맡겼습니다. 몇 분 뒤에 상태를 확인해 주세요.' };
}

export async function refreshReading(f: FormData) {
  const { st } = await ownStudent(text(f, 'id'));
  if (!st.hq) return;
  try {
    const { batchStatus } = await import('@/lib/analyzer');
    const s = await batchStatus(st.hq.batch);
    st.hq.status = s['상태'];
    await saveAccount(st);
  } catch { /* 분석 서버가 잠시 닿지 않으면 그대로 둔다 */ }
  revalidatePath(`/teacher/student/${st.id}`);
}

export async function seedChoices(id: string) {
  const { st } = await ownStudent(id);
  if (!st.hq) return null;
  try { return await recommendation(st.hq.batch, st.hq.code); } catch { return null; }
}

// 교사가 다음 씨앗과 한마디를 고르고 학생용 결과지를 연다. 교사 검토 없이 나가는 결과지는 없다.
export async function releaseReading(_: Result, f: FormData): Promise<Result> {
  const { st } = await ownStudent(text(f, 'id'));
  if (!st.hq) return { error: '판독을 먼저 맡겨 주세요.' };
  const seedNo = Number(f.get('seed')) || null; const memo = text(f, 'memo', 300);
  try {
    const link = await release(st.hq.batch, st.hq.code, seedNo, memo);
    st.hq = { ...st.hq, link: link || st.hq.link, seed: seedNo, memo };
    await saveAccount(st);
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath(`/teacher/student/${st.id}`);
  return { ok: '학생과 보호자에게 결과지를 열었습니다.' };
}
