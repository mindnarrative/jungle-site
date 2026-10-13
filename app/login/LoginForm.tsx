'use client';

import { useActionState } from 'react';
import { login } from './actions';

export default function LoginForm() {
  const [err, act, pending] = useActionState(login, null);
  return (
    <form action={act} className="card stack" style={{ maxWidth: 440 }}>
      <div>
        <label className="f" htmlFor="id">아이디</label>
        <input id="id" name="id" type="text" autoComplete="username" autoCapitalize="none" required />
      </div>
      <div>
        <label className="f" htmlFor="pw">비밀번호</label>
        <input id="pw" name="pw" type="password" autoComplete="current-password" required />
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn" disabled={pending}>{pending ? '들어가는 중' : '들어가기'}</button>
    </form>
  );
}
