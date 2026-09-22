import { describe, it, expect } from 'vitest';
import { loadFromStorage, saveToStorage, reviveComponents } from './storage';
import type { GeneratedComponent } from '../types';

describe('loadFromStorage', () => {
  it('키가 없으면 fallback을 반환한다', () => {
    expect(loadFromStorage('missing-key', 'fallback')).toBe('fallback');
  });

  it('저장된 값이 있으면 파싱해서 반환한다', () => {
    localStorage.setItem('my-key', JSON.stringify({ a: 1 }));
    expect(loadFromStorage('my-key', {})).toEqual({ a: 1 });
  });

  it('저장된 값이 손상된 JSON이면 fallback을 반환한다', () => {
    localStorage.setItem('broken-key', '{not-json');
    expect(loadFromStorage('broken-key', 'fallback')).toBe('fallback');
  });
});

describe('saveToStorage', () => {
  it('값을 JSON으로 직렬화해 저장하고 loadFromStorage로 다시 읽을 수 있다', () => {
    saveToStorage('my-key', { a: 1, b: [1, 2, 3] });
    expect(loadFromStorage('my-key', null)).toEqual({ a: 1, b: [1, 2, 3] });
  });
});

describe('reviveComponents', () => {
  it('배열이 아니면 빈 배열을 반환한다', () => {
    expect(reviveComponents(null)).toEqual([]);
    expect(reviveComponents(undefined)).toEqual([]);
    expect(reviveComponents('not-an-array')).toEqual([]);
  });

  it('직렬화된 컴포넌트 목록을 createdAt이 Date 객체인 상태로 복원한다', () => {
    const raw = [
      { id: '1', prompt: '버튼', code: 'const A=()=>null;', createdAt: '2026-01-01T00:00:00.000Z' },
    ];

    const result = reviveComponents(raw);

    expect(result).toHaveLength(1);
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect((result[0] as GeneratedComponent).id).toBe('1');
  });

  it('createdAt이 유효하지 않은 항목은 걸러낸다', () => {
    const raw = [{ id: '1', prompt: 'x', code: 'y', createdAt: 'not-a-date' }];
    expect(reviveComponents(raw)).toEqual([]);
  });
});
