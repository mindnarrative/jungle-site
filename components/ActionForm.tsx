'use client';

import { useActionState } from 'react';

type Result = { ok?: string; error?: string } | null;

// 서버 작업(server action)을 부르는 양식. 결과 문장을 양식 아래에 보여 준다.
export default function ActionForm({ action, children, submit, className, ghost }:
  { action: (s: Result, f: FormData) => Promise<Result>; children: React.ReactNode; submit: string; className?: string; ghost?: boolean }) {
  const [res, act, pending] = useActionState(action, null);
  return (
    <form action={act} className={className}>
      {children}
      <div className="row" style={{ marginTop: 12 }}>
        <button className={`btn small ${ghost ? 'ghost' : ''}`} disabled={pending}>{pending ? '처리하는 중' : submit}</button>
        {res?.ok && <span className="small" role="status">{res.ok}</span>}
        {res?.error && <span className="err" role="alert">{res.error}</span>}
      </div>
    </form>
  );
}
