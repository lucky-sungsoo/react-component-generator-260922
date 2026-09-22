# AGENTS.md

## Operational Commands

- 패키지 매니저: `bun` 고정. npm/yarn/pnpm 사용 금지 (`bun.lock` 존재, README 실행법이 `bun install`/`bun run`).
- 개발 서버 + API 서버 동시 실행: `bun run dev`
- API 서버만 실행: `bun run server` (Bun 워치 모드, `server/index.ts`, 포트 3002)
- 빌드: `bun run build` (`tsc -b && vite build`)
- 테스트: `bun run test` (vitest run, 1회) / `bun run test:watch` (감시 모드)
- 린트: `bun run lint`

## Golden Rules

이 프로젝트에서만 유효한 규칙이다. 일반적인 베스트 프랙티스가 아니라 코드에서 확인한 근거를 기반으로 한다.

1. **Provider 비대칭 — 새 모델을 추가할 때 기존 패턴을 따를 것.**
   `callGoogle`은 `withModelFallback`으로 여러 모델(`GOOGLE_MODELS`)을 순차 시도하지만(`server/index.ts:5,134-136`), `callAnthropic`은 `claude-haiku-4-5-20251001` 단일 모델만 호출하고 폴백이 없다(`server/index.ts:68-96`). Anthropic에도 폴백을 추가한다면 `server/fallback.ts`의 `withModelFallback`을 재사용하고, 새로운 폴백 메커니즘을 만들지 않는다.

2. **테스트 경계 — 부수효과 없는 순수 함수만 유닛 테스트 대상이다.**
   `server/generator.ts` 상단 주석이 명시하듯 "부수효과(Bun.serve 등)가 없어 단위 테스트가 가능하다"(`server/generator.ts:1-2`). 그래서 `generator.ts`/`fallback.ts`는 각각 `.test.ts` 짝이 있지만, `Bun.serve`를 직접 호출하는 `server/index.ts`는 테스트가 없다. 서버에 새 로직을 추가할 때는 `index.ts`의 `fetch` 핸들러에 바로 넣지 말고, 순수 함수로 분리한 새 모듈로 만들어 테스트 가능하게 유지한다.

3. **하드 제약 — 생성된 컴포넌트 코드는 import/TypeScript 문법을 쓸 수 없다.**
   `SYSTEM_PROMPT`(`server/index.ts:7-49`)는 "Do NOT use import statements", "Do NOT use TypeScript syntax", "call render(<ComponentName />) at the end"을 명시한다. 이는 `LivePreview`가 `react-live`의 `LiveProvider`를 `noInline` 모드로 사용해 브라우저 전역 스코프에서 코드를 실행하기 때문이다(`src/components/LivePreview.tsx:14`). 이 프롬프트 규칙이나 실행 방식을 바꾸면 미리보기가 조용히 깨진다.

4. **이중 방어 — 모델이 프롬프트 지시를 어겨도 서버가 결과를 정규화한다.**
   `SYSTEM_PROMPT`는 "Respond with ONLY the code block — no explanations, no markdown fences"라고 지시하지만(`server/index.ts:16`), 서버는 별도로 `stripCodeFences`로 마크다운 펜스를 다시 제거하고(`server/generator.ts:5-10`) `ensureRenderCall`로 `render()` 호출 누락을 자동 보정한다(`server/generator.ts:16-24`). 모델 출력이 프롬프트를 항상 따른다고 가정하고 이 정규화 로직을 제거하지 않는다.

5. **보안 경계 — API 키는 로깅·영속화하지 않고 그대로 전달만 한다.**
   `resolveApiKey`는 클라이언트가 요청 본문으로 보낸 키를 서버 환경변수보다 우선 사용하며(`server/index.ts:64-66`), 이 키는 Anthropic/Google API로 그대로 전달될 뿐 저장되지 않는다. `CORS_HEADERS`는 `Access-Control-Allow-Origin: '*'`로 모든 오리진을 허용한다(`server/index.ts:51-55`). `apiKey`/`resolvedKey` 값을 로그로 출력하거나 파일·DB에 영속화하는 코드를 추가하지 않는다.

## Project Context

프롬프트를 입력하면 AI(Anthropic Claude 또는 Google Gemini)가 React 컴포넌트를 생성하고, `react-live`로 즉시 미리보기와 코드를 보여주는 도구다.

**Tech Stack**: React 19, TypeScript, Vite, Bun, react-live, Vitest, Testing Library, ESLint (typescript-eslint + react-hooks + react-refresh).

## Standards & References

- 코딩 컨벤션: `eslint.config.js` 참고 (`js.configs.recommended` + `tseslint.configs.recommended` + react-hooks/react-refresh 규칙).
- 설치·실행 방법, 기능 목록은 `README.md` 참고 — 이 문서에서 중복 서술하지 않는다.
- **Maintenance Policy**: 코드를 변경하면서 위 Golden Rules와 실제 동작이 어긋나는 것을 발견하면, 이 문서의 업데이트를 제안한다.

## Context Map

- **[Bun API 서버 작업](./server/AGENTS.md)** — `/api/generate`, `/api/config` 엔드포인트나 프로바이더 호출 로직 수정 시.
- **[React 프론트엔드 작업](./src/AGENTS.md)** — 컴포넌트, 훅, `react-live` 미리보기 관련 수정 시.
