import { describe, it, expect } from 'vitest';
import { MAX_PROMPT_LENGTH, validatePromptLength } from './validatePrompt';

describe('validatePromptLength', () => {
  it('500자 이하 프롬프트는 유효하다 (null 반환)', () => {
    const prompt = 'a'.repeat(500);
    expect(validatePromptLength(prompt)).toBeNull();
  });

  it('501자 이상이면 에러 메시지를 반환한다', () => {
    const prompt = 'a'.repeat(501);
    expect(validatePromptLength(prompt)).toBe(
      `프롬프트는 ${MAX_PROMPT_LENGTH}자를 초과할 수 없습니다. (현재 501자)`
    );
  });

  it('빈 문자열은 유효하다', () => {
    expect(validatePromptLength('')).toBeNull();
  });
});
