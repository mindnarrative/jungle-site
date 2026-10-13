import 'server-only';
import { getPicks, getPost, getVotes, heightOf, isNew, type Post } from '@/lib/model';

// 서가에 꽂힌 순서. 아이에게는 숫자가 아니라 칸의 높이로만 보인다.
//   새로 들어온 글: 서가에 오른 지 일주일이 안 된 글. 추천이 없어도 한 번은 읽히게 따로 둔다.
//   윗칸: 추천의 무게가 있는 글 가운데 위쪽 삼분의 일.
//   가운데 칸: 추천의 무게가 있는 나머지 글.
//   아랫칸: 아직 추천이 없거나 추천이 오래되어 무게가 거의 남지 않은 글.
export type Shelved = Post & { height: number; votes: number };
export type Shelves = { fresh: Shelved[]; top: Shelved[]; middle: Shelved[]; low: Shelved[] };

export async function weigh(posts: Post[]): Promise<Shelved[]> {
  const at = Date.now();
  return Promise.all(posts.map(async (p) => { const v = await getVotes(p.id); return { ...p, height: heightOf(v, at), votes: Object.keys(v).length }; }));
}

export async function arrange(posts: Post[]): Promise<Shelves> {
  const list = (await weigh(posts)).sort((a, b) => b.height - a.height || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const fresh = list.filter((p) => isNew(p)).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const rest = list.filter((p) => !isNew(p));
  const weighted = rest.filter((p) => p.height >= 0.25);
  const cut = Math.max(1, Math.ceil(weighted.length / 3));
  return { fresh, top: weighted.slice(0, cut), middle: weighted.slice(cut), low: rest.filter((p) => p.height < 0.25) };
}

// 이번 주에 가장 많이 읽힌 정글: 최근 이레 동안 받은 추천이 가장 많은 글.
export async function weekTop(posts: Post[]) {
  const at = Date.now();
  let best: { p: Post; n: number } | null = null;
  for (const p of posts) {
    const v = await getVotes(p.id);
    const n = Object.values(v).filter((t) => at - Date.parse(t) < 7 * 864e5).length;
    if (n > 0 && (!best || n > best.n)) best = { p, n };
  }
  return best?.p ?? null;
}

export const thisMonth = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 7); // 한국 시간 기준 '2026-10'

export async function monthPicks(month = thisMonth()) {
  const picks = (await getPicks()).filter((x) => x.month === month);
  return (await Promise.all(picks.map((x) => getPost(x.postId)))).filter((p) => p && !p.hidden) as Post[];
}
