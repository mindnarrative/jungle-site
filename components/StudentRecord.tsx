import Link from 'next/link';
import type { Account, Work } from '@/lib/model';
import { charCount, headwordOf, propositionOf } from '@/lib/model';
import { seed, shortTitle } from '@/lib/seeds';
import { MIN_CHARS } from '@/lib/analyzer';

// 학생 본인과 보호자가 함께 보는 '내 글이 지나간 길'.
// 씨앗마다 뽑은 명제가 이어져 그 아이의 책의 목차가 된다. 첨삭 축의 이름과 등급은 보이지 않고,
// 선생님이 남긴 '이어야 할 선' 한 문장만 보인다.
export default function StudentRecord({ st, works, readHref }: { st: Account; works: Work[]; readHref: (n: number) => string }) {
  const sorted = [...works].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
  const total = works.reduce((s, w) => s + charCount(w), 0);
  return (
    <div className="stack-lg">
      <section className="stack">
        <h2>명제의 목차</h2>
        <p className="muted">씨앗 하나를 돌 때마다 한 문장이 남습니다. 이 문장들이 한 학기가 끝나면 책의 목차가 됩니다.</p>
        {sorted.length === 0 ? <div className="empty">아직 쓴 씨앗이 없습니다.</div> : (
          <ol className="path-list">
            {sorted.map((w, i) => { const s = seed(w.n)!; return (
              <li key={w.n}>
                <span className="no">{i + 1}</span>
                <div className="stack" style={{ gap: 4 }}>
                  <p className="pr">{propositionOf(w) || <span className="muted">아직 명제를 뽑지 않았습니다</span>}</p>
                  <p className="small muted">{w.n}번째 씨앗 · {shortTitle(s)} · 표제어 「{headwordOf(w) || '—'}」 · <Link href={readHref(w.n)}>글 보기</Link>{w.postId ? ' · 서가에 있음' : ''}</p>
                  {w.feedback?.line && <p className="small">선생님 — {w.feedback.line}</p>}
                </div>
              </li>); })}
          </ol>
        )}
      </section>
      <section className="box tint stack">
        <h3>내 글이 지나간 길</h3>
        {st.hq?.link ? (
          <><p>선생님이 검토를 마친 결과지가 열려 있습니다. 결과는 가설이고, 다음 글에서 바뀔 수 있습니다.</p>
            <p><a className="btn small" href={st.hq.link} target="_blank" rel="noreferrer">결과지 열기</a></p></>
        ) : (
          <p>지금까지 쓴 글은 {total.toLocaleString()}자입니다. 글이 {MIN_CHARS.toLocaleString()}자 넘게 모이면 선생님이 글이 지나간 길을 읽어 결과지를 보내 드립니다.</p>
        )}
      </section>
    </div>
  );
}
