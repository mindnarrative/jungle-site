import type { Metadata } from 'next';
import { requireViewer } from '@/lib/auth';
import { worksOf } from '@/lib/model';
import StudentRecord from '@/components/StudentRecord';
import { getAccount } from '@/lib/model';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '내 글이 지나간 길', robots: { index: false } };

export default async function PathPage() {
  const v = await requireViewer(['student']);
  const st = (await getAccount(v.id))!;
  return (
    <div className="read stack-lg">
      <div className="stack"><h1>{st.pen || st.name}의 글이 지나간 길</h1></div>
      <StudentRecord st={st} works={await worksOf(st.id)} readHref={(n) => `/write/${n}`} />
    </div>
  );
}
