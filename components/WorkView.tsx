import type { Work } from '@/lib/model';
import { headwordOf, jungleText, nongeulText, propositionOf } from '@/lib/model';

// 보호자와 문고집이 쓰는 읽기 전용 보기. 아이의 문장은 그대로 둔다.
export default function WorkView({ w }: { w: Work }) {
  const p11 = (w.pages.p11 || {}) as Record<string, string>;
  return (
    <div>
      <h2 className="serif">{headwordOf(w) || '제목 없는 정글'}</h2>
      <p className="writing-h">정글 · 장면 안에서</p>
      <div className="writing">{jungleText(w) || '아직 쓰지 않았습니다.'}</div>
      {nongeulText(w) && <><p className="writing-h">논글 · 장면 밖에서</p><div className="writing">{nongeulText(w)}</div></>}
      {p11.scene && <><p className="writing-h">같은 명제, 다른 자리</p><div className="writing">{p11.scene}</div></>}
      {propositionOf(w) && <p className="prop">{propositionOf(w)}</p>}
    </div>
  );
}
