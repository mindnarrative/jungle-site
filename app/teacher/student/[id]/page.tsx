import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ActionForm from '@/components/ActionForm';
import { canSeeStudent } from '@/lib/access';
import { hqReady, MIN_CHARS } from '@/lib/analyzer';
import { requireViewer } from '@/lib/auth';
import { charCount, getAccount, getClass, getPost, headwordOf, jungleText, nongeulText, pagesDone, propositionOf, worksOf } from '@/lib/model';
import { seed, seeds, shortTitle } from '@/lib/seeds';
import { AXES } from '@/lib/site';
import { approvePost, refreshReading, releaseReading, requestReading, saveFeedback, seedChoices, setConsent, updateStudent, withdrawPost } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '학생', robots: { index: false } };

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' }) : '');

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const v = await requireViewer(['teacher', 'admin']);
  const st = await getAccount(id);
  if (!st || st.role !== 'student' || !(await canSeeStudent(v, st.id))) notFound();
  const k = st.classId ? await getClass(st.classId) : null;
  const works = (await worksOf(st.id)).sort((a, b) => a.n - b.n);
  const total = works.reduce((s, w) => s + charCount(w), 0);
  const posts = Object.fromEntries(await Promise.all(works.filter((w) => w.postId).map(async (w) => [w.n, await getPost(w.postId!)] as const)));
  const rec = st.hq ? await seedChoices(st.id) : null;
  const recSeeds = (rec?.['씨앗'] as { 번호: number; 제목: string; 한줄: string; 이유: string[] }[] | undefined) || [];

  return (
    <div className="stack-lg">
      <div className="stack">
        <p className="small">{k ? <Link href={`/teacher/class/${k.id}`}>← {k.name}</Link> : <Link href="/teacher">← 교사실</Link>}</p>
        <h1>{st.pen} <span className="muted" style={{ fontSize: '.6em' }}>{st.name} · {st.grade} · {st.id}</span></h1>
      </div>

      <section className="grid2">
        <div className="card stack">
          <h3>보호자 동의</h3>
          {st.consent ? <p>서면 동의를 받은 기록이 있습니다({fmt(st.consent.at)}). 이 학생의 글은 서가에 올릴 수 있습니다.</p>
            : <p>서면 동의를 받은 기록이 없습니다. 동의서를 받기 전에는 이 학생의 글을 서가에 올리지 않습니다.</p>}
          <form action={setConsent}><input type="hidden" name="id" value={st.id} /><input type="hidden" name="on" value={st.consent ? '0' : '1'} />
            <button className="btn small ghost">{st.consent ? '동의 기록 지우기' : '서면 동의서를 받았습니다'}</button></form>
        </div>
        <div className="card">
          <h3>계정 고치기</h3>
          <ActionForm action={updateStudent} submit="고치기" ghost>
            <input type="hidden" name="id" value={st.id} />
            <div className="form-row">
              <div><label className="f">가명</label><input type="text" name="pen" defaultValue={st.pen} /></div>
              <div><label className="f">학년</label><input type="text" name="grade" defaultValue={st.grade} /></div>
              <div><label className="f">새 비밀번호(바꿀 때만)</label><input type="text" name="pw" /></div>
            </div>
            <label className="checks" style={{ display: 'block', marginTop: 8 }}><input type="checkbox" name="disabled" defaultChecked={st.disabled} /> 이 계정을 막습니다(수강을 마쳤거나 그만둔 경우)</label>
          </ActionForm>
        </div>
      </section>

      <section className="stack">
        <h2>쓴 씨앗</h2>
        <p className="small muted">종이에 쓴 글은 ‘지면 보기·대신 넣기’에서 아이의 문장 그대로 옮겨 넣습니다. 새 씨앗을 대신 열 때는 <Link href={`/teacher/student/${st.id}#open`}>맨 아래 목록</Link>에서 고릅니다.</p>
        {works.length === 0 && <div className="empty">아직 쓴 씨앗이 없습니다.</div>}
        {works.map((w) => {
          const s = seed(w.n)!; const fb = w.feedback; const post = posts[w.n];
          return (
            <article key={w.n} className="card stack">
              <div className="section-h" style={{ margin: 0 }}>
                <h3>{w.n}. {shortTitle(s)}</h3>
                <span className="row">
                  <span className="pill">{pagesDone(w)}/11 지면</span>
                  <span className={`pill ${w.mission1?.ok ? '' : 'gold'}`}>미션 1 {w.mission1 ? (w.mission1.ok ? '통과' : '다시') : '대기'}</span>
                  <span className={`pill ${w.mission2?.ok ? '' : 'gold'}`}>미션 2 {w.mission2 ? (w.mission2.ok ? '통과' : '다시') : '대기'}</span>
                  {w.draftAt && <span className="pill">초고 {fmt(w.draftAt)}</span>}
                  {post && <span className={`pill ${post.hidden ? 'gray' : ''}`}>{post.hidden ? '서가에서 내림' : '서가에 있음'}</span>}
                </span>
              </div>
              <p className="small">표제어 <b className="serif">{headwordOf(w) || '—'}</b> · 명제 <b className="serif">{propositionOf(w) || '—'}</b> · {charCount(w).toLocaleString()}자</p>
              <div className="row">
                <Link className="btn small" href={`/write/${w.n}?as=${st.id}`}>지면 보기·대신 넣기·미션 판정</Link>
                <Link className="btn small ghost" href={`/seeds/${w.n}`}>씨앗과 교사 노트</Link>
              </div>
              {jungleText(w) && <details><summary>정글 읽기</summary><div className="writing" style={{ fontSize: 18, marginTop: 10 }}>{jungleText(w)}</div></details>}
              {nongeulText(w) && <details><summary>논글 읽기</summary><div className="writing" style={{ fontSize: 18, marginTop: 10 }}>{nongeulText(w)}</div></details>}

              <details>
                <summary>첨삭 기록표{fb ? ` · ${fmt(fb.at)}에 남김` : ''}</summary>
                <ActionForm action={saveFeedback} submit="첨삭 기록 남기기">
                  <input type="hidden" name="id" value={st.id} /><input type="hidden" name="n" value={w.n} />
                  <table className="t"><thead><tr><th style={{ width: '22%' }}>축</th><th style={{ width: '14%' }}>등급</th><th>그렇게 본 까닭</th></tr></thead><tbody>
                    {AXES.map((a, i) => (
                      <tr key={a}><th>{a}</th>
                        <td><select name={`g${i}`} defaultValue={fb?.axes[i]?.grade ?? ''}><option value="">—</option>{[1, 2, 3, 4, 5].map((x) => <option key={x} value={x}>{x}</option>)}</select></td>
                        <td><input type="text" name={`w${i}`} defaultValue={fb?.axes[i]?.why || ''} /></td></tr>
                    ))}
                  </tbody></table>
                  <label className="f">이번 회차에 이어야 할 선 — 학생과 보호자에게는 이 문장만 보입니다</label>
                  <textarea name="line" rows={2} defaultValue={fb?.line || ''} />
                  <p className="small muted">첨삭은 교정이 아니라 완결의 조력입니다. 문장을 어른의 정답으로 고치지 않고, 끊긴 선을 잇고 틀린 선을 다시 긋도록 돕습니다.</p>
                </ActionForm>
              </details>

              <div className="box tint">
                <ActionForm action={approvePost} submit={post ? '서가의 사본을 지금 글로 바꾸기' : '서가에 올리기'}>
                  <input type="hidden" name="id" value={st.id} /><input type="hidden" name="n" value={w.n} />
                  <p className="small">보호자 동의, 미션 1·2 통과, 정글 초고가 갖춰진 글만 서가에 오릅니다. 아이의 문장은 한 글자도 고치지 않습니다.</p>
                </ActionForm>
                {post && (
                  <form action={withdrawPost} style={{ marginTop: 8 }}>
                    <input type="hidden" name="id" value={st.id} /><input type="hidden" name="n" value={w.n} /><input type="hidden" name="show" value={post.hidden ? '1' : '0'} />
                    <button className="btn small ghost">{post.hidden ? '서가에 다시 꽂기' : '서가에서 내리기'}</button>{' '}
                    {!post.hidden && <Link href={`/jungle/${post.id}`}>서가에서 보기</Link>}
                  </form>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section className="card stack">
        <h2 style={{ fontSize: 22 }}>성향분석 판독</h2>
        <p>지금까지 모인 글은 <b>{total.toLocaleString()}자</b>입니다. 한 아이의 글이 {MIN_CHARS.toLocaleString()}자를 넘으면 본사 분석 서버에 판독을 맡길 수 있습니다. 서버에는 이름 대신 가명과 학생 코드만 갑니다.</p>
        {!hqReady() ? <p className="notice">분석 서버가 아직 연결되지 않았습니다. 연결되면 이 자리에서 판독을 맡기고 결과지를 검토할 수 있습니다.</p> : (<>
          <ActionForm action={requestReading} submit={st.hq ? '지금까지의 글로 다시 판독 맡기기' : '판독 맡기기'} ghost={!!st.hq}>
            <input type="hidden" name="id" value={st.id} />
          </ActionForm>
          {st.hq && (<>
            <form action={refreshReading} className="row"><input type="hidden" name="id" value={st.id} />
              <span>상태: <b>{st.hq.status || '대기'}</b> · {fmt(st.hq.at)}에 맡김</span><button className="btn small ghost">상태 새로 보기</button></form>
            <p><a href={`/api/teacher/sheet/${st.id}`} target="_blank" rel="noreferrer">교사용 지도 카드 열기</a></p>
            <ActionForm action={releaseReading} submit="검토를 마치고 학생용 결과지 열기">
              <input type="hidden" name="id" value={st.id} />
              <label className="f">다음 씨앗 — 분석기가 고른 셋 가운데서 선생님이 고릅니다</label>
              <select name="seed" defaultValue={st.hq.seed ?? ''}>
                <option value="">고르지 않음</option>
                {(recSeeds.length ? recSeeds.map((r) => ({ n: r.번호, t: `${r.번호}. ${r.제목} — ${r.한줄}` })) : seeds().map((s) => ({ n: s.n, t: `${s.n}. ${shortTitle(s)}` })))
                  .map((o) => <option key={o.n} value={o.n}>{o.t}</option>)}
              </select>
              <label className="f">선생님의 한마디</label>
              <textarea name="memo" rows={2} defaultValue={st.hq.memo || ''} />
            </ActionForm>
            {st.hq.link && <p className="small">학생·보호자가 여는 결과지: <a href={st.hq.link} target="_blank" rel="noreferrer">{st.hq.link}</a></p>}
          </>)}
        </>)}
      </section>

      <section className="stack" id="open">
        <h2 style={{ fontSize: 22 }}>새 씨앗을 대신 열기</h2>
        <div className="row">
          {seeds().filter((s) => !works.some((w) => w.n === s.n)).map((s) => (
            <Link key={s.n} className="btn small ghost" href={`/write/${s.n}?as=${st.id}`}>{s.n}. {shortTitle(s)}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}
