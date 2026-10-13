'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Seed } from '@/lib/seeds';
import { PAGES } from '@/lib/site';

// 열한 지면. 순서와 문구는 「정글논글 1회차 교재(학생용)」과 『세계사 정글』 학생용 전권을 따랐다.
// 쓰는 대로 저장된다(1초 남짓 뒤). 아이의 문장은 어디에서도 고치지 않는다.

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Judge = { ok: boolean; note: string } | undefined;
type Props = {
  seed: Seed; asId: string | null; who: string; staff: boolean;
  initial: Any; carry: string; draftAt: string | null; mission1: Judge; mission2: Judge;
};

const PLACES = (s: Seed) => [s.plan.center, ...s.plan.rings, ...s.plan.left, ...s.plan.right];

export default function Workbook({ seed, asId, who, staff, initial, carry, draftAt: draft0, mission1: m10, mission2: m20 }: Props) {
  const [pages, setPages] = useState<Any>(initial || {});
  const [step, setStep] = useState(0);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [draftAt, setDraftAt] = useState(draft0);
  const [m1, setM1] = useState(m10);
  const [m2, setM2] = useState(m20);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(pages);
  const q = asId ? `?as=${encodeURIComponent(asId)}` : '';

  const save = useCallback(async () => {
    setState('saving');
    const r = await fetch(`/api/work/${seed.n}${q}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pages: latest.current }) });
    setState(r.ok ? 'saved' : 'error');
  }, [seed.n, q]);

  const set = (key: string, field: string, value: unknown) => {
    setPages((prev) => {
      const next = { ...prev, [key]: { ...(prev[key] || {}), [field]: value } };
      latest.current = next;
      return next;
    });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 1100);
  };
  const g = (key: string, field: string, d: any = '') => (pages[key]?.[field] ?? d); // eslint-disable-line @typescript-eslint/no-explicit-any
  const arr = (key: string, field: string, len: number) => { const a = [...(g(key, field, []) as unknown[])]; while (a.length < len) a.push(''); return a; };
  const setIn = (key: string, field: string, len: number, i: number, value: unknown) => { const a = arr(key, field, len); a[i] = value; set(key, field, a); };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const done = (k: string) => JSON.stringify(pages[k] || {}).replace(/[^가-힣a-zA-Z0-9]/g, '').length > 6;
  const go = async (i: number) => { if (timer.current) { clearTimeout(timer.current); await save(); } setStep(i); };

  async function submitDraft() {
    if (timer.current) { clearTimeout(timer.current); }
    await save();
    const r = await fetch(`/api/work/${seed.n}/draft${q}`, { method: 'POST' });
    if (r.ok) setDraftAt((await r.json()).draftAt);
    else alertBox((await r.json()).error);
  }
  const [notice, setNotice] = useState('');
  const alertBox = (m: string) => setNotice(m);

  async function judge(which: 'mission1' | 'mission2', ok: boolean) {
    const note = window.prompt(ok ? '통과 — 아이에게 남길 한마디(비워도 됩니다)' : '다시 할 이유를 한 줄로 적어 주세요', '') ?? null;
    if (note === null) return;
    const r = await fetch(`/api/teacher/judge${q}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ n: seed.n, which, ok, note }) });
    if (r.ok) (which === 'mission1' ? setM1 : setM2)({ ok, note });
  }

  const cur = PAGES[step];
  const ta = (k: string, f: string, rows = 3) => (
    <textarea rows={rows} value={g(k, f)} onChange={(e) => set(k, f, e.target.value)} />
  );

  const mission = (m: Judge, which: 'mission1' | 'mission2') => (
    <div className={`judge ${m ? (m.ok ? 'ok' : 'no') : 'wait'}`}>
      {m ? (m.ok ? <>선생님 확인 — 통과했습니다.{m.note && <> {m.note}</>}</> : <>선생님 확인 — 다시 해 봅시다. {m.note}</>) : '선생님이 아직 확인하지 않았습니다. 판정 기준은 하나입니다 — 갈등을 만들기에 적절한가. 글이 좋은지 나쁜지는 판정하지 않습니다.'}
      {staff && <div className="row" style={{ marginTop: 10 }}><button className="btn small" onClick={() => judge(which, true)}>통과</button><button className="btn small ghost" onClick={() => judge(which, false)}>다시 하기</button></div>}
    </div>
  );

  function body() {
    switch (cur.key) {
      case 'p1': return (<>
        {carry && <div className="box warm"><h3>지난 씨앗에서 가져온 나의 명제</h3><p className="serif">{carry}</p><p className="small muted">오늘의 장면에서도 이 말이 맞을지, 삼 주 동안 지켜봅시다.</p></div>}
        <div className="box tint"><h3>이 씨앗에서 조심할 것</h3><p>{seed.caution}</p></div>
        <p className="lead">그날 무슨 일이 있었는가 — 먼저 읽습니다. 외우지 않아도 됩니다. 마음에 걸리는 문장을 눈으로 따라가며 읽어 봅시다.</p>
        <div className="box story">{seed.story.map((p, i) => <p key={i}>{p}</p>)}</div>
        <p className="q">① 가장 마음에 걸린 문장 하나를 그대로 옮겨 적어 봅시다. 고치지 말고 그대로 옮깁니다.</p>{ta('p1', 'line', 2)}
        <p className="q">② 왜 하필 그 문장이었나요? 한 줄로 적어 봅시다.</p>{ta('p1', 'why', 2)}
      </>);
      case 'p2': return (<>
        <p className="lead">몸으로 먼저 가 봅시다. 머리로 생각하지 말고 몸으로 상상해 봅시다. 무슨 소리가 들리는지, 무슨 냄새가 나는지, 손에 무엇이 닿는지 적어도 좋습니다. 네 개를 다 채우지 않아도 됩니다.</p>
        {seed.sense.map((qq, i) => (<div key={i}><p className="q">{'①②③④'[i]} {qq}</p>
          <textarea rows={3} value={arr('p2', 'answers', 4)[i] as string} onChange={(e) => setIn('p2', 'answers', 4, i, e.target.value)} /></div>))}
        <p className="q">다음 장으로 가져갈 것 — 네 가지 중에서 가장 재미있었던 상상 하나를 고릅니다.</p>
        <div className="choices">{seed.senseLabels.map((l, i) => (
          <label key={i} className="choice"><input type="radio" name="p2pick" checked={g('p2', 'pick', null) === i} onChange={() => set('p2', 'pick', i)} /> {'①②③④'[i]} {l}</label>))}</div>
        <p className="q">고른 상상을 한 줄로 옮겨 적어 봅시다. 이 한 줄이 다음 장에서 만들 장면의 씨앗이 됩니다.</p>{ta('p2', 'pickLine', 2)}
      </>);
      case 'p3': return (<>
        <p className="lead">한 문장으로 붙잡기 — 오늘의 사물은 {seed.object}입니다.</p>
        <p>{seed.headwordGuide}</p>
        <p className="frame">예를 들면 — {seed.headwordExamples.join(' · ')}</p>
        <p className="q">① 세 개를 만들어 봅시다. 좋은 것 하나를 만들려고 하면 아무것도 못 만듭니다.</p>
        {['첫째', '둘째', '셋째'].map((l, i) => (<div key={i}><label className="f">{l}</label>
          <input type="text" value={arr('p3', 'heads', 3)[i] as string} onChange={(e) => setIn('p3', 'heads', 3, i, e.target.value)} /></div>))}
        <p className="q">② 세 개 중 하나를 고르고, 왜 그렇게 지었는지 적어 봅시다.</p>
        <div className="choices">{arr('p3', 'heads', 3).map((h, i) => (
          <label key={i} className="choice"><input type="radio" name="p3pick" checked={g('p3', 'pick', null) === i} onChange={() => set('p3', 'pick', i)} /> {(h as string) || `${['첫째', '둘째', '셋째'][i]} 문장`}</label>))}</div>
        {ta('p3', 'why', 2)}
        <div className="box warm"><p>이 한 문장은 삼 주 뒤 열 번째 지면에서 다시 나옵니다. 그때 오늘 만든 이 문장과, 삼 주를 다 겪고 나서 만든 문장을 나란히 놓고 견주게 됩니다.</p></div>
      </>);
      case 'p4': return (<>
        <p className="lead">먼저 세 개를 만들고, 그다음에 하나를 고릅니다. 엉성해도 좋으니 세 개를 만들어 봅시다.</p>
        {g('p2', 'pickLine') && <p className="frame">앞 장에서 가져온 것 ▸ {g('p2', 'pickLine')}</p>}
        <div className="cands">{[0, 1, 2].map((i) => { const c = (arr('p4', 'cands', 3)[i] || {}) as Any; const upd = (f: string, val: string) => setIn('p4', 'cands', 3, i, { ...c, [f]: val });
          return (<div key={i} className={`cand ${g('p4', 'pick', null) === i ? 'on' : ''}`}>
            <label className="choice" style={{ border: 0, padding: 0, background: 'none' }}><input type="radio" name="p4pick" checked={g('p4', 'pick', null) === i} onChange={() => set('p4', 'pick', i)} /> <b>후보 {i + 1}</b></label>
            <label className="f">공간</label><input type="text" value={c.space || ''} onChange={(e) => upd('space', e.target.value)} />
            <label className="f">주동 인물</label><input type="text" value={c.hero || ''} onChange={(e) => upd('hero', e.target.value)} />
            <label className="f">반동 인물</label><input type="text" value={c.rival || ''} onChange={(e) => upd('rival', e.target.value)} />
          </div>); })}</div>
        <div className="box tint" style={{ marginTop: 16 }}><h3>고른 후보에 대해 스스로 물어봅시다</h3>
          <p>이 공간에서 두 사람이 실제로 마주칠 수 있나요? 두 사람은 서로 다른 것을 원하고 있나요? 반동 인물에게도 그렇게 할 만한 이유가 있나요?</p>
          <p className="small muted" style={{ marginTop: 8 }}>공간이 정해질 때에는 그 공간이 정해질 만한 이유가 있어야 합니다. 인물이 공간을 옮길 때에도 옮길 만한 이유가 있어야 합니다.</p></div>
        <p className="q">미션 1 — 갈등을 만들 수 있는 자리가 섰는가</p>
        {mission(m1, 'mission1')}
      </>);
      case 'p5': { const c = (arr('p4', 'cands', 3)[g('p4', 'pick', 0)] || {}) as Any; return (<>
        <p className="lead">다섯 칸으로 뼈대를 잡습니다. 여기서는 짧게, 한 칸에 한두 문장이면 충분합니다. 길게 쓰는 것은 다음 장에서 합니다.</p>
        {(c.space || c.hero) && <p className="frame">미션 1을 통과한 장면 ▸ 공간 {c.space || '—'} · 주동 인물 {c.hero || '—'} · 반동 인물 {c.rival || '—'}</p>}
        <div className="five">{[['발단', '이야기의 시작'], ['전개', '갈등의 시작'], ['위기', '갈등의 고조'], ['절정', '갈등의 최고조'], ['결말', '갈등의 해소']].map(([a, b], i) => (
          <div className="c" key={a}><b>{a}<small>{b}</small></b><textarea rows={2} value={arr('p5', 'cells', 5)[i] as string} onChange={(e) => setIn('p5', 'cells', 5, i, e.target.value)} /></div>))}</div>
        <p className="q">미션 2 — 발단에서 시작한 갈등이 결말까지 이어졌는가</p>
        <div className="checks">{['다섯 칸이 모두 찼다', '발단에서 생긴 갈등과 결말에서 풀리는 갈등이 같은 것이다', '갈등이 하나로 모여 있다'].map((t, i) => (
          <label key={i}><input type="checkbox" checked={!!arr('p5', 'checks', 3)[i]} onChange={(e) => setIn('p5', 'checks', 3, i, e.target.checked)} /> {t}</label>))}</div>
        {mission(m2, 'mission2')}
      </>); }
      case 'p6': { const text = g('p6', 'text') as string; const len = text.replace(/\s/g, '').length; return (<>
        <h3 className="serif" style={{ fontSize: 24 }}>{seed.jungleTitle}</h3>
        <p className="lead">앞 장의 다섯 칸을 펼칩니다. 새로 쓰는 것이 아니라 늘리는 것입니다. 한 칸에 두 문장이었다면 여기서는 대여섯 문장이 됩니다. 설명하지 말고 보여 주세요.</p>
        <p className="frame">예시 · 도입 부분만 — {seed.jungleExample}</p>
        <div className="box warm small">감정은 표현하는 것이 아니라 담는 것입니다. 슬펐다, 무서웠다, 기뻤다고 쓰는 대신 몸과 사물과 소리로 써 봅시다. 이 규칙은 정글에서만 겁니다.</div>
        {arr('p5', 'cells', 5).some((x) => x) && <details style={{ margin: '12px 0' }}><summary>내 다섯 칸 보기</summary><ol className="prose small">{arr('p5', 'cells', 5).map((x, i) => <li key={i}>{x as string}</li>)}</ol></details>}
        <textarea className="big" value={text} onChange={(e) => set('p6', 'text', e.target.value)} placeholder="여기에 정글을 씁니다." />
        <p className="small muted">{len.toLocaleString()}자 · 한 편에 천 자에서 천오백 자 남짓이면 충분합니다. 쓰는 도중에는 고치지 않습니다.</p>
        <p className="q">쓰면서 스스로 확인해 봅시다</p>
        <div className="checks">{['설명하지 않고 보여 주었다. 그림을 그리듯이 썼다', '큰 공간에서 작은 공간으로 좁혀 들어갔다', '사물 하나에 마음을 실었다', '나쁜 쪽 인물에게도 이유가 있다', '갈등이 하나로 모여 있다'].map((t, i) => (
          <label key={i}><input type="checkbox" checked={!!arr('p6', 'checks', 5)[i]} onChange={(e) => setIn('p6', 'checks', 5, i, e.target.checked)} /> {t}</label>))}</div>
        <p className="small muted">다섯 개가 다 되지 않아도 괜찮습니다. 잘 쓰는 것보다 끝까지 쓰는 것이 먼저입니다.</p>
        <div className="box tint" style={{ marginTop: 16 }}>
          {draftAt ? <p>초고를 냈습니다. 이제 같은 씨앗을 쓴 친구들의 글이 <a href={`/jungle?seed=${seed.n}`}>서가</a>에서 열립니다.</p> : (<>
            <p>끝까지 썼다면 초고를 냅니다. 초고를 내면 같은 씨앗을 쓴 친구들의 글이 서가에서 열립니다. 낸 뒤에도 고칠 수 있습니다.</p>
            <button className="btn" style={{ marginTop: 10 }} onClick={submitDraft} disabled={len < 200}>정글 초고 내기</button>
            {len < 200 && <p className="small muted" style={{ marginTop: 6 }}>이백 자를 넘게 쓰면 낼 수 있습니다.</p>}
          </>)}
        </div>
      </>); }
      case 'p7': { const peers = arr('p7', 'peers', 1) as Any[]; return (<>
        <p className="lead">쓴 글을 소리 내어 읽고, 친구의 글을 듣습니다. 여기서 생긴 감정이 다음 장 논글의 주제가 됩니다.</p>
        <div className="box tint"><h3>세 가지 규칙</h3><p>하나 · 고치지 않습니다. “이렇게 하면 더 좋겠다”는 말은 하지 않습니다.<br />둘 · 해석하지 않습니다. “너는 이래서 이렇게 썼구나”는 말은 하지 않습니다.<br />셋 · 감정을 말합니다. “나는 이 대목에서 이런 마음이 들었어”라고만 말합니다.</p></div>
        <p className="q">친구의 글을 듣고</p>
        {peers.map((pp, i) => { const p = (pp || {}) as Any; const upd = (f: string, val: string) => setIn('p7', 'peers', peers.length, i, { ...p, [f]: val });
          return (<div key={i} className="card" style={{ marginBottom: 10 }}><div className="form-row">
            <div><label className="f">친구 이름</label><input type="text" value={p.name || ''} onChange={(e) => upd('name', e.target.value)} /></div>
            <div><label className="f">가장 오래 남은 장면</label><input type="text" value={p.scene || ''} onChange={(e) => upd('scene', e.target.value)} /></div>
            <div><label className="f">내가 받은 감정</label><input type="text" value={p.feel || ''} onChange={(e) => upd('feel', e.target.value)} /></div>
            <div><label className="f">묻고 싶은 것</label><input type="text" value={p.ask || ''} onChange={(e) => upd('ask', e.target.value)} /></div>
          </div></div>); })}
        <button className="btn small ghost" onClick={() => set('p7', 'peers', [...peers, {}])}>친구 한 명 더</button>
        <p className="small muted" style={{ marginTop: 8 }}>묻고 싶은 것이 있으면 적습니다. 답은 받지 않습니다. 답하지 않은 질문이 내 안에 남아 삼 주차 논글의 씨가 됩니다.</p>
        <p className="q">내 글을 읽어 주고 나서 — 친구들이 나에게 말해 준 것을 적어 봅시다.</p>{ta('p7', 'heard')}
        <p className="q">다음 장으로 가져갈 것 ▸ 오늘 내 안에 남은 감정을 한 마디로 적고, 그 감정이 무엇 때문에 생겼는지 한 줄 덧붙여 봅시다.</p>
        <input type="text" value={g('p7', 'feeling')} onChange={(e) => set('p7', 'feeling', e.target.value)} placeholder="한 마디" />
        <div style={{ marginTop: 8 }}>{ta('p7', 'why', 2)}</div>
      </>); }
      case 'p8': { const people = arr('p8', 'people', 3) as Any[]; return (<>
        <p className="lead">지금까지는 한 사람의 눈으로 보았습니다. 이제 하늘에서 그 자리를 내려다봅니다. 내 글에 나온 사람을 평면도 위의 자리에 놓아 봅시다. ‘나’는 반드시 놓습니다.</p>
        <Plan seed={seed} people={people} />
        <div className="people">
          {people.map((pp, i) => { const p = (pp || {}) as Any; const upd = (f: string, val: string) => setIn('p8', 'people', people.length, i, { ...p, [f]: val });
            return (<div className="r" key={i}>
              <input type="text" placeholder={i === 0 ? '나' : '사람 이름'} value={p.name || ''} onChange={(e) => upd('name', e.target.value)} />
              <select value={p.place || ''} onChange={(e) => upd('place', e.target.value)}><option value="">자리 고르기</option>{PLACES(seed).map((pl) => <option key={pl}>{pl}</option>)}</select>
              <span />
            </div>); })}
          <button className="btn small ghost" onClick={() => set('p8', 'people', [...people, {}])}>사람 한 명 더</button>
        </div>
        <p className="small muted">동그라미 셋은 가운데 자리에서의 거리입니다. 가까울수록 얼굴이 보이고, 멀수록 소리만 들립니다.</p>
        {['① 나와 가장 가까이 있던 사람은 누구입니까', '② 나와 가장 멀리 있던 사람은 누구입니까', '③ 내 글에 나오지 않았지만 그 자리에 있었을 사람은 누구입니까', '④ 내 자리에서는 보이지 않았던 것은 무엇입니까'].map((t, i) => (
          <div key={i}><p className="q">{t}</p><input type="text" value={arr('p8', 'qs', 4)[i] as string} onChange={(e) => setIn('p8', 'qs', 4, i, e.target.value)} /></div>))}
        <p className="q">내 글에 나온 사물을 모두 적어 봅시다.</p>{ta('p8', 'objects', 2)}
        <p className="q">이 중에서 가장 중요한 사물 하나를 적어 봅시다.</p><input type="text" value={g('p8', 'keyObject')} onChange={(e) => set('p8', 'keyObject', e.target.value)} />
      </>); }
      case 'p9': { const frames = ['세계사에는 (　)라는 사건이 있다. 사람들은 흔히 (　)라고 생각한다. 그렇지만 (　). 그것을 알아보고자 한다.', '보통 사람들은 (　)라고 말한다. 그 이유는 첫째 (　), 둘째 (　)이다.', '그렇지만 나의 생각은 다르다. 그 이유는 첫째 (　), 둘째 (　)이다.', '지금까지 (　)에 대해 알아보았다. (　). 현대 사회에서도 이와 비슷한 일이 (　).'];
        return (<>
        <p className="lead">이번에는 장면 밖으로 나와 따집니다. 여기서는 자기 생각을 곧장 말해도 됩니다.</p>
        {g('p7', 'feeling') && <p className="frame">앞 장에서 가져온 것 ▸ 합평에서 내 안에 남은 감정 — {g('p7', 'feeling')}</p>}
        <p className="q">그 감정과 가장 가까운 쟁점 하나를 골라 봅시다.</p>
        <div className="choices">{seed.issues.map((is, i) => (<label key={i} className="choice"><input type="radio" name="p9issue" checked={g('p9', 'issue', null) === i} onChange={() => set('p9', 'issue', i)} /> {is}</label>))}</div>
        <p className="q">개요 잡기</p>
        {['서론 · 소개 문장 → 가교 문장 → 본론으로 들어가는 문장', '본론 1 · 일반적인 관점에서 본 사실', '본론 2 · 내 주장의 근거', '결론 · 주장의 요약 → 오늘 우리에게는 어떤가'].map((t, i) => (
          <div key={i}><label className="f">{t}</label><p className="frame">{frames[i]}</p><textarea rows={3} value={arr('p9', 'outline', 4)[i] as string} onChange={(e) => setIn('p9', 'outline', 4, i, e.target.value)} /></div>))}
        <p className="small muted">문장 시작 틀을 쓰는 것을 부끄러워하지 않아도 됩니다. 이 네 개의 틀은 목발이 아니라 논증의 최소 문법입니다. 본론 1부터 먼저 써도 좋습니다.</p>
        <p className="q">위의 개요를 이어 붙여 한 편으로 씁니다. 다 쓰고 나서 내 근거 두 개가 어디 있는지 확인해 봅시다.</p>
        <textarea className="big" value={g('p9', 'body')} onChange={(e) => set('p9', 'body', e.target.value)} placeholder="여기에 논글을 씁니다." />
        <p className="small muted">{(g('p9', 'body') as string).replace(/\s/g, '').length.toLocaleString()}자</p>
      </>); }
      case 'p10': return (<>
        <p className="lead">명제는 줄거리를 요약한 제목이 아닙니다. 삼 주 동안 겪은 감각과 감정과 이해를 하나로 눌러 담은 한 문장입니다. 형용사는 걷어내고 명사와 동사만 남깁니다.</p>
        <p className="q">첫째 — 내 정글에서 마음에 드는 문장 세 개를 그대로 옮겨 적어 봅시다.</p>
        {[0, 1, 2].map((i) => <input key={i} type="text" style={{ marginBottom: 8 }} value={arr('p10', 'lines', 3)[i] as string} onChange={(e) => setIn('p10', 'lines', 3, i, e.target.value)} />)}
        <p className="q">둘째 — 옮겨 적은 문장에서 형용사를 지워 봅시다.</p>
        <p className="small muted">아름다운, 슬픈, 무서운, 좋은, 나쁜, 커다란 같은 말입니다. 매우, 정말, 너무 같은 말도 지웁니다. 지우고 나서도 뜻이 남는다면 그 문장은 단단한 문장입니다.</p>
        {ta('p10', 'stripped', 3)}
        <p className="q">셋째 — 남은 명사와 동사로 한 문장을 만들어 봅시다. 짧을수록 단단합니다.</p>
        {seed.propositionExamples.length > 0 && <p className="frame">{seed.propositionExamples.map((x) => `“${x}”`).join('  ')}</p>}
        <input type="text" value={g('p10', 'prop')} onChange={(e) => set('p10', 'prop', e.target.value)} />
        <p className="q">넷째 — 논글에서 세운 내 주장도 한 문장으로 적어 봅시다.</p>
        <input type="text" value={g('p10', 'claim')} onChange={(e) => set('p10', 'claim', e.target.value)} />
        <p className="q">다섯째 — 두 문장을 견주어 봅시다.</p>
        {['① 두 문장은 같은 말입니까, 다른 말입니까', '② 다르다면, 어느 쪽이 나에게 더 가깝습니까', '③ 왜 그렇게 생각합니까'].map((t, i) => (
          <div key={i}><label className="f">{t}</label><input type="text" value={arr('p10', 'cmp', 3)[i] as string} onChange={(e) => setIn('p10', 'cmp', 3, i, e.target.value)} /></div>))}
        <p className="small muted" style={{ marginTop: 8 }}>두 문장이 서로 어긋나도 괜찮습니다. 그 어긋남이 이 삼 주에서 여러분에게 일어난 일입니다. “모르겠다”도 훌륭한 답입니다.</p>
        {arr('p3', 'heads', 3).some((x) => x) && <div className="box warm" style={{ marginTop: 14 }}><h3>삼 주 전에 만든 표제어</h3><p className="serif">{String(arr('p3', 'heads', 3)[g('p3', 'pick', 0)] || arr('p3', 'heads', 3).find((x) => x) || '')}</p></div>}
      </>);
      case 'p11': return (<>
        <p className="lead">내가 뽑은 명제가 정말 단단한 문장이라면, 그 자리 말고 다른 자리에서도 그 일이 벌어져야 합니다. 아직 서 보지 않은 자리를 하나 골라 봅시다.</p>
        {g('p10', 'prop') && <p className="frame">내가 뽑은 명제 ▸ {g('p10', 'prop')}</p>}
        <div className="choices">{seed.seats.map((st, i) => (<label key={i} className="choice"><input type="radio" name="p11seat" checked={g('p11', 'seat', null) === i} onChange={() => set('p11', 'seat', i)} /> <span><b>{st.seat}</b> — {st.who}</span></label>))}</div>
        <p className="q">그 자리에서 같은 명제가 벌어지는 장면을 써 봅시다. 다섯에서 여덟 문장.</p>
        <textarea rows={9} value={g('p11', 'scene')} onChange={(e) => set('p11', 'scene', e.target.value)} />
        <p className="small muted">첫 장면을 그대로 옮겨 적지 않습니다. 그 자리에서는 무엇이 안 보이는지를 먼저 생각해 봅시다. 명제가 그 자리에서 안 맞으면 명제를 고쳐도 됩니다. 고치는 것이 이 단계에서 가장 큰 소득입니다.</p>
        <p className="q">무엇이 남았는가</p>
        <div className="checks">{['같은 명제가 두 자리에서 서로 다른 모양이 되었다', '두 번째 자리의 사람에게도 그럴 만한 이유가 있었다', `이 명제는 ${seed.title.split('—')[0].trim()} 말고 다른 데에서도 쓸 수 있을 것 같다`].map((t, i) => (
          <label key={i}><input type="checkbox" checked={!!arr('p11', 'checks', 3)[i]} onChange={(e) => setIn('p11', 'checks', 3, i, e.target.checked)} /> {t}</label>))}</div>
        <div className="box warm" style={{ marginTop: 16 }}>
          <h3>다음 씨앗으로 가져갈 나의 명제</h3>
          <input type="text" value={g('p11', 'carry')} onChange={(e) => set('p11', 'carry', e.target.value)} placeholder={g('p10', 'prop') || ''} />
          <p className="small" style={{ marginTop: 8 }}>다음 씨앗을 시작할 때 이 문장을 다시 꺼냅니다. 한 학기가 끝나면 쓴 글과 함께 명제들이 남고, 그 명제들이 여러분이 만든 책의 목차가 됩니다.</p>
        </div>
      </>);
    }
    return null;
  }

  let lastWeek = '';
  return (
    <div className="wb">
      <nav className="wb-nav" aria-label="열한 지면">
        {PAGES.map((p, i) => {
          const wk = p.week !== lastWeek ? p.week : ''; lastWeek = p.week;
          return (<div key={p.key} style={{ display: 'contents' }}>
            {wk && <p className="week">{wk}</p>}
            <button onClick={() => go(i)} aria-current={i === step ? 'step' : undefined}><span className="n">{p.no}</span><span className={done(p.key) ? 'done' : ''}>{p.name}</span></button>
          </div>);
        })}
      </nav>
      <section>
        <p className="small muted">{asId ? `${who}의 글을 선생님이 대신 넣고 있습니다 · ` : ''}{cur.week}</p>
        <div className="step-h"><span className="no">{cur.no}</span><h2>{cur.name}</h2></div>
        <p className="saving" aria-live="polite">{state === 'saving' ? '저장하는 중…' : state === 'saved' ? '저장했습니다' : state === 'error' ? '저장하지 못했습니다. 인터넷 연결을 확인해 주세요.' : ''}</p>
        {notice && <p className="notice" role="alert">{notice}</p>}
        <div className="stack">{body()}</div>
        <div className="wb-foot">
          <button className="btn ghost" disabled={step === 0} onClick={() => go(step - 1)}>← 앞 지면</button>
          {step < PAGES.length - 1 ? <button className="btn" onClick={() => go(step + 1)}>다음 지면 →</button> : <a className="btn" href="/path">내 글이 지나간 길 보기</a>}
        </div>
      </section>
    </div>
  );
}

// 위에서 내려다보기의 평면도. 씨앗마다 가운데 자리, 거리를 나타내는 세 동그라미, 양옆의 자리 이름이 다르다.
function Plan({ seed, people }: { seed: Seed; people: Any[] }) {
  const at = (place: string) => people.filter((p) => p?.place === place && p?.name).map((p) => p.name).join(', ');
  const ringsY = [128, 192, 258];
  return (
    <div className="plan">
      <svg viewBox="0 0 660 300" role="img" aria-label={`평면도: 가운데 ${seed.plan.center}`}>
        {[90, 150, 215].map((r) => <circle key={r} cx="330" cy="70" r={r} fill="none" stroke="var(--line)" />)}
        <rect x="235" y="18" width="190" height="34" rx="4" fill="var(--leaf-soft)" stroke="var(--gold)" />
        <text x="330" y="40" fontSize="12.5" fill="var(--ink)" textAnchor="middle">{seed.plan.center}</text>
        {at(seed.plan.center) && <text x="330" y="70" fontSize="13" fill="var(--gold)" textAnchor="middle" fontWeight="700">{at(seed.plan.center)}</text>}
        {seed.plan.rings.map((r, i) => <g key={r}><text x="330" y={ringsY[i]} fontSize="11.5" fill="var(--muted)" textAnchor="middle">{r}</text>
          {at(r) && <text x="330" y={ringsY[i] + 16} fontSize="13" fill="var(--gold)" textAnchor="middle" fontWeight="700">{at(r)}</text>}</g>)}
        {seed.plan.left.map((l, i) => <g key={l}><text x="16" y={60 + i * 70} fontSize="11.5" fill="var(--leaf)">{l}</text>
          {at(l) && <text x="16" y={76 + i * 70} fontSize="13" fill="var(--gold)" fontWeight="700">{at(l)}</text>}</g>)}
        {seed.plan.right.map((l, i) => <g key={l}><text x="644" y={60 + i * 70} fontSize="11.5" fill="var(--leaf)" textAnchor="end">{l}</text>
          {at(l) && <text x="644" y={76 + i * 70} fontSize="13" fill="var(--gold)" textAnchor="end" fontWeight="700">{at(l)}</text>}</g>)}
      </svg>
    </div>
  );
}
