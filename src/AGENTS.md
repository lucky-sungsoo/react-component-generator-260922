# src/AGENTS.md

## Module Context

Vite + React 19 SPA. `App.tsx`가 전역 상태(프로바이더, API 키)를 들고 `useComponentGenerator` 훅으로 `/api/generate`를 호출하며, 결과를 `ComponentCard`가 `LivePreview`(미리보기)와 `CodeView`(코드)로 렌더링한다.

## Tech Stack & Constraints

- 동적 미리보기는 `react-live`의 `LiveProvider`/`LivePreview`를 `noInline` 모드로 사용한다(`src/components/LivePreview.tsx:1,14`). 서버가 돌려주는 `code` 문자열을 그대로 넘기며, 이 문자열은 `render(<Component />)` 호출로 끝나야 렌더링된다.
- 상태관리 라이브러리 없음 — 컴포넌트 로컬 state와 커스텀 훅(`useComponentGenerator`)만 사용한다(`src/hooks/useComponentGenerator.ts`).

## Implementation Patterns

- AI가 생성한 컴포넌트(`GeneratedComponent.code`, `src/types/index.ts:3-8`)는 앱 자신의 스타일 시스템(`App.css`/`index.css`)과 분리되어 있다 — 생성된 코드는 인라인 스타일만 쓰도록 서버 프롬프트가 강제한다. 앱 자체 컴포넌트에 인라인 스타일을 강제할 필요는 없다.
- API 호출은 `fetch` + `/api/...` 상대 경로로 직접 호출한다(`src/hooks/useComponentGenerator.ts:23`, `src/App.tsx:25`). Vite 프록시가 `/api`를 백엔드로 넘긴다.
- `localStorage` 영속화는 `src/utils/storage.ts`의 `loadFromStorage`/`saveToStorage`(JSON 직렬화, 손상된 값은 fallback으로 무시)와 `STORAGE_KEYS`를 통해서만 한다. `GeneratedComponent[]`처럼 `Date` 필드가 있는 값은 저장 전후로 `reviveComponents`를 거쳐야 `createdAt`이 다시 `Date` 인스턴스가 된다(`ComponentCard.tsx:18`의 `toLocaleTimeString` 호출이 이를 전제한다).

## Testing Strategy

- 실행: `bun run test` (vitest + jsdom + Testing Library, `vite.config.ts`의 `test.setupFiles: src/test/setup.ts`).
- `render`/`screen`/`userEvent`로 사용자 상호작용을 검증한다 (`src/components/PromptInput.test.tsx` 참고).

## Local Golden Rules

1. **테스트 경계**: 조건부 로직(입력값에 따른 버튼 활성/비활성, 제출 검증)이 있는 `PromptInput.tsx`만 테스트가 있다(`src/components/PromptInput.test.tsx`). 상태를 그대로 보여주기만 하는 `ComponentCard.tsx`, `LivePreview.tsx`, `CodeView.tsx`는 테스트가 없다. 컴포넌트에 새로운 검증·조건부 로직을 추가하면 `PromptInput.test.tsx`와 같은 패턴으로 테스트를 추가한다.
2. **보안 경계**: `LivePreview`(`src/components/LivePreview.tsx:14`)는 서버가 반환한 `code`를 `react-live`로 직접 실행한다. 이 값에 추가로 `eval`/`new Function`을 씌우거나, 서버 응답이 아닌 다른 출처의 문자열(예: 사용자 입력 프롬프트 자체)을 `code`로 넘기지 않는다. `apiKey`가 `localStorage`(`src/App.tsx:15,35`, 키 `STORAGE_KEYS.apiKey`)에 평문으로 저장되므로, `LivePreview`가 실행하는 코드와 같은 origin/전역 스코프에서 이 값을 읽을 수 있다는 점을 고려한다 — API 키를 필요로 하지 않는 곳에 노출시키거나, 생성된 컴포넌트 코드에 `localStorage` 접근 권한을 추가로 부여하지 않는다.
