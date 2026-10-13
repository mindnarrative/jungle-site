import type { Metadata } from 'next';
import Link from 'next/link';
import { requireViewer } from '@/lib/auth';
import { classesOf } from '@/lib/model';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '교사실', robots: { index: false } };

export default async function TeacherHome() {
  const v = await requireViewer(['teacher', 'admin']);
  const classes = await classesOf(v.id);
  return (
    <div className="stack-lg">
      <div className="stack read">
        <h1>교사실</h1>
        <p className="lead">선생님은 아이의 글을 읽어 주십시오. 미션을 판정하고, 첨삭 기록을 남기고, 서가에 올릴 글을 고르고, 결과지를 검토해 아이에게 엽니다.</p>
      </div>
      {classes.length === 0 ? <div className="empty">맡은 반이 아직 없습니다. 반은 본사가 만들어 드립니다.</div> : (
        <div className="seed-grid">
          {classes.map((k) => (
            <Link key={k.id} href={`/teacher/class/${k.id}`} className="seed-card">
              <span className="no">학생 {k.studentIds.length}명</span>
              <p className="t">{k.name}</p>
            </Link>
          ))}
        </div>
      )}
      <div className="box tint">
        <h3>바꾸지 말아야 할 세 가지</h3>
        <p>장면을 대신 만들어 주지 않습니다. 무엇을 써도 훌륭하다고 말하지 않습니다. 합평 시간을 줄이지 않습니다. 그리고 아이의 글은 아이의 표제어적 마음이 담긴 글이므로 소중하고 보드랍게 다룹니다.</p>
      </div>
    </div>
  );
}
