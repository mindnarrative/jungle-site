import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentViewer, isStaff } from '@/lib/auth';
import { allPosts } from '@/lib/model';
import { SEED_COUNT, seed, seedFull, shortTitle } from '@/lib/seeds';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const s = seed(Number((await params).n));
  return { title: s ? shortTitle(s) : '씨앗' };
}

const ORD = ['', '첫', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한', '열두', '열세', '열네', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉', '스무', '스물한', '스물두', '스물세'];

export default async function SeedPage({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  const s = seed(n);
  if (!s) notFound();
  const v = await currentViewer();
  const member = !!v;
  const staff = isStaff(v);
  const t = staff ? seedFull(n)!.teacher : null;
  const count = (await allPosts()).filter((p) => p.n === n).length;

  return (
    <div className="stack-lg">
      <div className="seed-cover">
        <p className="no">{ORD[n]} 번째 씨앗</p>
        <h1>{s.title}</h1>
        <p className="era">{s.era} · 오늘의 사물 — {s.object}</p>
      </div>

      <div className="read stack-lg">
        <div className="box tint">
          <h3>이 씨앗에서 조심할 것</h3>
          <p>{s.caution}</p>
        </div>

        <section className="stack">
          <h2>이야기 씨앗</h2>
          <div className="story">
            {(member ? s.story : s.story.slice(0, 1)).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {!member && <p className="notice">이야기 씨앗의 나머지와 감각 상상, 쓰기 지면은 수업을 듣는 학생에게 열립니다. <Link href="/classes">수업 안내</Link></p>}
        </section>

        {member && (
          <section className="stack">
            <h2>감각 상상</h2>
            <p className="muted">몸으로 먼저 가 봅시다. 무슨 소리가 들리는지, 무슨 냄새가 나는지, 손에 무엇이 닿는지.</p>
            <ol className="prose">{s.sense.map((q, i) => <li key={i}>{q}</li>)}</ol>
          </section>
        )}

        <div className="row">
          {v?.role === 'student' && <Link className="btn" href={`/write/${n}`}>이 씨앗으로 쓰기</Link>}
          <Link className="btn ghost" href={`/jungle?seed=${n}`}>이 씨앗의 서가{count ? ` · ${count}편` : ''}</Link>
        </div>

        {t && (
          <section className="box warm stack">
            <h3>교사가 볼 것 (교사·본사에게만 보입니다)</h3>
            <p>{t.note}</p>
            <p className="small"><b>도식</b> — {t.diagram}</p>
            {Object.keys(t.setting).length > 0 && (
              <table className="t"><tbody>{Object.entries(t.setting).map(([k, val]) => <tr key={k}><th style={{ width: '24%' }}>{k}</th><td>{val || '아이가 고릅니다'}</td></tr>)}</tbody></table>
            )}
            {t.answers.length > 0 && (
              <details>
                <summary>정글 예시답안 {t.answers.length}토막 — 아이에게 미리 보여 주지 않습니다</summary>
                <div className="stack" style={{ marginTop: 10 }}>{t.answers.map((a, i) => <p key={i} className="serif">{a}</p>)}</div>
              </details>
            )}
            <p className="small">표제어 예시 — {s.headwordExamples.join(' · ')}</p>
          </section>
        )}

        <nav className="row" aria-label="다른 씨앗">
          {n > 1 && <Link className="btn ghost small" href={`/seeds/${n - 1}`}>← {n - 1}번째 씨앗</Link>}
          {n < SEED_COUNT && <Link className="btn ghost small" href={`/seeds/${n + 1}`}>{n + 1}번째 씨앗 →</Link>}
        </nav>
      </div>
    </div>
  );
}
