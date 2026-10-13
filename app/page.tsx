import Link from 'next/link';
import { currentViewer, isStaff } from '@/lib/auth';
import { allPosts } from '@/lib/model';
import { arrange, monthPicks, weekTop } from '@/lib/shelf';
import { seed, seeds, shortTitle } from '@/lib/seeds';
import { WINTER } from '@/lib/site';
import Shelf from '@/components/Shelf';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const v = await currentViewer();
  const posts = await allPosts();
  const feature = (await weekTop(posts)) || (await monthPicks())[0] || null;
  const fs = feature ? seed(feature.n) : null;
  const shelves = await arrange(posts);
  const preview = { ...shelves, top: shelves.top.slice(0, 4), fresh: shelves.fresh.slice(0, 4), middle: [], low: [] };

  return (
    <div className="stack-lg">
      <section className="hero">
        <div className="stack">
          <h1>아이는 같은 사건을 두 번 씁니다</h1>
          <p>한 번은 안에서, 한 번은 밖에서. 정글은 역사의 한 장면 속으로 들어가 한 사람의 눈으로 하루를 살아 보는 짧은 소설이고, 논글은 같은 장면에서 다시 걸어 나와 그때 그 자리에서 무슨 일이 벌어진 것인가에 대한 자기 생각을 세우는 글입니다.</p>
          <p>그리고 이곳은 그렇게 쓴 아이의 글이 다른 아이에게 읽히는 서가입니다.</p>
          <div className="row" style={{ marginTop: 8 }}>
            <Link className="btn" href="/jungle">서가 둘러보기</Link>
            <Link className="btn ghost" href="/classes">수업 안내</Link>
          </div>
        </div>
        <div className="hero-pick">
          {feature && fs ? (<>
            <p className="kind">이번 주의 정글 · {feature.n}. {shortTitle(fs)}</p>
            <p className="head">{feature.headword || '제목 없는 정글'}</p>
            <p className="ex">{feature.jungle}</p>
            <p style={{ marginTop: 12 }}><Link href={`/jungle/${feature.id}`}>{feature.pen}의 글 끝까지 읽기</Link></p>
          </>) : (<>
            <p className="kind">첫 서가</p>
            <p className="head">이 서가의 첫 책은 겨울특강의 아이들이 씁니다</p>
            <p className="ex">{WINTER.dates}, 미국 독립혁명과 프랑스 대혁명 두 씨앗. 아이마다 정글 두 편과 논글 두 편이 남고, 반마다 문고집 한 권이 엮입니다.</p>
          </>)}
        </div>
      </section>

      {(preview.top.length > 0 || preview.fresh.length > 0) && (
        <section>
          <div className="section-h"><h2>이야기 정글</h2><Link href="/jungle">서가 전체 보기</Link></div>
          <Shelf shelves={preview} staff={isStaff(v)} />
        </section>
      )}

      <section className="grid2">
        <div className="stack">
          <h2>씨앗 하나, 삼 주</h2>
          <p className="lead">정글의 단위는 글 한 편이 아니라 씨앗 하나입니다. 한 씨앗에서 정글 한 편과 논글 한 편과 명제 하나가 나옵니다.</p>
          <ol className="path-list">
            <li><span className="no">1주</span><div><b>감각</b><p className="muted">이야기 씨앗을 읽고, 몸으로 그 시대에 가 보고, 오늘의 사물로 한 문장(표제어)을 만듭니다.</p></div></li>
            <li><span className="no">2주</span><div><b>감정</b><p className="muted">장면 후보 셋 가운데 하나를 골라 다섯 칸으로 세우고, 한 사람이 되어 정글을 씁니다. 그리고 친구들과 합평을 합니다.</p></div></li>
            <li><span className="no">3주</span><div><b>이해 · 관념 · 인식</b><p className="muted">위에서 그 자리를 내려다보고, 장면 밖으로 나와 논글을 쓰고, 명제 하나를 뽑아 다른 자리에서 다시 써 봅니다.</p></div></li>
          </ol>
          <p className="small muted">마지막에 뽑은 명제는 다음 씨앗의 첫 칸으로 들어갑니다. 한 학기가 끝나면 그 명제들이 아이가 만든 책의 목차가 됩니다.</p>
        </div>
        <div className="stack">
          <h2>씨앗 스물셋</h2>
          <p className="lead">구석기에서 데탕트까지. 모두 서로 다른 선택을 한 두 사람이 각자의 자리에서 옳았던 순간입니다.</p>
          <div className="stack" style={{ gap: 8 }}>
            {seeds().slice(0, 6).map((s) => <Link key={s.n} href={`/seeds/${s.n}`} className="seed-card" style={{ padding: '12px 16px' }}><span className="no">{s.n} · {s.object}</span> <span className="serif">{shortTitle(s)}</span></Link>)}
            <Link href="/seeds">스물세 씨앗 모두 보기</Link>
          </div>
        </div>
      </section>

      <section className="box tint stack">
        <h2>인공지능은 아이의 문장을 대신 쓰지 않습니다</h2>
        <p>인공지능이 논리적인 글을 대신 써 주는 시대에 남는 것은 아이 자신이 겪은 것에서 출발한 글입니다. 그래서 이야기 정글에서 인공지능은 질문만 하는 쓰기 동반자, 분석과 첨삭의 초안, 교사의 기록을 돕는 데까지만 들어옵니다. 문장 대필, 주장 채점, 무조건적인 칭찬, 교사의 검토 없는 결과지 발송은 하지 않습니다.</p>
        <p><Link href="/about">정글이 무엇을 하는 교육인지 더 읽기</Link></p>
      </section>
    </div>
  );
}
