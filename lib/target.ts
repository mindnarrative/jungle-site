import 'server-only';
import { canSeeStudent } from '@/lib/access';
import { currentViewer, type Viewer } from '@/lib/auth';
import { getAccount, type Account } from '@/lib/model';

// 쓰기 화면과 쓰기 API가 '누구의 글'을 다루는지 정한다.
// 학생은 자기 글, 교사·본사는 ?as=학생아이디 로 자기 반 학생의 글을 대신 넣는다(종이에 쓴 글).
export async function writeTarget(as: string | null): Promise<{ v: Viewer; student: Account; proxy: boolean } | null> {
  const v = await currentViewer();
  if (!v) return null;
  if (v.role === 'student' && !as) return { v, student: v, proxy: false };
  if ((v.role === 'teacher' || v.role === 'admin') && as) {
    const st = await getAccount(as);
    if (st?.role === 'student' && (await canSeeStudent(v, st.id))) return { v, student: st, proxy: true };
  }
  return null;
}
