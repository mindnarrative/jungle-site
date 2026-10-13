import type { Metadata } from 'next';
import ActionForm from '@/components/ActionForm';
import { SITE } from '@/lib/site';
import { sendInquiry } from './actions';

export const metadata: Metadata = { title: '상담·도입 문의' };
const KINDS = ['겨울특강', '정규반', '학원·기관 도입', '그 밖의 문의'];

export default async function Contact({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const kind = (await searchParams).kind;
  return (
    <div className="read stack-lg">
      <div className="stack">
        <h1>상담·도입 문의</h1>
        <p className="lead">남겨 주신 연락처로 연락드립니다. 전화({SITE.phone})나 메일({SITE.email})로 바로 물어보셔도 됩니다.</p>
      </div>
      <ActionForm action={sendInquiry} submit="보내기" className="card">
        <div className="form-row">
          <div><label className="f">이름</label><input type="text" name="name" required /></div>
          <div><label className="f">연락처(전화 또는 메일)</label><input type="text" name="contact" required /></div>
          <div><label className="f">문의 종류</label><select name="kind" defaultValue={KINDS.includes(kind || '') ? kind : KINDS[0]}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></div>
        </div>
        <label className="f">하실 말씀 (아이의 학년, 원하시는 요일 등)</label>
        <textarea name="body" rows={5} />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: -9999 }} aria-hidden="true" />
        <p className="small muted">보내 주신 이름과 연락처는 상담 연락에만 쓰고, 상담이 끝나면 지웁니다.</p>
      </ActionForm>
    </div>
  );
}
