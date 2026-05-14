# TodoListApp 실행 계획서

- 버전: 1.0.0
- 작성일: 2026-05-13
- 참조 문서:
  - [도메인 정의서 v1.0.0](./1-domain-definition.md)
  - [PRD v1.3.0](./2-prd.md)
  - [사용자 시나리오 v1.0.0](./3-user-scenario.md)
  - [프로젝트 원칙 v1.0.0](./4-project-principles.md)
  - [아키텍처 다이어그램 v1.0.0](./5-arch-diagram.md)
  - [ERD v1.0.0](./6-erd.md)
  - [DDL](../database/schema.sql)

---

## 변경 이력

| 버전  | 날짜       | 작성자          | 변경 내용                                           |
| ----- | ---------- | --------------- | --------------------------------------------------- |
| 1.0.0 | 2026-05-13 | Project Planner | 최초 작성 — DB/백엔드/프론트엔드 3개 영역 Task 분해 |

---

## 1. 개요

본 문서는 TodoListApp의 전체 구현 작업을 **데이터베이스**, **백엔드**, **프론트엔드** 3개 영역으로 분해하고, 각 Task의 완료 조건과 의존성을 정의한 실행 계획서이다.

### 1.1 기술 스택 요약

| 영역         | 기술                                                    |
| ------------ | ------------------------------------------------------- |
| 프론트엔드   | React 19 + TypeScript, Zustand, TanStack Query          |
| 백엔드       | Node.js + Express, JavaScript (CommonJS)                |
| 데이터베이스 | PostgreSQL 17, pg 라이브러리 (ORM 금지)                 |
| 인증         | JWT (jsonwebtoken), bcrypt (cost ≥ 10)                  |
| 토큰 저장    | Zustand authStore 메모리 — localStorage/Cookie **금지** |

### 1.2 전체 Task 현황

| 영역         | Task 수  | 예상 소요 |
| ------------ | -------- | --------- |
| 데이터베이스 | 11개     | Day 1     |
| 백엔드       | 24개     | Day 1~2   |
| 프론트엔드   | 28개     | Day 2~3   |
| **합계**     | **63개** | **3일**   |

### 1.3 범례

- `[DB-n]` — 데이터베이스 Task
- `[BE-n]` — 백엔드 Task
- `[FE-n]` — 프론트엔드 Task
- **의존**: 선행 완료가 필수인 Task 목록
- **완료 조건**: 체크박스 형식의 Done 기준

---

## 2. 데이터베이스 (DB)

### DB-01: PostgreSQL 환경 설정 및 DB 생성

**의존**: 없음

**완료 조건:**

- [x] PostgreSQL 17 설치 확인 (`psql --version` → 17.x) — PostgreSQL 17.9 확인
- [x] 애플리케이션 전용 사용자 생성: `todolist_user`
- [x] 개발 DB 생성: `todolist_dev`
- [x] 테스트 DB 생성: `todolist_test`
- [x] `todolist_user`로 두 DB 접속 가능 확인

---

### DB-02: 환경변수 파일 생성

**의존**: DB-01

**완료 조건:**

- [x] `backend/.env.example` 생성 (키 목록, 실제값 제외)
- [x] `backend/.env` 생성 (개발 환경 실제값 포함)
  ```
  NODE_ENV=development
  PORT=3000
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=todolist_dev
  DB_USER=todolist_user
  DB_PASSWORD=<password>
  DB_POOL_MAX=10
  DB_POOL_IDLE_TIMEOUT=30000
  JWT_SECRET=<long_secure_key>
  JWT_EXPIRES_IN=24h
  CLIENT_ORIGIN=http://localhost:5173
  ```
- [x] `.gitignore`에 `.env` 포함 확인 — `.env` 및 `.env.*` 이미 포함, `.env.example` 예외 처리됨
- [x] `frontend/.env.example` 생성 (`VITE_API_URL=http://localhost:3000`)

---

### DB-03: 스키마 마이그레이션 실행

**의존**: DB-01, DB-02

**완료 조건:**

- [x] `psql -U todolist_user -d todolist_dev -f database/schema.sql` 성공 실행
- [x] `psql -U todolist_user -d todolist_test -f database/schema.sql` 성공 실행
- [x] 3개 테이블 생성 확인 (`\dt`: users, categories, todos)
- [x] 인덱스 6개 생성 확인 (`\di`)
  - `uq_categories_user_name` (BR-C-04 부분 유니크)
  - `idx_todos_user_id`
  - `idx_todos_user_completed`
  - `idx_todos_user_category`
  - `idx_todos_due_date`
  - `idx_categories_user_id`
- [x] 트리거 2개 생성 확인: `trg_users_updated_at`, `trg_todos_updated_at`

---

### DB-04: 시드 데이터 검증

**의존**: DB-03

**완료 조건:**

- [x] 기본 카테고리 3개 삽입 확인
  ```sql
  SELECT name, user_id, is_default FROM categories WHERE is_default = TRUE;
  -- 결과: 개인(NULL,true), 업무(NULL,true), 쇼핑(NULL,true)
  ```
- [x] `user_id = NULL`, `is_default = TRUE` 확인
- [x] 외래키 ON DELETE RESTRICT 확인 (`fk_todos_category`: RESTRICT, `fk_todos_user`: CASCADE)

---

### DB-05: Connection Pool 설정 모듈 구현

**의존**: DB-02

**완료 조건:**

- [x] `backend/src/config/db.ts` 작성
  ```typescript
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: Number(process.env.DB_POOL_MAX) || 10,
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: 2000,
  });
  export default pool;
  ```
- [x] `pool.on('error', ...)` 에러 리스너 등록
- [x] Pool 싱글톤 export 확인

---

### DB-06: 환경변수 검증 모듈 구현

**의존**: DB-02

**완료 조건:**

- [x] `backend/src/config/env.ts` 작성
- [x] 필수 환경변수 목록 검증: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `PORT`
- [x] 누락 시 서버 시작 중단 및 명확한 에러 메시지 출력
- [x] TypeScript 타입 안전성 확보 (`as const` + `Record<RequiredVar, string>`)

---

### DB-07: DB 연결 테스트 스크립트

**의존**: DB-05, DB-03

**완료 조건:**

- [x] `npm run db:test` 실행 성공
- [x] `SELECT COUNT(*) FROM categories WHERE is_default = TRUE;` → 결과 3
- [x] "Connected to PostgreSQL successfully" 메시지 출력

---

### DB-08: User Repository 구현

**의존**: DB-05, DB-03

**완료 조건:**

- [x] `backend/src/repositories/user.repository.js` 구현
  - `findByEmail(email)` — 이메일로 사용자 조회
  - `insertUser(email, password, name)` — 사용자 삽입
  - `findById(userId)` — ID로 사용자 조회
  - `updateUser(userId, updates)` — 이름/비밀번호 수정
- [x] 모든 쿼리 `$1, $2, ...` 파라미터화 (SQL Injection 방지)
- [x] JSDoc으로 반환 Row 형태 문서화

---

### DB-09: Category Repository 구현

**의존**: DB-05, DB-03

**완료 조건:**

- [x] `backend/src/repositories/category.repository.js` 구현
  - `findByUserIdAndDefault(userId)` — 기본 + 사용자 정의 카테고리 조회
  - `findById(categoryId)` — 특정 카테고리 조회
  - `findByUserIdAndName(userId, name)` — 이름 중복 확인 (BR-C-04)
  - `insertCategory(userId, name)` — 카테고리 생성
  - `deleteById(categoryId)` — 카테고리 삭제
  - `countTodosByCategory(categoryId)` — 할일 수 조회 (BR-C-03 검증용)
- [x] NULL 조건 처리: `WHERE user_id = $1 OR (user_id IS NULL AND is_default = TRUE)`
- [x] 모든 쿼리 파라미터화 확인

---

### DB-10: Todo Repository 구현

**의존**: DB-05, DB-03

**완료 조건:**

- [x] `backend/src/repositories/todo.repository.js` 구현
  - `findByUserId(userId, filters)` — 동적 필터 조회 (BR-F-01~F-04), filters 생략 가능
  - `findById(todoId)` — 특정 할일 조회
  - `insertTodo(userId, input)` — 할일 생성
  - `updateTodo(todoId, updates)` — 할일 수정
  - `deleteById(todoId)` — 할일 삭제
  - `toggleComplete(todoId, isCompleted)` — 완료/미완료 처리 (`completed_at` 자동 관리)
- [x] 동적 필터 쿼리: 조건 배열 + 파라미터 인덱스 자동 증가 패턴
  ```javascript
  const conditions = ["user_id = $1"];
  const values = [userId];
  let idx = 2;
  if (filters?.categoryId) {
    conditions.push(`category_id = $${idx++}`);
    values.push(filters.categoryId);
  }
  ```
- [x] 모든 쿼리 파라미터화 확인

---

### DB-11: 인덱스 성능 검증

**의존**: DB-03, DB-08, DB-09, DB-10

**완료 조건:**

- [ ] 핵심 쿼리 6종에 대해 `EXPLAIN ANALYZE` 수행
- [ ] 모든 쿼리에서 "Index Scan" 또는 "Index Only Scan" 확인
- [ ] 단일 쿼리 응답 < 100ms 목표

---

## 3. 백엔드 (BE)

### BE-01: Node.js 프로젝트 초기화

**의존**: 없음

**완료 조건:**

- [x] `backend/package.json` 생성 (Node.js LTS)
- [x] 필수 패키지 설치: `express`, `pg`, `jsonwebtoken`, `bcrypt`, `dotenv`, `cors`
- [x] 개발 의존성: `jest`, `supertest`, `nodemon`
- [x] `npm scripts` 정의: `start`, `dev`, `test`, `db:test`

---

### BE-02: 백엔드 디렉토리 구조 생성

**의존**: BE-01

**완료 조건:**

- [x] 레이어드 아키텍처 디렉토리 생성:
  ```
  src/
  ├── index.js
  ├── app.js
  ├── config/        (db.js, env.js)
  ├── routes/
  ├── controllers/
  ├── services/
  ├── repositories/
  ├── middlewares/
  └── utils/
  ```
- [x] `tests/unit/`, `tests/integration/` 디렉토리 생성

---

### BE-03: Express 앱 기본 설정

**의존**: BE-01, BE-02, DB-05, DB-06

**완료 조건:**

- [x] `src/app.js` 작성 — CORS, `express.json()`, 라우팅 통합, 404 핸들러
- [x] `src/index.js` 작성 — 환경변수 검증 → DB 연결 확인 → 서버 시작
- [x] `src/utils/logger.js` 작성 — `error()`, `warn()`, `info()`, `debug()` 메서드 (`LOG_LEVEL` 제어)
- [x] ESLint `no-console` 규칙 활성화 (logger 사용 강제)

---

### BE-04: JWT 유틸리티 구현

**의존**: BE-01

**완료 조건:**

- [x] `src/utils/jwt.utils.js` 구현
  - `signToken(userId)` — JWT 생성
  - `verifyToken(token)` — 검증 성공 시 `{ userId }` 반환, 실패 시 `null`
  - `extractToken(authHeader)` — Bearer 헤더에서 토큰 추출
- [x] 테스트: 토큰 생성/검증 성공, 만료 토큰 실패, 위조 토큰 실패

---

### BE-05: 비밀번호 해시 유틸리티 구현 (BR-U-02)

**의존**: BE-01

**완료 조건:**

- [x] `src/utils/password.utils.js` 구현
  - `hashPassword(plain)` — bcrypt, cost factor ≥ 10
  - `comparePassword(plain, hashed)` — 비밀번호 검증
- [x] 테스트: 해시 생성 및 검증 성공, 잘못된 비밀번호 실패

---

### BE-06: JWT 인증 미들웨어 구현 (BR-U-03)

**의존**: BE-04

**완료 조건:**

- [x] `src/middlewares/auth.middleware.js` 구현
  - `Authorization: Bearer <token>` 헤더 검증
  - 검증 성공 시 `req.user = { userId }` 설정
  - 실패 시 401 Unauthorized 반환
- [x] 테스트: 유효 토큰 통과, 토큰 없음/위조 401

---

### BE-07: 에러 핸들링 미들웨어 구현

**의존**: BE-02

**완료 조건:**

- [x] `src/utils/app-error.js` — `AppError(statusCode, message, code)` 커스텀 클래스
- [x] `src/middlewares/error.middleware.js` 구현
  - `AppError`: statusCode + message + code 응답
  - 예상치 못한 에러: 500, 스택 트레이스는 로그에만
  - 클라이언트 응답 형식: `{ "message": "...", "code": "..." }`
- [x] `app.js` 마지막에 에러 미들웨어 등록

---

### BE-08: 입력 검증 미들웨어 구현

**의존**: BE-02

**완료 조건:**

- [x] `src/middlewares/validate.middleware.js` 구현
  - `validateRegister` — email 형식, password 8자↑, name 필수
  - `validateLogin` — email, password 필수
  - `validateCreateTodo` — title, category_id 필수; due_date 형식 및 미래 날짜 (BR-T-06)
  - `validateUpdateTodo` — 선택 필드 형식 검증
  - `validateToggleComplete` — is_completed boolean 필수
  - `validateCreateCategory` — name 필수
  - `validateUpdateUser` — name/password 선택 검증
- [x] 실패 시 400 Bad Request

---

### BE-09: 날짜 유틸리티 구현

**의존**: BE-01

**완료 조건:**

- [x] `src/utils/date.utils.js` 구현
  - `isValidFutureDate(dateString)` — ISO 형식 + 오늘 이후 (BR-T-06)
  - `isOverdue(dueDate)` — `dueDate < CURRENT_DATE` (BR-F-02)
  - `getTodayDate()` — 시간 제외 날짜 기준

---

### BE-10: JSDoc 타입 주석 및 상수 정의

**의존**: BE-02

**완료 조건:**

- [x] `src/utils/app-error.js` — `AppError` 클래스에 JSDoc 주석 작성
- [x] `src/repositories/user.repository.js`, `todo.repository.js`, `category.repository.js` — Row 반환 형태 JSDoc으로 문서화
- [x] `src/constants/http-status.js` — HTTP 상태 코드 상수 정의 (200, 201, 400, 401, 403, 404, 500)
- [x] 각 서비스/레포지토리 함수에 `@param`, `@returns` JSDoc 주석 작성

---

### BE-11: 회원가입 API (UC-01 / BR-U-01, BR-U-02)

**의존**: BE-03, BE-05, BE-07, BE-08, BE-10, DB-08

**완료 조건:**

- [x] Route: `POST /api/auth/register`
- [x] Service: `registerUser()` — 이메일 중복 확인(BR-U-01), bcrypt 해싱(BR-U-02)
- [x] 응답: 성공 201 `{ "message": "회원가입이 완료되었습니다" }`
- [x] 실패: 이메일 중복 400, 입력 누락 400
- [x] 통합 테스트 통과

---

### BE-12: 로그인 API (UC-02 / BR-U-02, BR-U-03)

**의존**: BE-03, BE-04, BE-05, BE-07, BE-08, BE-10, DB-08

**완료 조건:**

- [x] Route: `POST /api/auth/login`
- [x] Service: `authenticateUser()` — 비밀번호 검증, JWT 발급
- [x] 실패 시 단일 에러 메시지 (계정 존재 여부 노출 금지)
- [x] 응답: 성공 200 `{ "accessToken": "..." }`
- [x] 통합 테스트 통과

---

### BE-13: 사용자 정보 조회 API

**의존**: BE-03, BE-06, BE-10, DB-08

**완료 조건:**

- [x] Route: `GET /api/users/me` (인증 필요)
- [x] 응답: 200 `{ id, email, name, created_at, updated_at }` (password 제외)
- [x] 미인증 401

---

### BE-14: 사용자 정보 수정 API (UC-03 / BR-U-04)

**의존**: BE-06, BE-07, BE-08, BE-10, DB-08

**완료 조건:**

- [x] Route: `PATCH /api/users/me` (인증 필요)
- [x] 이메일 변경 요청 시 400 거부 (BR-U-04)
- [x] 비밀번호 변경 시 현재 비밀번호 검증 필수
- [x] 현재 비밀번호 불일치 시 400
- [x] 통합 테스트 통과

---

### BE-15: 카테고리 목록 조회 API (BR-C-01, BR-C-02)

**의존**: BE-03, BE-06, BE-07, BE-10, DB-09

**완료 조건:**

- [x] Route: `GET /api/categories` (인증 필요)
- [x] 기본 카테고리(is_default=true) + 현재 사용자 정의 카테고리 통합 반환
- [x] 응답: 200, 카테고리 배열 (`is_default` 필드 포함)
- [x] 미인증 401

---

### BE-16: 카테고리 생성 API (UC-04 / BR-C-04)

**의존**: BE-06, BE-07, BE-08, BE-10, DB-09

**완료 조건:**

- [x] Route: `POST /api/categories` (인증 필요)
- [x] 동일 사용자 내 이름 중복 시 400 (BR-C-04)
- [x] 응답: 성공 201 `{ id, name, is_default, created_at }`
- [x] 통합 테스트 통과

---

### BE-17: 할일 생성 API (UC-05 / BR-T-01, BR-T-02, BR-T-06)

**의존**: BE-06, BE-07, BE-08, BE-09, BE-10, DB-10

**완료 조건:**

- [x] Route: `POST /api/todos` (인증 필요)
- [x] `title`, `category_id` 필수 (BR-T-01, BR-T-02)
- [x] `due_date` 입력 시 오늘 이후 검증 (BR-T-06)
- [x] 카테고리 접근 권한 검증 (기본 카테고리 전체 공유, 사용자 정의는 소유자만 — BR-C-02)
- [x] 응답: 성공 201, 전체 Todo 객체
- [x] 통합 테스트 통과

---

### BE-18: 할일 목록 조회 API (UC-06 / BR-F-01~F-04)

**의존**: BE-06, BE-09, BE-10, DB-10

**완료 조건:**

- [x] Route: `GET /api/todos` (인증 필요)
- [x] 쿼리 파라미터: `?category_id=&is_completed=&overdue=`
- [x] 복수 필터 AND 조건 적용 (BR-F-04)
- [x] 정렬: `created_at DESC`
- [x] 미인증 401

---

### BE-19: 할일 수정 API (UC-07 / BR-T-03, BR-T-06)

**의존**: BE-06, BE-07, BE-08, BE-09, BE-10, DB-10

**완료 조건:**

- [x] Route: `PATCH /api/todos/:id` (인증 필요)
- [x] 소유권 검증 — 타인 소유 시 403 (BR-T-03, 존재 여부 노출 금지)
- [x] `due_date` 수정 시 오늘 이후 검증 (BR-T-06)
- [x] 카테고리 변경 시 접근 권한 검증 (BR-C-02)
- [x] 응답: 성공 200, 수정된 Todo 객체

---

### BE-20: 할일 완료/미완료 처리 API (UC-08 / BR-T-04, BR-T-05)

**의존**: BE-06, BE-07, BE-08, BE-10, DB-10

**완료 조건:**

- [x] Route: `PATCH /api/todos/:id/complete` (인증 필요)
- [x] Request: `{ "is_completed": boolean }`
- [x] 완료 처리: `completed_at = NOW()` 자동 기록 (BR-T-04)
- [x] 미완료 복원: `completed_at = NULL` 초기화 (BR-T-05)
- [x] 소유권 검증, 타인 소유 시 403 (BR-T-03)
- [x] 통합 테스트 통과

---

### BE-21: 할일 삭제 API (UC-09 / BR-T-03)

**의존**: BE-06, BE-07, BE-10, DB-10

**완료 조건:**

- [x] Route: `DELETE /api/todos/:id` (인증 필요)
- [x] 소유권 검증 — 타인 소유 시 403 (BR-T-03)
- [x] 응답: 성공 200 `{ "message": "할일이 삭제되었습니다" }`
- [x] 통합 테스트 통과

---

### BE-22: 라우터 통합 및 최종 서버 설정

**의존**: BE-11~BE-21

**완료 조건:**

- [x] `src/routes/index.js` — 모든 라우터 통합
- [x] `/api/auth/*`, `/api/users/*`, `/api/categories/*`, `/api/todos/*` 경로 등록
- [x] 인증 필요 라우터에 `authMiddleware` 적용
- [x] 전역 에러 미들웨어 마지막 등록 확인
- [x] `npm run dev` 실행 후 서버 정상 시작 확인

---

### BE-23: 백엔드 단위 테스트

**의존**: BE-11~BE-21

**완료 조건:**

- [x] `tests/unit/services/` 아래 서비스별 테스트 파일 작성
  - `auth.service.test.js` — 회원가입/로그인 성공·실패
  - `todo.service.test.js` — CRUD, 소유권(BR-T-03), 완료처리(BR-T-04/05)
  - `category.service.test.js` — 생성, 이름 중복(BR-C-04)
  - `user.service.test.js` — 프로필 조회/수정
- [x] `npm test` 실행 시 모든 단위 테스트 통과

---

### BE-24: 백엔드 통합 테스트

**의존**: BE-22

**완료 조건:**

- [x] `tests/integration/` 아래 API 엔드포인트 전체 통합 테스트 작성 (Supertest)
- [x] 모든 인증 필요 엔드포인트 401 테스트
- [x] 소유권 검증 403 테스트
- [x] `npm test` 실행 시 모든 통합 테스트 통과

---

## 4. 프론트엔드 (FE)

### FE-01: React 프로젝트 초기화

**의존**: 없음

**완료 조건:**

- [x] Vite + React 19 + TypeScript 프로젝트 초기화
- [x] 필수 패키지 설치: `react-router-dom`, `zustand`, `@tanstack/react-query`
- [x] `tsconfig.json` — strict mode 활성화
- [x] ESLint + Prettier 설정

---

### FE-02: 프론트엔드 디렉토리 구조 생성

**의존**: FE-01

**완료 조건:**

- [x] Feature-based 디렉토리 생성:
  ```
  src/
  ├── pages/
  ├── features/
  │   ├── auth/
  │   ├── todo/
  │   ├── category/
  │   └── user/
  ├── components/
  ├── stores/
  ├── api/
  ├── utils/
  ├── constants/
  └── types/
  ```

---

### FE-03: Zustand authStore 구현

**의존**: FE-01

**완료 조건:**

- [x] `src/stores/authStore.ts` 구현
  ```typescript
  interface AuthState {
    accessToken: string | null;
    userId: string | null;
    setAuth: (token: string, userId: string) => void;
    clearAuth: () => void;
  }
  ```
- [x] localStorage/sessionStorage/Cookie **미사용** 확인 (메모리만)
- [x] `setAuth`, `clearAuth` 동작 테스트

---

### FE-04: Zustand filterStore 구현 (BR-F-01~F-04)

**의존**: FE-01

**완료 조건:**

- [x] `src/stores/filterStore.ts` 구현
  ```typescript
  interface FilterState {
    categoryId: string | null;
    isCompleted: boolean | null;
    overdue: boolean | null;
    setFilter: (filter: Partial<FilterState>) => void;
    resetFilter: () => void;
  }
  ```
- [x] `setFilter`, `resetFilter` 동작 테스트

---

### FE-05: TanStack Query 설정

**의존**: FE-01

**완료 조건:**

- [x] `App.tsx`에 `QueryClientProvider` 감싸기
- [x] `src/constants/queryKeys.constants.ts` 생성 — QUERY_KEYS 중앙 관리
  ```typescript
  QUERY_KEYS = {
    todos: { all: ["todos"], filtered: (f) => ["todos", f] },
    categories: { all: ["categories"] },
    user: { me: ["user", "me"] },
  };
  ```
- [x] 기본 staleTime, retry 정책 설정

---

### FE-06: API 클라이언트 설정

**의존**: FE-01, FE-03

**완료 조건:**

- [x] `src/api/client.ts` 구현
  - BaseURL: `VITE_API_BASE_URL` 환경변수
  - 요청 인터셉터: `Authorization: Bearer <token>` 자동 첨부 (authStore에서 읽기)
  - 응답 인터셉터: 401 수신 시 `authStore.clearAuth()` + `/login` 리다이렉트
- [x] `ApiError` 타입 정의

---

### FE-07: 공통 타입 정의

**의존**: FE-02

**완료 조건:**

- [x] `src/types/api.types.ts` — 공통 Response/Error 타입
- [x] `src/features/auth/auth.types.ts` — User, LoginRequest, RegisterRequest, AuthResponse
- [x] `src/features/todo/todo.types.ts` — Todo, CreateTodoRequest, UpdateTodoRequest, TodoFilters
- [x] `src/features/category/category.types.ts` — Category, CreateCategoryRequest
- [x] `src/features/user/user.types.ts` — UserProfile, UpdateUserRequest

---

### FE-08: React Router 설정

**의존**: FE-01, FE-03

**완료 조건:**

- [x] 라우트 구성:
  - `/login` (PublicRoute)
  - `/register` (PublicRoute)
  - `/` (PrivateRoute)
  - `/profile` (PrivateRoute)
- [x] `PrivateRoute` — accessToken 없으면 `/login` 리다이렉트
- [x] `PublicRoute` — accessToken 있으면 `/` 리다이렉트

---

### FE-09: API 호출 함수 구현

**의존**: FE-06, FE-07

**완료 조건:**

- [x] `src/api/auth.api.ts` — `register()`, `login()`
- [x] `src/api/todo.api.ts` — `getTodos(filters?)`, `createTodo()`, `updateTodo()`, `deleteTodo()`, `toggleTodoComplete()`
- [x] `src/api/category.api.ts` — `getCategories()`, `createCategory()`
- [x] `src/api/user.api.ts` — `getMe()`, `updateProfile()`
- [x] 모든 함수 TypeScript 타입 안전성 확보

---

### FE-10: 인증 Hooks 구현

**의존**: FE-03, FE-05, FE-09

**완료 조건:**

- [x] `useRegister()` — mutation, 성공 시 `/login` 리다이렉트
- [x] `useLogin()` — mutation, 성공 시 authStore.setAuth() + `/` 리다이렉트
- [x] 에러 시 에러 메시지 반환

---

### FE-11: 할일 Hooks 구현

**의존**: FE-04, FE-05, FE-09

**완료 조건:**

- [x] `useTodos()` — filterStore 구독, 필터 변경 시 자동 재쿼리
- [x] `useCreateTodo()` — 성공 시 `QUERY_KEYS.todos.all` 무효화
- [x] `useUpdateTodo()` — 성공 시 캐시 무효화
- [x] `useDeleteTodo()` — 성공 시 캐시 무효화
- [x] `useToggleTodoComplete()` — 낙관적 업데이트 구현

---

### FE-12: 카테고리 Hooks 구현

**의존**: FE-05, FE-09

**완료 조건:**

- [x] `useCategories()` — staleTime 60초, 인증 상태 시 활성화
- [x] `useCreateCategory()` — 성공 시 `QUERY_KEYS.categories.all` 무효화, 중복 이름 에러 핸들링 (BR-C-04)

---

### FE-13: 사용자 Hooks 구현

**의존**: FE-05, FE-09

**완료 조건:**

- [x] `useUpdateProfile()` — 이름/비밀번호 수정 mutation, 성공 시 `QUERY_KEYS.user.me` 무효화

---

### FE-14: 공통 UI 컴포넌트

**의존**: FE-01

**완료 조건:**

- [x] `Button.tsx` — variant (primary, secondary, danger), disabled, loading 상태
- [x] `Input.tsx` — type, error 상태, label 연결
- [x] `ErrorMessage.tsx` — 에러 메시지 표시 (빨강)
- [x] `EmptyState.tsx` — 필터 결과 없을 때 표시
- [x] 접근성: label-input 연결, aria-label 속성

---

### FE-15: 레이아웃 컴포넌트 (반응형)

**의존**: FE-03, FE-14

**완료 조건:**

- [x] `Layout.tsx` 구현
  - Desktop (≥768px): 좌측 사이드바 + 우측 콘텐츠
  - Mobile (<768px): 전체 폭 콘텐츠
- [x] `Header.tsx` — 사용자명 표시, 로그아웃 버튼, 프로필 링크
- [x] 로그아웃: `authStore.clearAuth()` + `/login` 리다이렉트

---

### FE-16: 유틸리티 함수 구현

**의존**: FE-01

**완료 조건:**

- [x] `src/utils/date.utils.ts`
  - `isOverdue(dueDate): boolean`
  - `isValidFutureDate(dateString): boolean` (BR-T-06)
  - `formatDate(date): string`
- [x] `src/utils/validation.utils.ts`
  - `validateEmail()`, `validatePassword()`, `validatePasswordMatch()`
  - `validateTodoTitle()`, `validateCategoryName()`
- [x] `src/utils/error.utils.ts` — API 에러 코드 → 사용자 친화적 메시지 매핑

---

### FE-17: 로그인 페이지

**의존**: FE-08, FE-10, FE-14, FE-16

**완료 조건:**

- [x] `LoginPage.tsx` + `LoginForm.tsx` 구현
- [x] 폼 유효성 검증: email 형식, password 필수
- [x] 제출: `useLogin()` 호출
- [x] 성공: `/` 리다이렉트
- [x] 실패: 단일 에러 메시지 (계정 존재 여부 노출 금지)
- [x] 로딩 중 버튼 disabled
- [x] 회원가입 링크 (`/register`)

---

### FE-18: 회원가입 페이지

**의존**: FE-08, FE-10, FE-14, FE-16

**완료 조건:**

- [x] `RegisterPage.tsx` + `RegisterForm.tsx` 구현
- [x] 폼 유효성 검증: email 형식, password 8자↑, 비밀번호 확인 일치, name 필수
- [x] 제출: `useRegister()` 호출
- [x] 성공: `/login` 리다이렉트 + 안내 메시지
- [x] 실패: 이메일 중복 오류 메시지
- [x] 로그인 링크 (`/login`)

---

### FE-19: 카테고리 사이드바

**의존**: FE-04, FE-12, FE-14

**완료 조건:**

- [x] `CategoryList.tsx` 구현 — 기본/사용자 정의 카테고리 구분 표시
- [x] 클릭 시 `filterStore.setFilter({ category_id })` 호출
- [x] "전체" 선택: `filterStore.setFilter({ category_id: null })`
- [x] 선택된 카테고리 하이라이트
- [x] `AddCategoryForm.tsx` — 이름 입력, `useCreateCategory()` 호출, 중복 에러 메시지

---

### FE-20: 필터 바

**의존**: FE-04, FE-14

**완료 조건:**

- [x] `FilterBar.tsx` 구현
  - 카테고리 드롭다운 (BR-F-01)
  - 기간 종료 여부 드롭다운 (BR-F-02): 전체/기간내/기간초과
  - 완료 여부 드롭다운 (BR-F-03): 전체/완료/미완료
- [x] 각 필터 변경 시 `filterStore.setFilter()` 호출
- [x] 필터 초기화 버튼: `filterStore.resetFilter()`

---

### FE-21: 할일 카드 컴포넌트

**의존**: FE-11, FE-14, FE-16

**완료 조건:**

- [x] `TodoCard.tsx` 구현
  - 체크박스 (완료 토글 — `useToggleTodoComplete()`)
  - 제목 (완료 시 취소선)
  - 카테고리 배지
  - 종료예정일 (기간초과 시 빨강)
  - 수정 버튼, 삭제 버튼
- [x] 삭제: 확인 팝업 후 `useDeleteTodo()` 호출

---

### FE-22: 할일 폼 (생성/수정)

**의존**: FE-11, FE-12, FE-14, FE-16

**완료 조건:**

- [x] `TodoForm.tsx` — 생성/수정 모드 겸용 (id props 여부로 분기)
- [x] 필수 입력: title, category_id
- [x] 선택 입력: description, due_date
- [x] `due_date`: 오늘 이후 검증 (BR-T-06), 과거 날짜 입력 시 에러 메시지
- [x] `CreateTodoForm.tsx` — 버튼 + 모달/인라인 폼
- [x] `EditTodoForm.tsx` — 기존 값 초기화 (prepopulate)

---

### FE-23: 할일 목록 페이지

**의존**: FE-08, FE-11, FE-15, FE-19, FE-20, FE-21, FE-22

**완료 조건:**

- [x] `TodoListPage.tsx` 구현 — Layout 적용
- [x] `TodoList.tsx` — `useTodos()` 결과 렌더링, 로딩/에러/빈 상태 표시
- [x] 필터 변경 시 자동 목록 갱신 확인

---

### FE-24: 프로필 페이지

**의존**: FE-08, FE-13, FE-14, FE-15

**완료 조건:**

- [x] `ProfilePage.tsx` + `ProfileForm.tsx` 구현
- [x] 이메일: 읽기 전용 표시 (BR-U-04)
- [x] 이름 변경 폼: `useUpdateProfile()` 호출
- [x] 비밀번호 변경 폼: 현재 비밀번호 필수, 신규 8자↑, 확인 일치
- [x] 현재 비밀번호 불일치 시 에러 메시지

---

### FE-25: API 에러 처리

**의존**: FE-06, FE-16

**완료 조건:**

- [x] 네트워크 에러 → "네트워크 연결을 확인해주세요"
- [x] 400 → 필드별 에러 메시지 표시
- [x] 401 → 자동 로그아웃 + `/login` 이동
- [x] 403 → "접근 권한이 없습니다"
- [x] 5xx → "서버 오류가 발생했습니다"

---

### FE-26: 반응형 및 스타일 검증

**의존**: FE-15, FE-23

**완료 조건:**

- [x] Desktop (≥768px): 사이드바 + 콘텐츠 레이아웃 확인
- [x] Mobile (<768px): 전체 폭 콘텐츠 레이아웃 확인
- [x] 터치 UX: 버튼 최소 크기 44px 확인
- [x] 글로벌 스타일 및 CSS 변수 정의 완료

---

### FE-27: 사용자 시나리오 통합 검증

**의존**: FE-23, FE-24

**완료 조건:**

- [ ] **시나리오 A (김지수)**: 회원가입 → 로그인 → 할일 등록 → 완료처리 → 수정 Happy Path 통과
- [ ] **시나리오 B (박성훈)**: 사용자 정의 카테고리 생성 → 3중 필터(카테고리+기간초과+미완료) AND 조건 동작 확인
- [ ] **시나리오 C (이미경)**: 할일 일괄 등록 → 완료/미완료 필터 → due_date 수정(과거 날짜 거부) → 비밀번호 변경

---

### FE-28: 보안 검증

**의존**: FE-03, FE-17, FE-18, FE-22

**완료 조건:**

- [ ] Zustand authStore에만 토큰 저장 (localStorage/sessionStorage/Cookie 미사용 확인)
- [ ] 페이지 새로고침 시 토큰 초기화 → `/login` 리다이렉트 확인 (의도된 동작)
- [ ] 클라이언트 입력 검증 모두 작동 확인
- [ ] 서버 에러 메시지 적절히 표시 확인

---

## 5. 전체 Task 의존성 다이어그램

```mermaid
flowchart TD
    subgraph DB["데이터베이스 (DB)"]
        DB01["DB-01: PG 환경 설정"]
        DB02["DB-02: 환경변수 파일"]
        DB03["DB-03: 스키마 마이그레이션"]
        DB04["DB-04: 시드 데이터 검증"]
        DB05["DB-05: Connection Pool"]
        DB06["DB-06: 환경변수 검증 모듈"]
        DB07["DB-07: DB 연결 테스트"]
        DB08["DB-08: User Repository"]
        DB09["DB-09: Category Repository"]
        DB10["DB-10: Todo Repository"]
        DB11["DB-11: 인덱스 성능 검증"]

        DB01 --> DB02 --> DB03 --> DB04
        DB02 --> DB05 --> DB07
        DB02 --> DB06
        DB03 --> DB05
        DB05 --> DB08 & DB09 & DB10
        DB08 & DB09 & DB10 --> DB11
    end

    subgraph BE["백엔드 (BE)"]
        BE01["BE-01: 프로젝트 초기화"]
        BE02["BE-02: 디렉토리 구조"]
        BE03["BE-03: Express 앱 설정"]
        BE04["BE-04: JWT 유틸"]
        BE05["BE-05: 비밀번호 유틸"]
        BE06["BE-06: 인증 미들웨어"]
        BE07["BE-07: 에러 미들웨어"]
        BE08["BE-08: 입력 검증 미들웨어"]
        BE09["BE-09: 날짜 유틸"]
        BE10["BE-10: TypeScript 타입"]
        BE11~21["BE-11~21: API 엔드포인트"]
        BE22["BE-22: 라우터 통합"]
        BE23["BE-23: 단위 테스트"]
        BE24["BE-24: 통합 테스트"]

        BE01 --> BE02 --> BE03
        BE01 --> BE04 & BE05 & BE09 & BE10
        BE04 --> BE06
        BE02 --> BE07 & BE08
        BE03 & BE06 & BE07 & BE08 & BE10 --> BE11~21
        DB08 & DB09 & DB10 --> BE11~21
        BE11~21 --> BE22 --> BE23 & BE24
    end

    subgraph FE["프론트엔드 (FE)"]
        FE01["FE-01: 프로젝트 초기화"]
        FE02["FE-02: 디렉토리 구조"]
        FE03["FE-03: authStore"]
        FE04["FE-04: filterStore"]
        FE05["FE-05: TanStack Query"]
        FE06["FE-06: API 클라이언트"]
        FE07["FE-07: 타입 정의"]
        FE08["FE-08: React Router"]
        FE09["FE-09: API 호출 함수"]
        FE10~13["FE-10~13: Hooks"]
        FE14["FE-14: 공통 UI 컴포넌트"]
        FE15["FE-15: 레이아웃"]
        FE16["FE-16: 유틸리티"]
        FE17~24["FE-17~24: 페이지 & 기능"]
        FE25["FE-25: API 에러 처리"]
        FE26["FE-26: 반응형 검증"]
        FE27["FE-27: 시나리오 검증"]
        FE28["FE-28: 보안 검증"]

        FE01 --> FE02 & FE03 & FE04 & FE05 & FE14 & FE16
        FE03 --> FE06 & FE08
        FE05 & FE06 & FE07 --> FE09 --> FE10~13
        FE03 & FE04 & FE05 & FE10~13 & FE14 & FE15 --> FE17~24
        FE17~24 --> FE25 & FE26 & FE27 & FE28
    end

    BE22 -.->|"API 서버 실행"| FE06
```

---

## 6. 3일 개발 일정

### Day 1 — 데이터베이스 + 백엔드 기초

| 시간 | 작업                                                    |
| ---- | ------------------------------------------------------- |
| 오전 | DB-01~07 (DB 환경 설정, 스키마 마이그레이션, Pool 설정) |
| 오후 | BE-01~10 (프로젝트 초기화, 유틸리티, 미들웨어)          |
| 저녁 | DB-08~10 (Repository 구현), BE-11~12 (인증 API)         |

### Day 2 — 백엔드 API + 프론트엔드 기초

| 시간 | 작업                                              |
| ---- | ------------------------------------------------- |
| 오전 | BE-13~21 (사용자/카테고리/할일 API)               |
| 오후 | FE-01~09 (프로젝트 초기화, Store, API 클라이언트) |
| 저녁 | FE-10~18 (Hooks, 공통 컴포넌트, 인증 페이지)      |

### Day 3 — 프론트엔드 기능 + 검증

| 시간 | 작업                                                  |
| ---- | ----------------------------------------------------- |
| 오전 | FE-19~22 (카테고리, 필터, 할일 컴포넌트)              |
| 오후 | FE-23~25 (메인 페이지, 프로필, 에러 처리)             |
| 저녁 | BE-22~24 (통합 테스트), FE-26~28 (시나리오/보안 검증) |

---

## 7. 비즈니스 규칙 구현 매핑

| BR ID   | 규칙 요약                             | 구현 위치                          | Task                |
| ------- | ------------------------------------- | ---------------------------------- | ------------------- |
| BR-U-01 | 이메일 전체 고유                      | DB UNIQUE 제약 + BE Service        | DB-03, BE-11        |
| BR-U-02 | 비밀번호 bcrypt 해시                  | BE Util                            | BE-05, BE-11, BE-14 |
| BR-U-03 | 인증 필수 API                         | BE Middleware                      | BE-06               |
| BR-U-04 | 이메일 변경 불가                      | BE Service                         | BE-14, FE-24        |
| BR-T-01 | 할일 카테고리 필수                    | DB NOT NULL + BE Middleware        | DB-03, BE-08, BE-17 |
| BR-T-02 | 할일 제목 필수                        | DB NOT NULL + BE Middleware        | DB-03, BE-08, BE-17 |
| BR-T-03 | 할일 소유권 검증 (403)                | BE Service                         | BE-19, BE-20, BE-21 |
| BR-T-04 | 완료 시 completed_at 기록             | BE Service + Repository            | BE-20, DB-10        |
| BR-T-05 | 미완료 시 completed_at NULL           | BE Service + Repository            | BE-20, DB-10        |
| BR-T-06 | due_date 오늘 이후                    | BE Middleware + FE Form            | BE-08, FE-22        |
| BR-C-01 | 기본 카테고리 수정/삭제 불가          | BE Service                         | BE-16               |
| BR-C-02 | 사용자 정의 카테고리 소유권           | BE Service                         | BE-16, BE-17        |
| BR-C-03 | 할일 있는 카테고리 삭제 불가          | DB ON DELETE RESTRICT              | DB-03               |
| BR-C-04 | 카테고리 이름 중복 불가 (동일 사용자) | DB 부분 유니크 인덱스 + BE Service | DB-03, BE-16        |
| BR-F-01 | 카테고리 필터                         | BE Repository (동적 SQL)           | DB-10, BE-18        |
| BR-F-02 | 기간 초과 필터                        | BE Repository (동적 SQL)           | DB-10, BE-18        |
| BR-F-03 | 완료 여부 필터                        | BE Repository (동적 SQL)           | DB-10, BE-18        |
| BR-F-04 | 복수 필터 AND 조건                    | BE Repository (동적 SQL)           | DB-10, BE-18        |

---

_본 문서는 TodoListApp의 전체 구현 작업을 Task 단위로 분해한 실행 계획서이다. 개발 진행에 따라 Task 완료 여부를 체크박스로 추적하고, 변경 사항이 있을 경우 변경 이력에 기록한다._
