import 'server-only';
import type { Viewer } from '@/lib/auth';
import { getAccount, getClass, getWork, type Account, type Post } from '@/lib/model';

// 누가 누구의 글을 볼 수 있는가.
// 본사는 모두, 교사는 자기 반 학생, 보호자는 자기 자녀, 학생은 자기 자신.
export async function canSeeStudent(v: Viewer | null, studentId: string) {
  if (!v) return false;
  if (v.role === 'admin') return true;
  if (v.id === studentId) return true;
  if (v.role === 'parent') return (v.childIds || []).includes(studentId);
  if (v.role === 'teacher') {
    const st = await getAccount(studentId);
    const k = st?.classId ? await getClass(st.classId) : null;
    return !!k?.teacherIds.includes(v.id);
  }
  return false;
}

export async function teacherOwnsClass(v: Viewer | null, classId: string) {
  if (!v) return false;
  if (v.role === 'admin') return true;
  if (v.role !== 'teacher') return false;
  const k = await getClass(classId);
  return !!k?.teacherIds.includes(v.id);
}

// 같은 씨앗의 남의 글은 내 정글 초고(여섯째 지면)를 낸 뒤에 열린다(플랫폼 기획서 v3, 워크플로우).
// 학생이 아닌 사람(보호자·교사·방문자)에게는 이 잠금이 없다.
export async function shelfLockFor(v: Viewer | null, n: number) {
  if (!v || v.role !== 'student') return false;
  const w = await getWork(v.id, n);
  return !w?.draftAt;
}

export async function lockedPost(v: Viewer | null, p: Post) {
  if (v && v.id === p.studentId) return false;
  return shelfLockFor(v, p.n);
}

export const childrenOf = async (v: Viewer) =>
  v.role === 'parent' ? ((await Promise.all((v.childIds || []).map(getAccount))).filter(Boolean) as Account[]) : [];
