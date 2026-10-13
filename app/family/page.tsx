import type { Metadata } from 'next';
import Link from 'next/link';
import { childrenOf } from '@/lib/access';
import { requireViewer } from '@/lib/auth';
import { worksOf } from '@/lib/model';
import StudentRecord from '@/components/StudentRecord';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '우리 아이', robots: { index: false } };

export default async function Family() {
  const v = await requireViewer(['parent']);
  const kids = await childrenOf(v);
  return (
    <div className="read stack-lg">
      <div className="stack">
        <h1>우리 아이의 글</h1>
        <p className="lead">아이가 씨앗마다 쓴 정글과 논글, 그리고 씨앗을 돌 때마다 남긴 명제를 볼 수 있습니다. 점수나 등수는 없습니다. 아이가 어떤 문장을 썼는지를 보아 주십시오.</p>
      </div>
      {kids.map((k) => (
        <section key={k.id} className="card stack-lg">
          <h2>{k.pen} <span className="muted" style={{ fontSize: '.65em' }}>({k.name})</span></h2>
          <ChildRecord id={k.id} />
          {k.classId && <p><Link href={`/book/${k.classId}`}>반 문고집 보기</Link></p>}
        </section>
      ))}
      <p className="small muted">서가에 오른 아이의 글을 내리고 싶으시면 담당 선생님께 말씀해 주십시오. 바로 내려 드립니다.</p>
    </div>
  );
}

async function ChildRecord({ id }: { id: string }) {
  const { getAccount } = await import('@/lib/model');
  const st = (await getAccount(id))!;
  return <StudentRecord st={st} works={await worksOf(id)} readHref={(n) => `/family/work/${id}/${n}`} />;
}
