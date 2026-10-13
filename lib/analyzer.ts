import 'server-only';

// 정글 성향분석기(본사 서버, jungle_hq)와 잇는 곳.
// 이 사이트는 분석기의 '가맹점' 하나로 들어간다. 규준·사전·프롬프트는 분석 서버에만 있고
// 이 사이트 코드에는 한 줄도 들어오지 않는다. 아이의 실명은 보내지 않고 가명과 학생 코드만 보낸다.
//   JUNGLE_HQ_URL  분석 서버 주소 (예: https://hq.example.kr)
//   JUNGLE_HQ_KEY  분석 서버가 발급한 가맹점 열쇠

export const MIN_CHARS = 3000; // 한 아이의 글이 3,000자를 넘어야 판독한다.

export const hqReady = () => Boolean(process.env.JUNGLE_HQ_URL && process.env.JUNGLE_HQ_KEY);
export const hqPublicLink = (path: string) => (process.env.JUNGLE_HQ_URL || '').replace(/\/$/, '') + path;

async function call(path: string, init?: RequestInit) {
  if (!hqReady()) throw new Error('분석 서버가 아직 연결되지 않았습니다.');
  const res = await fetch(hqPublicLink(path), {
    ...init,
    headers: { 'X-Franchise-Key': process.env.JUNGLE_HQ_KEY!, 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  });
  const type = res.headers.get('content-type') || '';
  const body = type.includes('json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(typeof body === 'object' && body && '오류' in body ? String((body as Record<string, unknown>)['오류']) : `분석 서버 응답 ${res.status}`);
  return body;
}

export type HqStudent = { code: string; pen: string; grade: string; text: string; seed: number | null; genre: string };

// 한 반(또는 한 학생)의 글을 묶음으로 보낸다. 돌아오는 것은 묶음 번호.
export async function submitBatch(className: string, teacher: string, list: HqStudent[]) {
  const body = {
    반: className, 교사: teacher,
    학생: list.map((s) => ({ 코드: s.code, 이름: s.pen, 학년: s.grade, 갈래: s.genre, 씨앗: s.seed, 파일명: `${s.code}.txt`, 글: s.text })),
  };
  const j = (await call('/api/v1/batches', { method: 'POST', body: JSON.stringify(body) })) as Record<string, unknown>;
  return String(j['묶음']);
}

export async function batchStatus(batch: string) {
  return (await call(`/api/v1/batches/${batch}`)) as { 상태: string; 진행: string };
}

// 교사용 지도 카드(HTML). 서버가 대신 받아 와서 교사에게만 보여 준다.
export async function teacherSheet(batch: string, code: string) {
  return String(await call(`/api/v1/batches/${batch}/sheet/${encodeURIComponent(code)}/교사용`));
}

export async function recommendation(batch: string, code: string) {
  return (await call(`/api/v1/batches/${batch}/rec/${encodeURIComponent(code)}`)) as Record<string, unknown>;
}

// 교사가 다음 씨앗과 한마디를 고르고 학생용 결과지를 연다. 돌아오는 것은 학생·보호자가 여는 링크.
export async function release(batch: string, code: string, seed: number | null, memo: string) {
  const j = (await call(`/api/v1/batches/${batch}/release/${encodeURIComponent(code)}`, { method: 'POST', body: JSON.stringify({ 씨앗: seed, 메모: memo }) })) as Record<string, unknown>;
  return j['링크'] ? hqPublicLink(String(j['링크'])) : null;
}
