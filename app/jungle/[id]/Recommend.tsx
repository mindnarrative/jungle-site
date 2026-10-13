'use client';

import { useEffect, useRef, useState } from 'react';

// 글의 끝(· · ·)이 화면에 들어오면 '끝까지 읽음'을 남기고, 그때부터 추천 단추가 열린다.
// 추천 수는 아이에게 보여 주지 않는다.
export default function Recommend({ id, canVote, initialRead, initialVoted, loggedIn }:
  { id: string; canVote: boolean; initialRead: boolean; initialVoted: boolean; loggedIn: boolean }) {
  const [read, setRead] = useState(initialRead);
  const [voted, setVoted] = useState(initialVoted);
  const [busy, setBusy] = useState(false);
  const sent = useRef(initialRead);

  useEffect(() => {
    if (!loggedIn || sent.current) return;
    const end = document.getElementById('end');
    if (!end) return;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting) && !sent.current) {
        sent.current = true;
        fetch(`/api/posts/${id}/read`, { method: 'POST' }).then((r) => r.ok && setRead(true));
      }
    }, { threshold: 1 });
    io.observe(end);
    return () => io.disconnect();
  }, [id, loggedIn]);

  async function toggle() {
    setBusy(true);
    const r = await fetch(`/api/posts/${id}/vote`, { method: 'POST' });
    if (r.ok) setVoted((await r.json()).voted);
    setBusy(false);
  }

  if (!loggedIn) return <div className="recommend"><p>이 글을 추천하려면 <a href="/login">로그인</a>해 주세요.</p></div>;
  if (!canVote) return <div className="recommend"><p className="muted">내가 쓴 글입니다. 다른 친구가 끝까지 읽고 추천하면 서가 위 칸으로 올라갑니다.</p></div>;
  return (
    <div className="recommend">
      {read ? (
        <>
          <p>{voted ? '이 글을 추천했습니다. 이 글이 조금 더 높은 칸으로 올라갑니다.' : '끝까지 읽었다면, 다른 친구에게도 읽히면 좋겠는 글을 추천해 주세요.'}</p>
          <button className={`btn ${voted ? 'ghost' : 'gold'}`} onClick={toggle} disabled={busy}>{voted ? '추천 거두기' : '이 글 추천하기'}</button>
        </>
      ) : (
        <p className="muted">글을 끝까지 읽으면 추천 단추가 열립니다.</p>
      )}
    </div>
  );
}
