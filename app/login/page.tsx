import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: '로그인' };

export default function Login() {
  return (
    <div className="read stack-lg">
      <div className="stack">
        <h1>로그인</h1>
        <p className="lead">이야기 정글의 계정은 선생님이 만들어 드립니다. 학생 계정은 보호자의 동의를 받은 뒤에 열리고, 보호자 계정으로는 자녀의 글과 결과지를 볼 수 있습니다.</p>
      </div>
      <LoginForm />
      <p className="small muted">아이디나 비밀번호를 잊었다면 담당 선생님께 말씀해 주세요. 수업을 듣고 싶다면 <a href="/classes">수업 안내</a>를 봐 주세요.</p>
    </div>
  );
}
