import type { Metadata } from 'next';
import Link from 'next/link';
import ActionForm from '@/components/ActionForm';
import { hqReady } from '@/lib/analyzer';
import { requireViewer } from '@/lib/auth';
import { allAccounts, allClasses, allInquiries, allPosts, getPicks } from '@/lib/model';
import { thisMonth, weigh } from '@/lib/shelf';
import { seed, shortTitle } from '@/lib/seeds';
import { addClass, addTeacher, doneInquiry, hidePost, pickPost, setClassTeachers, setTeacherDisabled } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '본사', robots: { index: false } };

export default async function Admin() {
  await requireViewer(['admin']);
  const accounts = await allAccounts();
  const teachers = accounts.filter((a) => a.role === 'teacher');
  const classes = await allClasses();
  const posts = (await weigh(await allPosts(true))).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const month = thisMonth();
  const picked = new Set((await getPicks()).filter((x) => x.month === month).map((x) => x.postId));
  const inquiries = await allInquiries();
  const kv = Boolean(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);

  return (
    <div className="stack-lg">
      <div className="stack"><h1>본사</h1>
        <p className="row small">
          <span className={`pill ${kv ? '' : 'gold'}`}>저장소 {kv ? 'Upstash Redis' : '이 컴퓨터의 파일(시험용)'}</span>
          <span className={`pill ${hqReady() ? '' : 'gold'}`}>분석 서버 {hqReady() ? '연결됨' : '연결 안 됨'}</span>
          <span className="pill gray">교사 {teachers.length} · 학생 {accounts.filter((a) => a.role === 'student').length} · 보호자 {accounts.filter((a) => a.role === 'parent').length}</span>
        </p>
      </div>

      <section className="grid2">
        <div className="card">
          <h3>교사 계정 만들기</h3>
          <ActionForm action={addTeacher} submit="만들기">
            <div className="form-row">
              <div><label className="f">이름</label><input type="text" name="name" required /></div>
              <div><label className="f">아이디</label><input type="text" name="id" autoCapitalize="none" required /></div>
              <div><label className="f">비밀번호</label><input type="text" name="pw" required /></div>
            </div>
          </ActionForm>
          <table className="t" style={{ marginTop: 14 }}><tbody>
            {teachers.map((t) => (
              <tr key={t.id}><td>{t.name} <span className="muted">({t.id})</span></td>
                <td><form action={setTeacherDisabled}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="off" value={t.disabled ? '0' : '1'} />
                  <button className="btn small ghost">{t.disabled ? '다시 열기' : '막기'}</button></form></td></tr>
            ))}
          </tbody></table>
        </div>
        <div className="card">
          <h3>반 만들기</h3>
          <ActionForm action={addClass} submit="만들기">
            <label className="f">반 이름</label><input type="text" name="name" placeholder="예: 겨울특강 화목 오후반" required />
            <label className="f">맡을 선생님</label>
            <div className="checks">{teachers.map((t) => <label key={t.id}><input type="checkbox" name="teacher" value={t.id} /> {t.name}</label>)}</div>
          </ActionForm>
          <table className="t" style={{ marginTop: 14 }}><tbody>
            {classes.map((k) => (
              <tr key={k.id}><td><Link href={`/teacher/class/${k.id}`}>{k.name}</Link> <span className="muted small">학생 {k.studentIds.length}</span></td>
                <td><form action={setClassTeachers} className="row"><input type="hidden" name="id" value={k.id} />
                  {teachers.map((t) => <label key={t.id} className="small"><input type="checkbox" name="teacher" value={t.id} defaultChecked={k.teacherIds.includes(t.id)} /> {t.name}</label>)}
                  <button className="btn small ghost">맡은 교사 바꾸기</button></form></td></tr>
            ))}
          </tbody></table>
        </div>
      </section>

      <section className="card stack">
        <h3>서가 관리 · 이달의 정글 ({month})</h3>
        <p className="small muted">숫자(추천·높이)는 교사와 본사에게만 보입니다. 이달의 정글은 서가 첫머리와 첫 화면에 걸리고, 높이와 상관없이 그달 동안 내려가지 않습니다.</p>
        <div className="scroll-x"><table className="t">
          <thead><tr><th>표제어</th><th>씨앗</th><th>가명</th><th>추천</th><th>높이</th><th /></tr></thead>
          <tbody>
            {posts.length === 0 && <tr><td colSpan={6} className="muted">아직 서가에 오른 글이 없습니다.</td></tr>}
            {posts.map((p) => (
              <tr key={p.id} style={{ opacity: p.hidden ? 0.5 : 1 }}>
                <td><Link href={`/jungle/${p.id}`}>{p.headword || '제목 없음'}</Link></td>
                <td>{p.n}. {shortTitle(seed(p.n)!)}</td><td>{p.pen}</td><td>{p.votes}</td><td>{p.height.toFixed(1)}</td>
                <td className="row">
                  <form action={pickPost}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="month" value={month} /><input type="hidden" name="remove" value={picked.has(p.id) ? '1' : '0'} />
                    <button className="btn small ghost">{picked.has(p.id) ? '이달의 정글 해제' : '이달의 정글로'}</button></form>
                  <form action={hidePost}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="hide" value={p.hidden ? '0' : '1'} />
                    <button className="btn small ghost">{p.hidden ? '다시 꽂기' : '숨기기'}</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>

      <section className="card stack">
        <h3>상담·도입 문의</h3>
        {inquiries.length === 0 ? <p className="muted">문의가 아직 없습니다.</p> : (
          <div className="scroll-x"><table className="t"><tbody>
            {inquiries.map((q) => (
              <tr key={q.id} style={{ opacity: q.done ? 0.5 : 1 }}>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(q.at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
                <td><b>{q.name}</b> · {q.contact}<br /><span className="pill gray">{q.kind}</span> {q.body}</td>
                <td><form action={doneInquiry}><input type="hidden" name="id" value={q.id} /><input type="hidden" name="done" value={q.done ? '0' : '1'} />
                  <button className="btn small ghost">{q.done ? '다시 열기' : '처리함'}</button></form></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </section>
    </div>
  );
}
