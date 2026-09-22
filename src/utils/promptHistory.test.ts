import { describe, it, expect } from 'vitest';
import { addToHistory } from './promptHistory';

describe('addToHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addToHistory(['b', 'a'], 'c')).toEqual(['c', 'b', 'a']);
  });

  it('이미 있던 프롬프트는 중복 없이 맨 앞으로 옮긴다', () => {
    expect(addToHistory(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
  });

  it('앞뒤 공백은 제거하고 저장한다', () => {
    expect(addToHistory([], '  버튼  ')).toEqual(['버튼']);
  });

  it('빈 문자열은 추가하지 않는다', () => {
    expect(addToHistory(['a'], '   ')).toEqual(['a']);
  });

  it('maxLength를 초과하면 오래된 항목부터 잘라낸다', () => {
    expect(addToHistory(['a', 'b'], 'c', 2)).toEqual(['c', 'a']);
  });
});
