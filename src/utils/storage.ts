import type { GeneratedComponent } from '../types';

export const STORAGE_KEYS = {
  apiKey: 'rcg:apiKey',
  provider: 'rcg:provider',
  promptHistory: 'rcg:promptHistory',
  components: 'rcg:components',
} as const;

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 접근 불가(프라이빗 모드, 용량 초과 등)는 무시한다.
  }
}

export function reviveComponents(raw: unknown): GeneratedComponent[] {
  if (!Array.isArray(raw)) return [];

  return raw.reduce<GeneratedComponent[]>((acc, item) => {
    if (typeof item !== 'object' || item === null) return acc;

    const { id, prompt, code, createdAt } = item as Record<string, unknown>;
    const date = new Date(createdAt as string);
    if (Number.isNaN(date.getTime())) return acc;

    acc.push({ id: String(id), prompt: String(prompt), code: String(code), createdAt: date });
    return acc;
  }, []);
}
