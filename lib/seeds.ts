import 'server-only';
import raw from '@/data/seeds.json';

// 『세계사 정글』 서양사편 v3의 스물세 씨앗.
// data/seeds.json 은 scripts/build-seeds.py 가 학생용 전권과 씨앗데이터_v3.json 에서 만든다.
// teacher 칸(교사가 볼 것, 예시답안)은 서버 안에서만 쓰고 학생 화면으로 내려보내지 않는다.

export type Plan = { center: string; rings: string[]; left: string[]; right: string[] };
export type Seat = { seat: string; who: string };
export type TeacherNote = { note: string; diagram: string; setting: Record<string, string>; answers: string[] };
export type SeedFull = {
  n: number; title: string; era: string; object: string; caution: string; story: string[];
  sense: string[]; senseLabels: string[]; headwordGuide: string; headwordExamples: string[];
  jungleTitle: string; jungleExample: string; plan: Plan; issues: string[];
  propositionExamples: string[]; seats: Seat[]; topic: string; teacher: TeacherNote;
};
export type Seed = Omit<SeedFull, 'teacher'>;

const all = raw as SeedFull[];

export const SEED_COUNT = all.length;
export const seedFull = (n: number) => all.find((s) => s.n === n) ?? null;

export function seed(n: number): Seed | null {
  const s = seedFull(n);
  if (!s) return null;
  const { teacher: _t, ...pub } = s;
  return pub;
}

export const seeds = (): Seed[] => all.map(({ teacher: _t, ...pub }) => pub);

// 제목의 앞부분(— 앞)만 짧게 쓸 때.
export const shortTitle = (s: { title: string }) => s.title.split('—')[0].trim();

// 『세계사 정글』 서양사편 v3 차례의 일곱 부(이름은 교재 원문 그대로).
export const PARTS: { name: string; from: number; to: number }[] = [
  { name: '제1부 · 문명이 시작되다', from: 1, to: 3 },
  { name: '제2부 · 그리스와 로마', from: 4, to: 9 },
  { name: '제3부 · 중세와 그 너머', from: 10, to: 12 },
  { name: '제4부 · 시민이 주인이 되다', from: 13, to: 16 },
  { name: '제5부 · 제국의 시대', from: 17, to: 18 },
  { name: '제6부 · 두 번의 세계대전', from: 19, to: 20 },
  { name: '제7부 · 우리가 사는 세계', from: 21, to: 23 },
];
