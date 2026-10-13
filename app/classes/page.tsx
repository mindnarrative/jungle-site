import type { Metadata } from 'next';
import Link from 'next/link';
import { seed, shortTitle } from '@/lib/seeds';
import { SITE, WINTER } from '@/lib/site';

export const metadata: Metadata = { title: '수업 안내' };

export default function Classes() {
  return (
    <div className="read stack-lg">
      <div className="stack">
        <h1>수업 안내</h1>
        <p className="lead">정글 수업은 원주 기업도시의 마음숲에서 열립니다. 한 반은 네 명입니다. 선생님이 아이 한 명 한 명의 글을 읽고 그 아이가 지금 어디에 서 있는지를 말해 줄 수 있는 크기입니다.</p>
      </div>

      <section className="card stack">
        <p className="pill gold" style={{ width: 'fit-content' }}>모집 중</p>
        <h2>{WINTER.name}</h2>
        <table className="t"><tbody>
          <tr><th style={{ width: '24%' }}>기간</th><td>{WINTER.dates}</td></tr>
          <tr><th>수업</th><td>{WINTER.rhythm}</td></tr>
          <tr><th>대상</th><td>{WINTER.who}</td></tr>
          <tr><th>씨앗</th><td>{WINTER.seeds.map((n) => `${n}. ${shortTitle(seed(n)!)}`).join(' · ')}</td></tr>
          <tr><th>남는 것</th><td>아이마다 정글 두 편과 논글 두 편 · {WINTER.closing}</td></tr>
          <tr><th>수강료</th><td>{WINTER.fee}</td></tr>
        </tbody></table>
        <p className="small muted">{WINTER.deadline}</p>
        <div className="row"><Link className="btn" href="/contact?kind=겨울특강">상담 신청</Link><Link className="btn ghost" href="/seeds/14">프랑스 대혁명 씨앗 미리 보기</Link></div>
      </section>

      <section className="stack">
        <h2>정규반</h2>
        <p>겨울특강을 마친 아이들은 3월 정규반으로 이어집니다. 한 학기에 예닐곱 씨앗을 돌고, 두 학기면 스물세 씨앗을 한 바퀴 돕니다. 학기말에는 아이 이름이 붙은 문고집 한 권이 남습니다. 요일과 시간, 수강료는 상담에서 안내해 드립니다.</p>
      </section>

      <section className="stack">
        <h2>보호자께 미리 드리는 말씀</h2>
        <ol>
          <li>정글은 입시를 목표로 설계하지 않았고, 그렇게 광고하지도 않습니다.</li>
          <li>아이의 문장은 고치지 않습니다. 선생님은 아이가 스스로 끊긴 선을 잇고 틀린 선을 다시 긋도록 돕습니다.</li>
          <li>상담에서는 축의 이름이나 점수 대신 아이가 쓴 문장 두 개로 변화를 보여 드립니다. “4월에는 ‘무서웠다’라고 썼는데 6월에는 ‘문고리를 두 번 잡았다 놓았다’로 썼습니다.”</li>
          <li>아이의 글이 서가에 오르려면 보호자의 서면 동의가 있어야 하고, 서가에는 가명만 나갑니다. <Link href="/privacy">아이의 글과 개인정보</Link></li>
        </ol>
      </section>

      <section className="box tint stack">
        <h3>학원과 기관에서 정글을 쓰고 싶다면</h3>
        <p>정글의 교재와 쓰기 화면, 선생님의 첨삭 기록, 본사의 판독은 다른 학원과 도서관·학교에서도 함께 쓸 수 있도록 만들고 있습니다. 강사 양성과 도입 조건은 문의해 주시면 안내해 드립니다.</p>
        <p><Link href="/contact?kind=학원·기관 도입">도입 문의</Link> · 전화 {SITE.phone}</p>
      </section>
    </div>
  );
}
