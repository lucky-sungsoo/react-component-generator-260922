# server/AGENTS.md

## Module Context

Bun 단일 프로세스로 동작하는 API 프록시 서버(`server/index.ts:138`, 포트 3002). `/api/generate`(컴포넌트 생성)와 `/api/config`(env 키 존재 여부) 두 엔드포인트만 제공하며, 프론트엔드는 Vite 프록시(`/api` → `localhost:3002`, `vite.config.ts:8-13`)를 통해 접근한다.

## Tech Stack & Constraints

- `Bun.serve`만 사용한다. Express/Fastify 등 별도 웹 프레임워크를 추가하지 않는다 (`server/index.ts:138`, `package.json`에 웹 프레임워크 의존성 없음).
- 외부 API 호출은 `fetch`만 사용한다 (axios 등 HTTP 클라이언트 의존성 없음, `server/index.ts:69,101`).

## Implementation Patterns

- 부수효과 없는 로직(문자열 정규화, 폴백 전략 등)은 `generator.ts`/`fallback.ts`처럼 별도 파일로 분리하고, `index.ts`에서 import해서 쓴다.
- 새 AI 프로바이더를 추가할 때는 `callAnthropic`/`callGoogle`과 같은 `call<Provider>(prompt, apiKey)` 형태의 함수로 만들고, `ENV_KEYS`(`server/index.ts:59-62`)와 `resolveApiKey`(`server/index.ts:64-66`)에 등록한다.

## Testing Strategy

- 실행: `bun run test` (vitest, `vite.config.ts`의 `test.include`가 `server/**/*.test.ts`를 포함).
- 순수 함수만 테스트한다. `generator.test.ts`/`fallback.test.ts`가 각각 `stripCodeFences`/`ensureRenderCall`/`withModelFallback`을 입력-출력 단위로 검증하는 방식(에러 케이스 포함)을 그대로 따른다.

## Local Golden Rules

1. **테스트 경계**: `server/generator.ts:1-2` 주석대로 "부수효과(Bun.serve 등)가 없어 단위 테스트가 가능"한 함수만 이 디렉터리에서 테스트된다. `Bun.serve`의 `fetch` 핸들러(`server/index.ts:140-220`) 자체는 테스트가 없다 — 새 분기 로직을 추가할 때 핸들러에 직접 넣지 말고 테스트 가능한 순수 함수로 뽑아낸다.
2. **비대칭**: `callGoogle`은 `GOOGLE_MODELS` 배열을 순차 폴백하지만(`server/index.ts:5,134-136`) `callAnthropic`은 단일 모델(`server/index.ts:77`)이다. Anthropic 폴백이 필요해지면 새 메커니즘을 만들지 말고 `withModelFallback`(`server/fallback.ts:3-20`)을 재사용한다.
3. **보안 경계**: `resolveApiKey`(`server/index.ts:64-66`)는 클라이언트가 보낸 키를 서버 환경변수보다 우선한다. 이 키나 `resolvedKey`를 `console.log` 등으로 출력하거나 파일/DB에 저장하는 코드를 추가하지 않는다. `CORS_HEADERS`(`server/index.ts:51-55`)는 모든 오리진을 허용하므로, 인증이 필요한 새 엔드포인트를 추가할 때 이 헤더를 그대로 재사용하지 않는다.
