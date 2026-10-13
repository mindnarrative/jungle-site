import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ActionForm from '@/components/ActionForm';
import { teacherOwnsClass } from '@/lib/access';
import { requireViewer } from '@/lib/auth';
import { charCount, getClass, pagesDone, studentsOf, worksOf } from '@/lib/model';
import { addStudent } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '반', robots: { index: false } };

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const v = await requireViewer(['teacher', 'admin']);
  const k = await getClass(id);
  if (!k || !(await teacherOwnsClass(v, id))) notFound();
  const students = await studentsOf(k);
  const rows = await Promise.all(students.map(async (s) => {
    const ws = (await worksOf(s.id)).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    return { s, ws, chars: ws.reduce((t, w) => t + charCount(w), 0), last: ws[0] };
  }));
  return (
    <div className="stack-lg">
      <div className="stack">
        <p className="small"><Link href="/teacher">← 교사실</Link></p>
        <h1>{k.name}</h1>
        <div className="row"><Link className="btn small ghost" href={`/book/${k.id}`}>반 문고집 보기·인쇄</Link></div>
      </div>
      <section className="scroll-x">
        <table className="t">
          <thead><tr><th>가명(이름)</th><th>학년</th><th>보호자 동의</th><th>지금 쓰는 씨앗</th><th>쓴 씨앗</th><th>모인 글</th><th /></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="muted">아직 학생이 없습니다. 아래에서 계정을 만들어 주세요.</td></tr>}
            {rows.map(({ s, ws, chars, last }) => (
              <tr key={s.id}>
                <td><b>{s.pen}</b> <span className="muted">({s.name} · {s.id})</span>{s.disabled && <> <span className="pill gray">막음</span></>}</td>
                <td>{s.grade}</td>
                <td>{s.consent ? <span className="pill">받음</span> : <span className="pill gold">아직</span>}</td>
                <td>{last ? `${last.n}번째 · ${pagesDone(last)}/11` : '—'}</td>
                <td>{ws.length}</td>
                <td>{chars.toLocaleString()}자</td>
                <td><Link href={`/teacher/student/${s.id}`}>열기</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card">
        <h2 style={{ fontSize: 22 }}>학생 계정 만들기</h2>
        <p className="small muted" style={{ margin: '6px 0 4px' }}>이름(실명)은 교사와 본사만 봅니다. 서가와 결과지에는 가명만 나갑니다. 보호자의 서면 동의서를 받았다면 아래에 표시해 주세요. 동의 기록이 없는 학생의 글은 서가에 오르지 않습니다.</p>
        <ActionForm action={addStudent} submit="계정 만들기">
          <input type="hidden" name="classId" value={k.id} />
          <div className="form-row">
            <div><label className="f">이름(실명)</label><input type="text" name="name" required /></div>
            <div><label className="f">가명(서가에 나가는 이름)</label><input type="text" name="pen" required /></div>
            <div><label className="f">학년</label><input type="text" name="grade" placeholder="예: 5학년" /></div>
            <div><label className="f">아이디</label><input type="text" name="id" autoCapitalize="none" required /></div>
            <div><label className="f">비밀번호</label><input type="text" name="pw" required /></div>
          </div>
          <label className="checks" style={{ display: 'block', marginTop: 10 }}><input type="checkbox" name="consent" /> 보호자의 서면 동의서를 받았습니다(만 14세 미만 개인정보 수집·작품 공개).</label>
          <details style={{ marginTop: 10 }}><summary>보호자 계정도 함께 만들기</summary>
            <div className="form-row" style={{ marginTop: 8 }}>
              <div><label className="f">보호자 아이디</label><input type="text" name="pid" autoCapitalize="none" /></div>
              <div><label className="f">보호자 비밀번호</label><input type="text" name="ppw" /></div>
            </div>
            <p className="small muted">형제가 있으면 같은 보호자 아이디를 적어 주세요. 한 계정에 자녀가 함께 묶입니다.</p>
          </details>
        </ActionForm>
      </section>
    </div>
  );
}
