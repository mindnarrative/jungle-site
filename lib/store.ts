import 'server-only';
import { Redis } from '@upstash/redis';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// 계정·반·글·추천을 저장하는 곳. 심리서사분석 사이트와 같은 방식이다.
// Vercel 에서는 Upstash Redis(Vercel Storage 탭에서 연결)를 쓰고,
// 내 컴퓨터에서 시험할 때는 .data/store.json 파일을 쓴다.

export type Store = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
  lpush(key: string, value: string): Promise<void>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
};

function redisStore(): Store | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const r = new Redis({ url, token });
  return {
    get: async <T,>(k: string) => (await r.get<T>(k)) ?? null,
    set: async (k, v) => { await r.set(k, v); },
    del: async (k) => { await r.del(k); },
    lpush: async (k, v) => { await r.lpush(k, v); },
    lrange: async (k, a, b) => (await r.lrange<string>(k, a, b)) ?? [],
  };
}

function fileStore(): Store {
  const dir = path.join(process.cwd(), '.data');
  const file = path.join(dir, 'store.json');
  const load = (): Record<string, unknown> => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return {}; } };
  const save = (d: Record<string, unknown>) => { mkdirSync(dir, { recursive: true }); writeFileSync(file, JSON.stringify(d, null, 1)); };
  return {
    get: async <T,>(k: string) => (load()[k] as T) ?? null,
    set: async (k, v) => { const d = load(); d[k] = v; save(d); },
    del: async (k) => { const d = load(); delete d[k]; save(d); },
    lpush: async (k, v) => { const d = load(); d[k] = [v, ...((d[k] as string[]) || [])]; save(d); },
    lrange: async (k, a, b) => ((load()[k] as string[]) || []).slice(a, b === -1 ? undefined : b + 1),
  };
}

export function store(): Store {
  const r = redisStore();
  if (r) return r;
  if (process.env.VERCEL) throw new Error('STORE_MISSING');
  return fileStore();
}
