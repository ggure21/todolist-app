# TodoListApp 프로젝트 구조 설계 원칙

- 버전: 1.1.0
- 작성일: 2026-05-13
- 참조 문서:
  - [도메인 정의서 v1.0.0](./1-domain-definition.md)
  - [PRD v1.1.0](./2-prd.md)
  - [사용자 시나리오 v1.0.0](./3-user-scenario.md)

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.1.0 | 2026-05-13 | Architect | 백엔드 언어 변경: TypeScript → JavaScript (CommonJS). 백엔드 파일 컨벤션, 코드 예시, 디렉토리 구조 업데이트 |
| 1.0.0 | 2026-05-13 | Architect | 최초 작성 |

---

## 목차

1. [최상위 공통 원칙](#1-최상위-공통-원칙)
2. [의존성 / 레이어 원칙](#2-의존성--레이어-원칙)
3. [코드 / 네이밍 원칙](#3-코드--네이밍-원칙)
4. [테스트 / 품질 원칙](#4-테스트--품질-원칙)
5. [설정 / 보안 / 운영 원칙](#5-설정--보안--운영-원칙)
6. [프론트엔드 디렉토리 구조](#6-프론트엔드-디렉토리-구조)
7. [백엔드 디렉토리 구조](#7-백엔드-디렉토리-구조)

---

## 1. 최상위 공통 원칙

### 1.1 모든 스택에 적용되는 아키텍처 원칙

#### 관심사 분리 (Separation of Concerns)

UI 렌더링, 비즈니스 로직, 데이터 접근, 인프라 설정은 각각 독립된 레이어 또는 모듈로 분리한다.

> **근거**: 요구사항 변경(예: 2차 OAuth 소셜 로그인 추가, 카테고리 수정/삭제 기능 확장)이 특정 레이어에만 영향을 미치도록 격리함으로써 변경 비용을 최소화한다.

#### 단일 책임 원칙 (Single Responsibility Principle)

하나의 파일/모듈/함수는 하나의 명확한 책임만 가진다. 예를 들어, 할일 API 라우트 핸들러는 요청 파싱과 응답 직렬화만 담당하고, 비즈니스 규칙 검증은 서비스 계층에서 수행한다.

> **근거**: BR-T-03(소유권 검증), BR-T-04/05(완료 처리 시 `completed_at` 자동 기록/초기화) 같은 비즈니스 규칙이 여러 레이어에 분산되면 규칙 누락 및 중복 적용 위험이 생긴다.

#### 명시적 의존성 (Explicit Dependencies)

모든 의존성은 함수 인자 또는 모듈 import를 통해 명시적으로 주입한다. 전역 상태를 통한 암묵적 의존은 최소화한다.

> **근거**: 테스트 작성 시 모킹이 용이해지고, 코드 추적이 쉬워진다.

#### 조기 반환 (Early Return)

유효성 검사 실패, 권한 거부 등 실패 조건은 함수의 앞부분에서 먼저 처리하고 반환한다. 중첩된 if 구조를 피한다.

---

### 1.2 도메인 중심 설계 원칙

도메인 정의서(1-domain-definition.md)에 정의된 엔티티와 비즈니스 규칙을 코드 구조에 직접 반영한다.

#### 핵심 도메인 엔티티 반영

도메인 정의서의 세 핵심 엔티티(`User`, `Todo`, `Category`)는 프론트엔드 타입 정의, 백엔드 서비스/레포지토리 파일명, DB 테이블명에 일관되게 사용한다.

| 도메인 엔티티 | 백엔드 파일 접두어 | 프론트엔드 타입 |
|---------------|-------------------|----------------|
| User | `user.` | `User`, `UserProfile` |
| Todo | `todo.` | `Todo`, `CreateTodoRequest` |
| Category | `category.` | `Category`, `CreateCategoryRequest` |

#### 비즈니스 규칙의 서비스 계층 집중

도메인 정의서에 명시된 비즈니스 규칙(BR)은 반드시 서비스 계층(Service Layer)에서 검증한다. 컨트롤러나 레포지토리에 비즈니스 규칙 로직을 작성하지 않는다.

| 비즈니스 규칙 | 구현 위치 |
|---------------|-----------|
| BR-U-01: 이메일 중복 불가 | `UserService` |
| BR-T-03: 할일 소유권 검증 | `TodoService` |
| BR-T-04/05: 완료 처리 시 `completed_at` 관리 | `TodoService` |
| BR-C-01: 기본 카테고리 수정/삭제 불가 | `CategoryService` |
| BR-C-03: 할일이 존재하는 카테고리 삭제 불가 | `CategoryService` |
| BR-C-04: 동일 사용자 내 카테고리 이름 중복 불가 | `CategoryService` |

#### 값 객체(Value Object) 처리 원칙

도메인 정의서의 값 객체(`DueDate`, `CompletionStatus`, `Credentials`)는 별도 타입 또는 유틸리티 함수로 표현한다. 특히 `DueDate`의 기간 초과 여부(`is_overdue`) 파생 계산 로직은 공통 유틸리티로 분리하여 프론트엔드/백엔드 양쪽에서 동일한 기준을 사용한다.

---

## 2. 의존성 / 레이어 원칙

### 2.1 레이어 정의 및 의존 방향 (단방향 원칙)

의존 방향은 반드시 아래 방향으로만 흐른다. 하위 레이어가 상위 레이어를 참조하는 역방향 의존은 절대 금지한다.

```
[프론트엔드]                    [백엔드]

Pages / Views                  Routes (Express Router)
     ↓                               ↓
Features / Components          Controllers
     ↓                               ↓
Hooks (TanStack Query)         Services (비즈니스 로직)
     ↓                               ↓
API Client (fetch/axios)       Repositories (DB 접근)
     ↓                               ↓
(HTTP)  ──────────────────→   PostgreSQL (pg 라이브러리)
```

> **근거**: PRD 4.3에서 2차 OAuth 확장을 명시하고 있으므로, 인증 로직이 레이어를 넘나들지 않아야 확장 시 영향 범위를 최소화할 수 있다.

### 2.2 레이어 간 데이터 전달 방식

각 레이어 경계에서는 전용 객체(DTO/Request/Response)를 사용하여 데이터를 전달한다. 레이어 내부의 구현 세부사항을 외부로 노출하지 않는다.

#### 백엔드 데이터 흐름

| 방향 | 객체 유형 | 예시 |
|------|-----------|------|
| 클라이언트 → 컨트롤러 | Request Body / Query Params | `{ title, category_id, due_date }` |
| 컨트롤러 → 서비스 | Service Input DTO (plain object) | `CreateTodoDto` |
| 서비스 → 레포지토리 | Repository Input (plain object) | `InsertTodoParams` |
| 레포지토리 → 서비스 | DB Row / Entity | `TodoRow` |
| 서비스 → 컨트롤러 | Service Output (plain object) | `TodoDto` |
| 컨트롤러 → 클라이언트 | Response JSON | `{ id, title, is_completed, ... }` |

#### 프론트엔드 데이터 흐름

| 방향 | 객체 유형 | 예시 |
|------|-----------|------|
| UI 입력 → Hook | Form State / Mutation Input | `CreateTodoInput` |
| API 응답 → Hook | Response Type | `Todo`, `Category` |
| Hook → 컴포넌트 | Typed Data | `Todo[]` |
| Zustand Store | UI 상태 | `FilterState`, `AuthState` |

> **규칙**: DB의 `snake_case` 컬럼명은 API 응답에도 동일하게 유지한다. 프론트엔드에서 `camelCase`로 변환이 필요한 경우 API 클라이언트 계층에서 일괄 변환한다.

### 2.3 외부 의존성 격리 원칙

외부 라이브러리나 인프라에 대한 의존은 단일 어댑터/유틸리티 모듈로 캡슐화한다.

| 외부 의존 | 격리 방법 |
|-----------|-----------|
| pg (PostgreSQL) | `src/db/pool.ts` 에서 Connection Pool만 생성·export |
| JWT (jsonwebtoken) | `src/utils/jwt.ts` 에서 sign/verify 함수만 export |
| bcrypt | `src/utils/password.ts` 에서 hash/compare 함수만 export |
| fetch (브라우저) | `src/api/client.ts` 에서 baseURL·헤더 설정 캡슐화 |

> **근거**: PRD 4.3에서 인증 전략 패턴 분리를 명시하고 있으므로, JWT 관련 코드가 여러 파일에 산재하면 OAuth 2.0 추가 시 수정 범위가 커진다.

---

## 3. 코드 / 네이밍 원칙

### 3.1 파일명 컨벤션

#### 프론트엔드 (React + TypeScript)

| 파일 유형 | 컨벤션 | 예시 |
|-----------|--------|------|
| React 컴포넌트 | PascalCase + `.tsx` | `TodoCard.tsx`, `FilterBar.tsx` |
| Custom Hook | camelCase, `use` 접두어 + `.ts` | `useTodos.ts`, `useAuth.ts` |
| Zustand Store | camelCase, `Store` 접미어 + `.ts` | `authStore.ts`, `filterStore.ts` |
| TanStack Query | camelCase, `queries` 또는 `mutations` + `.ts` | `todoQueries.ts`, `todoMutations.ts` |
| 타입 정의 | camelCase + `.types.ts` | `todo.types.ts`, `auth.types.ts` |
| 유틸리티 함수 | camelCase + `.utils.ts` | `date.utils.ts` |
| 상수 | camelCase + `.constants.ts` | `queryKeys.constants.ts` |
| 페이지 컴포넌트 | PascalCase + `Page.tsx` | `TodoListPage.tsx`, `LoginPage.tsx` |

#### 백엔드 (Node.js + Express + JavaScript)

| 파일 유형 | 컨벤션 | 예시 |
|-----------|--------|------|
| 라우터 | camelCase + `.js` | `todo.routes.js`, `auth.routes.js` |
| 컨트롤러 | camelCase + `.js` | `todo.controller.js` |
| 서비스 | camelCase + `.js` | `todo.service.js` |
| 레포지토리 | camelCase + `.js` | `todo.repository.js` |
| 미들웨어 | camelCase + `.js` | `auth.middleware.js`, `error.middleware.js` |
| 유틸리티 | camelCase + `.js` | `jwt.utils.js`, `password.utils.js` |

### 3.2 변수명 / 함수명 컨벤션

#### 공통

- 변수/함수명: `camelCase`
- 상수(변경 불가 값): `UPPER_SNAKE_CASE` (예: `JWT_EXPIRES_IN`, `DEFAULT_CATEGORIES`)
- 타입/인터페이스명: `PascalCase`
- Boolean 변수/속성: `is`, `has`, `can` 접두어 사용 (예: `isCompleted`, `isDefault`, `hasError`)

#### 프론트엔드

- 이벤트 핸들러: `handle` 접두어 (예: `handleSubmit`, `handleToggleComplete`)
- TanStack Query 훅: `use` + 도메인 + 동작 (예: `useTodos`, `useCreateTodo`, `useDeleteTodo`)
- Zustand 액션: 동사 + 명사 (예: `setFilter`, `clearAuth`, `setAccessToken`)

#### 백엔드

- 컨트롤러 함수: HTTP 동사 + 도메인 (예: `getTodos`, `createTodo`, `deleteTodo`, `toggleTodoComplete`)
- 서비스 함수: 비즈니스 동사 + 도메인 (예: `findTodosByUserId`, `verifyTodoOwnership`, `markTodoComplete`)
- 레포지토리 함수: DB 동사 + 도메인 (예: `insertTodo`, `findById`, `updateTodo`, `deleteById`)

### 3.3 도메인 용어(Ubiquitous Language) 사용 원칙

도메인 정의서(2장)에 정의된 용어를 코드 전반에 일관되게 사용한다. 동의어나 약어를 임의로 사용하지 않는다.

| 도메인 용어 | 영문 코드 용어 | 사용 금지 예시 |
|-------------|---------------|----------------|
| 할일 | `todo` | `task`, `item`, `work` |
| 카테고리 | `category` | `group`, `tag`, `label` |
| 종료예정일 | `dueDate` / `due_date` | `deadline`, `endDate`, `expiry` |
| 완료 여부 | `isCompleted` / `is_completed` | `isDone`, `finished`, `checked` |
| 기간 종료 여부 | `isOverdue` / `overdue` | `expired`, `late`, `past` |
| 인증 | `auth` (모듈명), `authenticate` (함수명) | `login` (모듈명으로 사용 금지) |
| 회원가입 | `register` | `signup`, `join` |
| 사용자 정의 카테고리 | `customCategory` | `userCategory`, `myCategory` |

> **근거**: 팀 내 커뮤니케이션, 문서, 코드 사이의 용어 불일치는 오해와 버그를 유발한다. 도메인 정의서를 단일 진실 공급원(Single Source of Truth)으로 삼아 일관성을 유지한다.

### 3.4 주석 작성 원칙

- **Why 중심 주석**: 코드가 *무엇을* 하는지는 코드 자체로 표현하고, 주석에는 *왜* 그렇게 했는지(비즈니스 규칙 참조, 예외 사유 등)를 작성한다.
- **BR/UC 참조**: 비즈니스 규칙을 구현한 코드에는 `// BR-T-03: 할일 소유권 검증` 형식으로 도메인 정의서의 규칙 ID를 명시한다.
- **TODO 주석**: 2차 기능으로 이관된 항목은 `// TODO(2차): OAuth 전략 추가 시 이 미들웨어를 전략 패턴으로 교체` 형식으로 남긴다.
- **JSDoc**: 외부 모듈에서 사용되는 서비스/유틸리티 함수에는 JSDoc(`/** */`) 형식으로 파라미터와 반환값을 문서화한다.
- **자명한 코드에 주석 금지**: 코드를 그대로 설명하는 주석은 작성하지 않는다.

---

## 4. 테스트 / 품질 원칙

### 4.1 테스트 전략

테스트 피라미드 원칙을 따른다. 단위 테스트를 기반으로, 통합 테스트로 계층 간 연동을 검증한다.

```
        /\
       /E2E\       (범위 밖 - 소규모 프로젝트)
      /------\
     /통합테스트\   (API 엔드포인트 단위)
    /----------\
   /  단위 테스트 \  (서비스, 유틸리티 함수)
  /--------------\
```

| 테스트 유형 | 범위 | 도구 |
|-------------|------|------|
| 단위 테스트 (백엔드) | Service 계층 비즈니스 로직, 유틸리티 함수 | Jest |
| 통합 테스트 (백엔드) | API 엔드포인트 (라우트 → 컨트롤러 → 서비스 → DB) | Jest + Supertest |
| 단위 테스트 (프론트엔드) | 유틸리티 함수, Zustand Store 액션 | Vitest |
| 컴포넌트 테스트 (프론트엔드) | 핵심 UI 컴포넌트 렌더링 및 인터랙션 | Vitest + Testing Library |

### 4.2 백엔드 API 테스트 원칙

- **비즈니스 규칙 커버 우선**: BR이 명시된 모든 서비스 함수는 단위 테스트를 작성한다.
  - BR-U-01 (이메일 중복), BR-T-03 (소유권), BR-C-03 (카테고리 삭제 제한) 등 예외 케이스를 반드시 포함한다.
- **API 통합 테스트**: 각 엔드포인트에 대해 정상 흐름(Happy Path)과 주요 예외 흐름(Error Path) 시나리오를 커버한다.
- **DB 격리**: 통합 테스트 시 테스트 전용 DB 또는 트랜잭션 롤백을 사용하여 테스트 간 데이터 오염을 방지한다.
- **인증 처리**: 인증이 필요한 API 테스트는 테스트용 JWT를 생성하는 헬퍼 함수를 공통으로 사용한다.
- **HTTP 상태 코드 검증**: 성공(200/201), 유효성 오류(400), 인증 실패(401), 권한 없음(403), 미존재(404)를 명시적으로 검증한다.

### 4.3 프론트엔드 컴포넌트 테스트 원칙

- **핵심 인터랙션 중심**: 사용자 시나리오의 핵심 인터랙션(할일 체크박스 토글, 필터 선택, 폼 제출 등)을 가진 컴포넌트를 우선 테스트한다.
- **사용자 행동 기반**: `getByRole`, `getByLabelText` 등 접근성 기반 쿼리를 사용하여 사용자 관점에서 테스트를 작성한다.
- **API 모킹**: TanStack Query를 사용하는 컴포넌트 테스트에서는 `msw(Mock Service Worker)` 또는 Query Client 모킹으로 네트워크 요청을 격리한다.
- **Zustand Store 모킹**: 테스트 시 Zustand Store는 초기 상태를 직접 주입하여 각 테스트를 독립적으로 실행한다.

### 4.4 코드 품질 도구

| 도구 | 용도 | 설정 파일 |
|------|------|-----------|
| ESLint | 코드 린팅, 잠재적 버그 탐지 | `.eslintrc.cjs` |
| Prettier | 코드 포맷 자동화 | `.prettierrc` |
| Husky + lint-staged | 커밋 전 자동 린팅/포맷 적용 | `.husky/pre-commit` |

**ESLint 필수 규칙**:
- `no-console`: `console.log` 직접 사용 금지 (로거 유틸리티 사용)
- `no-unused-vars`: 사용하지 않는 변수 금지

---

## 5. 설정 / 보안 / 운영 원칙

### 5.1 환경 변수 관리 (.env 구조)

모든 민감 정보와 환경별 설정값은 `.env` 파일로 관리한다. 소스 코드에 하드코딩하지 않는다.

```
# .env (backend/)

# 서버 설정
NODE_ENV=development
PORT=3000

# PostgreSQL 연결
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todolist_dev
DB_USER=todolist_user
DB_PASSWORD=your_db_password
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000

# JWT 설정
JWT_SECRET=your_very_long_and_secure_jwt_secret_key
JWT_EXPIRES_IN=24h

# CORS 설정 (프론트엔드 origin)
CLIENT_ORIGIN=http://localhost:5173
```

- `.env` 파일은 반드시 `.gitignore`에 포함한다.
- `.env.example` 파일에 키 목록과 예시 값(실제 비밀값 제외)을 커밋하여 신규 개발자가 설정을 파악할 수 있게 한다.
- 환경 변수는 서버 시작 시 `src/config/env.js`에서 일괄 로드하고 유효성을 검증한다. 필수 환경 변수 누락 시 서버 시작을 중단한다.

### 5.2 JWT 처리 원칙

PRD 4.3과 도메인 정의서 UC-02를 기반으로 한다.

**토큰 저장 위치**:

| 저장 위치 | 채택 여부 | 이유 |
|-----------|-----------|------|
| Zustand `authStore` (메모리) | ✅ 채택 | XSS·CSRF 공격에서 토큰이 탈취되지 않음. `localStorage`·Cookie에 토큰 원문이 남지 않아 보안상 가장 안전 |
| `localStorage` | ❌ 미채택 | XSS 취약. 토큰이 브라우저 영구 저장소에 남아 탈취 위험 |
| `httpOnly Cookie` | ❌ 미채택 | CSRF 방어 별도 필요. OAuth 2차 확장 시 재검토 |

> **주의**: 메모리 저장 방식은 페이지 새로고침 시 토큰이 초기화되어 재로그인이 필요하다. 소규모 프로젝트 범위에서 허용하는 트레이드오프이다.

**Access Token 처리 원칙**:
- 로그인 성공 시 서버로부터 받은 Access Token을 Zustand `authStore`의 `accessToken` 상태에만 저장한다.
- `localStorage.setItem`, `document.cookie` 등 브라우저 영구 저장소에 토큰을 기록하는 코드를 절대 작성하지 않는다.
- 모든 인증 필요 API 요청에는 `Authorization: Bearer <token>` 헤더를 포함한다.
- 프론트엔드 API 클라이언트(`src/api/client.ts`)에서 요청 인터셉터로 Zustand `authStore`의 토큰을 읽어 자동 첨부한다.
- 401 응답 수신 시 `authStore.clearAuth()`를 호출하고 `/login` 페이지로 리다이렉트한다.
- 토큰 만료 처리: 1차 MVP에서는 만료 시 재로그인 유도. Refresh Token은 2차에서 도입을 검토한다.

**백엔드 미들웨어 원칙**:
- JWT 검증 미들웨어는 `auth.middleware.js` 단일 파일로 구현한다.
- 검증 성공 시 `req.user`에 `{ userId: string }` 객체를 첨부한다.
- 토큰 없음 또는 유효하지 않은 토큰에 대해 401 응답을 반환한다.
- PRD 4.3의 전략 패턴 확장을 위해 토큰 검증 로직을 `verifyToken` 함수로 분리한다.

### 5.3 보안 원칙

#### 입력 검증 레이어

입력 검증은 두 단계로 수행한다.

| 단계 | 위치 | 목적 |
|------|------|------|
| 1차 (클라이언트) | 프론트엔드 폼 | 즉각적인 UX 피드백 |
| 2차 (서버) | 백엔드 컨트롤러 | 신뢰할 수 있는 검증 (필수) |

> **근거**: 클라이언트 검증은 우회 가능하므로 서버 사이드 검증이 반드시 존재해야 한다.

#### SQL Injection 방어

- `pg` 라이브러리 사용 시 반드시 파라미터화된 쿼리(Parameterized Query)를 사용한다.
- 사용자 입력값을 쿼리 문자열에 직접 연결(string concatenation)하는 코드는 절대 작성하지 않는다.

```javascript
// 금지 (SQL Injection 취약)
await pool.query(`SELECT * FROM todos WHERE user_id = '${userId}'`);

// 필수 (파라미터화된 쿼리)
await pool.query('SELECT * FROM todos WHERE user_id = $1', [userId]);
```

#### 비밀번호 보안

- 비밀번호는 `bcrypt`로 해시하여 저장한다. 평문 저장 및 가역 암호화 금지 (BR-U-02).
- bcrypt cost factor는 최소 10으로 설정한다.
- 로그인 실패 응답에서 이메일 존재 여부를 노출하지 않는다. 단일 오류 메시지를 반환한다 (UC-02 예외 흐름).

#### 소유권 검증

- 인증된 사용자의 모든 리소스 조작 요청에 대해 서비스 계층에서 `user_id` 기반 소유권을 검증한다 (BR-T-03, BR-C-02).
- 소유권 검증 실패 시 **403 Forbidden**을 반환하여 리소스 존재 여부를 노출하지 않는다.

### 5.4 에러 처리 및 로깅 원칙

#### 에러 처리 흐름

```
컨트롤러/서비스에서 에러 throw
        ↓
Express 에러 핸들링 미들웨어 (error.middleware.ts)
        ↓
클라이언트에 통일된 JSON 응답 반환
```

**에러 응답 형식** (PRD 8.1 준수):
```json
{
  "message": "사용자에게 표시할 에러 메시지",
  "code": "BUSINESS_ERROR_CODE"
}
```

**HTTP 상태 코드 사용 기준**:

| 상황 | 상태 코드 |
|------|-----------|
| 성공 (조회/수정/삭제) | 200 OK |
| 성공 (생성) | 201 Created |
| 입력값 유효성 오류 | 400 Bad Request |
| 인증 토큰 없음/만료 | 401 Unauthorized |
| 소유권 검증 실패 | 403 Forbidden |
| 리소스 미존재 | 404 Not Found |
| 서버 내부 오류 | 500 Internal Server Error |

#### 로깅 원칙

- `console.log` 직접 사용 금지. `src/utils/logger.ts`의 로거 유틸리티를 통해 로깅한다.
- 로그 레벨: `error`, `warn`, `info`, `debug`를 환경변수(`LOG_LEVEL`)로 제어한다.
- 에러 로그에는 스택 트레이스를 포함하되, 클라이언트 응답에는 스택 트레이스를 절대 노출하지 않는다.
- 인증 관련 로그에 비밀번호, JWT 토큰 원문을 기록하지 않는다.

---

## 6. 프론트엔드 디렉토리 구조

### 6.1 기능 기반(Feature-Based) 디렉토리 구조

```
frontend/
├── public/                           # 정적 파일 (favicon 등)
├── src/
│   ├── main.tsx                      # 앱 진입점
│   ├── App.tsx                       # 루트 컴포넌트, 라우팅 설정
│   │
│   ├── api/                          # API 클라이언트 계층
│   │   ├── client.ts                 # fetch 기본 설정, 인터셉터 (토큰 첨부, 401 처리)
│   │   ├── auth.api.ts               # /api/auth 엔드포인트 호출 함수
│   │   ├── todo.api.ts               # /api/todos 엔드포인트 호출 함수
│   │   ├── category.api.ts           # /api/categories 엔드포인트 호출 함수
│   │   └── user.api.ts               # /api/users 엔드포인트 호출 함수
│   │
│   ├── features/                     # 기능(도메인) 단위 모듈
│   │   ├── auth/                     # 인증 기능 (회원가입, 로그인)
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts        # 로그인/회원가입 mutation 훅
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── todo/                     # 할일 기능
│   │   │   ├── components/
│   │   │   │   ├── TodoList.tsx      # 할일 목록 컨테이너
│   │   │   │   ├── TodoCard.tsx      # 개별 할일 카드 (완료 토글 포함)
│   │   │   │   ├── TodoForm.tsx      # 할일 등록/수정 폼
│   │   │   │   └── FilterBar.tsx     # 필터 바 (카테고리/기간초과/완료여부)
│   │   │   ├── hooks/
│   │   │   │   ├── useTodos.ts               # 할일 목록 query 훅
│   │   │   │   ├── useCreateTodo.ts          # 할일 등록 mutation 훅
│   │   │   │   ├── useUpdateTodo.ts          # 할일 수정 mutation 훅
│   │   │   │   ├── useDeleteTodo.ts          # 할일 삭제 mutation 훅
│   │   │   │   └── useToggleTodoComplete.ts  # 완료/미완료 처리 훅
│   │   │   └── todo.types.ts
│   │   │
│   │   ├── category/                 # 카테고리 기능
│   │   │   ├── components/
│   │   │   │   ├── CategoryList.tsx
│   │   │   │   └── AddCategoryForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useCategories.ts
│   │   │   │   └── useCreateCategory.ts
│   │   │   └── category.types.ts
│   │   │
│   │   └── user/                     # 사용자 프로필 기능
│   │       ├── components/
│   │       │   └── ProfileForm.tsx
│   │       ├── hooks/
│   │       │   └── useUpdateProfile.ts
│   │       └── user.types.ts
│   │
│   ├── pages/                        # 페이지 컴포넌트 (라우팅 단위)
│   │   ├── LoginPage.tsx             # /login
│   │   ├── RegisterPage.tsx          # /register
│   │   ├── TodoListPage.tsx          # / (메인, 인증 필요)
│   │   └── ProfilePage.tsx           # /profile (인증 필요)
│   │
│   ├── components/                   # 공통 UI 컴포넌트
│   │   ├── Layout.tsx                # 공통 레이아웃 (사이드바/모바일 네비게이션)
│   │   ├── PrivateRoute.tsx          # 인증 필요 라우트 가드
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── EmptyState.tsx            # 필터 결과 0건 등 빈 상태 UI
│   │
│   ├── stores/                       # Zustand 전역 상태
│   │   ├── authStore.ts              # 인증 상태 (accessToken, userId)
│   │   └── filterStore.ts            # 필터 UI 상태 (categoryId, isCompleted, overdue)
│   │
│   ├── utils/                        # 유틸리티 함수 (순수 함수)
│   │   ├── date.utils.ts             # DueDate 파생값 계산 (isOverdue 등)
│   │   └── validation.utils.ts       # 공통 폼 유효성 검사 함수
│   │
│   ├── constants/
│   │   └── queryKeys.constants.ts    # TanStack Query 쿼리 키 중앙 관리
│   │
│   └── types/
│       └── api.types.ts              # API 공통 Response/Error 타입
│
├── .eslintrc.cjs
├── .prettierrc
├── tsconfig.json
└── vite.config.ts
```

### 6.2 각 디렉토리 역할 및 규칙

| 디렉토리 | 역할 | 규칙 |
|----------|------|------|
| `api/` | HTTP 요청 함수 집약 | 순수 fetch 함수만 포함. 비즈니스 로직 금지. 반환 타입 명시 필수 |
| `features/*/components/` | 기능 전용 UI 컴포넌트 | 해당 기능 외 다른 feature를 직접 import 금지 |
| `features/*/hooks/` | TanStack Query 훅 | query/mutation 훅만 포함. 반드시 `api/` 계층을 통해 호출 |
| `pages/` | 라우팅 단위 컴포넌트 | 레이아웃 조합 역할. 직접적인 비즈니스 로직 금지 |
| `components/` | 재사용 가능한 공통 UI | 도메인 종속성 없는 순수 UI 컴포넌트만 포함 |
| `stores/` | Zustand 전역 상태 | 서버 상태(API 데이터) 포함 금지. UI 상태와 인증 상태만 관리 |
| `utils/` | 순수 유틸리티 함수 | 부수 효과(side effect) 없는 순수 함수만 포함 |

### 6.3 Zustand Store 구조 원칙

서버 상태(API 데이터)는 TanStack Query, UI 상태와 인증 상태는 Zustand로 명확히 분리한다.

```typescript
// authStore.ts
interface AuthState {
  accessToken: string | null;
  userId: string | null;
  setAuth: (token: string, userId: string) => void;
  clearAuth: () => void;
}

// filterStore.ts (BR-F-01 ~ BR-F-04 반영)
interface FilterState {
  categoryId: string | null;    // null = 전체
  isCompleted: boolean | null;  // null = 전체, true = 완료, false = 미완료
  overdue: boolean | null;      // null = 전체, true = 기간 초과
  setFilter: (filter: Partial<FilterState>) => void;
  resetFilter: () => void;
}
```

- 각 스토어는 단일 책임을 가진다. `authStore`에 필터 상태를 추가하지 않는다.
- 파생 가능한 값은 스토어에 저장하지 않고 셀렉터 함수로 계산한다.

### 6.4 TanStack Query 사용 원칙

#### 쿼리 키 중앙 관리

모든 쿼리 키는 `src/constants/queryKeys.constants.ts`에서 관리한다. 쿼리 키가 분산되면 `invalidateQueries` 호출 시 캐시 무효화가 누락될 수 있다.

```typescript
export const QUERY_KEYS = {
  todos: {
    all: ['todos'] as const,
    filtered: (filters: TodoFilters) => ['todos', filters] as const,
  },
  categories: { all: ['categories'] as const },
  user: { me: ['user', 'me'] as const },
} as const;
```

#### 사용 규칙

- **Query**: 서버 데이터 조회(`GET`)에만 `useQuery`를 사용한다.
- **Mutation**: 데이터 변경(`POST`, `PATCH`, `DELETE`)에는 `useMutation`을 사용하고, 성공 시 관련 쿼리를 `invalidateQueries`로 무효화한다.
- **낙관적 업데이트**: 완료 토글(`useToggleTodoComplete`)에 한해 UX 향상을 위해 낙관적 업데이트 적용을 권장한다.
- **staleTime**: 카테고리 목록처럼 변경이 적은 데이터는 `staleTime`을 설정하여 불필요한 API 호출을 줄인다.

---

## 7. 백엔드 디렉토리 구조

### 7.1 레이어드 아키텍처 기반 구조

```
backend/
├── src/
│   ├── index.js                          # 서버 진입점 (Express 앱 초기화, 포트 바인딩)
│   ├── app.js                            # Express 앱 설정 (미들웨어 등록, 라우터 연결)
│   │
│   ├── config/
│   │   ├── env.js                        # 환경 변수 로드 및 필수값 유효성 검증
│   │   └── db.js                         # pg.Pool 단일 인스턴스 생성 및 export
│   │
│   ├── routes/                           # 라우팅 레이어 (URL 매핑)
│   │   ├── index.js                      # 모든 라우터를 /api prefix로 통합
│   │   ├── auth.routes.js                # POST /auth/register, POST /auth/login
│   │   ├── user.routes.js                # GET /users/me, PATCH /users/me
│   │   ├── todo.routes.js                # GET/POST /todos, PATCH/DELETE /todos/:id
│   │   └── category.routes.js            # GET /categories, POST /categories
│   │
│   ├── controllers/                      # 컨트롤러 레이어 (요청 파싱, 응답 직렬화)
│   │   ├── auth.controller.js            # register, login
│   │   ├── user.controller.js            # getMe, updateMe
│   │   ├── todo.controller.js            # getTodos, createTodo, updateTodo, deleteTodo, toggleComplete
│   │   └── category.controller.js        # getCategories, createCategory
│   │
│   ├── services/                         # 서비스 레이어 (비즈니스 로직, BR 검증)
│   │   ├── auth.service.js               # registerUser, authenticateUser
│   │   ├── user.service.js               # getUserProfile, updateUserProfile
│   │   ├── todo.service.js               # findTodos, createTodo, updateTodo, deleteTodo, toggleComplete
│   │   └── category.service.js           # findCategories, createCategory
│   │
│   ├── repositories/                     # 레포지토리 레이어 (SQL 쿼리, DB 접근)
│   │   ├── user.repository.js            # findByEmail, insertUser, updateUser
│   │   ├── todo.repository.js            # findByUserId, findById, insertTodo, updateTodo, deleteById
│   │   └── category.repository.js        # findByUserIdAndDefault, insertCategory, findById
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js            # JWT 검증, req.user 설정
│   │   ├── error.middleware.js           # 전역 에러 핸들러
│   │   └── validate.middleware.js        # 요청 바디/쿼리 파라미터 유효성 검증
│   │
│   └── utils/
│       ├── jwt.utils.js                  # signToken, verifyToken
│       ├── password.utils.js             # hashPassword, comparePassword (bcrypt)
│       ├── date.utils.js                 # isOverdue 계산
│       └── logger.js                     # 로거 유틸리티
│
├── tests/
│   ├── unit/
│   │   ├── services/                     # 서비스 레이어 단위 테스트 (BR 검증 중심)
│   │   └── utils/                        # 유틸리티 함수 단위 테스트
│   └── integration/
│       ├── auth.test.js                  # 인증 API 통합 테스트
│       ├── todo.test.js                  # 할일 API 통합 테스트
│       └── category.test.js             # 카테고리 API 통합 테스트
│
├── .env
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
└── package.json
```

### 7.2 각 레이어 역할 및 규칙

#### Routes (라우팅 레이어)

URL 경로와 HTTP 메서드를 컨트롤러 함수에 매핑하고, 미들웨어 체인을 선언한다. 비즈니스 로직을 포함하지 않는다.

```javascript
// todo.routes.js 예시
router.get('/',           authMiddleware, getTodos);
router.post('/',          authMiddleware, validateCreateTodo, createTodo);
router.patch('/:id',      authMiddleware, validateUpdateTodo, updateTodo);
router.patch('/:id/complete', authMiddleware, toggleTodoComplete);
router.delete('/:id',    authMiddleware, deleteTodo);
```

#### Controllers (컨트롤러 레이어)

`req` 객체에서 입력값을 추출하고 서비스를 호출한 뒤 결과를 `res` 객체로 응답한다. try/catch로 에러를 잡아 `next(error)`를 호출한다. 비즈니스 규칙 검증을 직접 수행하지 않는다.

#### Services (서비스 레이어)

**비즈니스 규칙(BR)의 유일한 구현 위치**이다. 레포지토리를 호출하여 데이터를 조회하고 도메인 규칙을 검증한다. Express의 `req`, `res` 객체에 의존하지 않아 단위 테스트가 가능하다.

#### Repositories (레포지토리 레이어)

SQL 쿼리 실행과 DB Row를 내부 타입으로 변환하는 것만 담당한다. 비즈니스 로직을 포함하지 않는다. 모든 쿼리는 파라미터화된 쿼리로 작성한다.

### 7.3 pg 라이브러리 사용 원칙

#### Connection Pool 관리

```javascript
// config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: Number(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
});

module.exports = pool;
```

- `Pool` 인스턴스는 `config/db.ts`에서 단일 생성 후 export한다. 레포지토리 파일에서 직접 `new Pool()`을 생성하지 않는다.
- `pool.connect()`로 클라이언트를 직접 사용하는 경우(트랜잭션 등) 반드시 `finally` 블록에서 `client.release()`를 호출한다.

#### 동적 필터 쿼리 작성 패턴 (BR-F-01~F-04)

```javascript
// todo.repository.js - 동적 필터 쿼리 구성
const conditions = ['t.user_id = $1'];
const values = [userId];
let idx = 2;

if (categoryId) {
  conditions.push(`t.category_id = $${idx++}`);
  values.push(categoryId);
}
if (isCompleted !== undefined) {
  conditions.push(`t.is_completed = $${idx++}`);
  values.push(isCompleted);
}
// BR-F-02: 기간 초과 필터
if (overdue === true) {
  conditions.push(`t.due_date < CURRENT_DATE`);
}

const sql = `
  SELECT * FROM todos t
  WHERE ${conditions.join(' AND ')}
  ORDER BY t.created_at DESC
`;
return pool.query(sql, values);
```

### 7.4 미들웨어 구성 원칙

#### 미들웨어 등록 순서 (app.ts)

```
1. cors                  CORS 허용 (CLIENT_ORIGIN 환경변수 기반)
2. express.json()        요청 바디 JSON 파싱
3. morgan (dev)          요청 로깅 (개발 환경만)
4. /api routes           API 라우터
5. 404 핸들러            등록되지 않은 경로 처리
6. error.middleware      전역 에러 핸들러 (반드시 마지막 등록)
```

#### 커스텀 에러 클래스

```javascript
// 서비스 계층에서 비즈니스 에러를 throw할 때 사용
class AppError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;  // 예: 'EMAIL_DUPLICATE', 'FORBIDDEN'
  }
}
```

`AppError`가 아닌 예상치 못한 에러는 500으로 처리하고, 스택 트레이스는 로그에만 기록하며 클라이언트에는 노출하지 않는다.

---

*본 문서는 TodoListApp 프로젝트의 구조 설계 원칙을 정의한 문서이며, 2차 개발 시 개정됩니다.*
