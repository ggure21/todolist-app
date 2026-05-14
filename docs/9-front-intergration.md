# TodoListApp 프론트엔드 통합 가이드

- 버전: 1.0.0
- 작성일: 2026-05-14
- 참조 문서:
  - [PRD v1.4.0](./2-prd.md)
  - [프로젝트 설계 원칙 v1.1.0](./4-project-principles.md)

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2026-05-14 | Backend Developer | 최초 작성 |

---

## 목차

1. [연결 정보](#1-연결-정보)
2. [인증 전략](#2-인증-전략)
3. [API 클라이언트 설정](#3-api-클라이언트-설정)
4. [공통 타입 정의](#4-공통-타입-정의)
5. [엔드포인트 상세](#5-엔드포인트-상세)
6. [에러 처리](#6-에러-처리)
7. [필터링 및 쿼리 파라미터](#7-필터링-및-쿼리-파라미터)
8. [Zustand Store 설계](#8-zustand-store-설계)
9. [TanStack Query 연동 패턴](#9-tanstack-query-연동-패턴)
10. [라우팅 구조](#10-라우팅-구조)
11. [필드 네이밍 규칙](#11-필드-네이밍-규칙)
12. [보안 제약](#12-보안-제약)

---

## 1. 연결 정보

| 항목 | 값 |
|------|-----|
| 개발 서버 Base URL | `http://localhost:3000` |
| API prefix | `/api` |
| Swagger UI | `http://localhost:3000/api-docs` |
| Content-Type | `application/json` |
| 인증 방식 | `Authorization: Bearer <JWT Access Token>` |

### 환경변수 (.env 프론트엔드)

```
VITE_API_BASE_URL=http://localhost:3000
```

---

## 2. 인증 전략

### 2.1 토큰 저장 위치 — 절대 준수 사항

JWT Access Token은 **Zustand `authStore`의 메모리에만 저장**한다.

| 저장 위치 | 허용 여부 |
|-----------|-----------|
| Zustand `authStore` (메모리) | ✅ 허용 |
| `localStorage` | ❌ 절대 금지 |
| `sessionStorage` | ❌ 절대 금지 |
| `httpOnly Cookie` | ❌ 절대 금지 |

> **주의**: 페이지 새로고침 시 토큰이 초기화되어 재로그인이 필요하다. 소규모 프로젝트 범위에서 허용하는 트레이드오프이다.

### 2.2 토큰 생명주기

```
로그인 성공
    → authStore.setAuth(accessToken, userId) 호출
    → 이후 모든 인증 필요 API 요청에 헤더 자동 첨부

401 응답 수신
    → authStore.clearAuth() 호출
    → /login 으로 리다이렉트

페이지 새로고침
    → authStore 초기화 (메모리 휘발)
    → 인증 필요 라우트 접근 시 /login 으로 리다이렉트
```

### 2.3 JWT 페이로드 구조

서버가 서명한 JWT에는 다음이 포함된다.

```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "iat": 1747136000,
  "exp": 1747222400
}
```

- 만료 시간: 발급 후 24시간 (`JWT_EXPIRES_IN=24h`)
- 1차 MVP에서는 만료 시 재로그인 유도. Refresh Token 미제공.

---

## 3. API 클라이언트 설정

### 3.1 `src/api/client.ts` 권장 구현

```typescript
import { useAuthStore } from '../stores/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';
    throw new Error('UNAUTHORIZED');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error', code: 'UNKNOWN' }));
    throw new ApiError(res.status, error.message, error.code);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
```

---

## 4. 공통 타입 정의

### 4.1 `src/types/api.types.ts`

```typescript
export interface ApiErrorBody {
  message: string;
  code: string;
}

export interface MessageResponse {
  message: string;
}
```

### 4.2 도메인 타입

#### `src/features/auth/auth.types.ts`

```typescript
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  accessToken: string;
}
```

#### `src/features/user/user.types.ts`

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;   // ISO 8601
  updated_at: string;   // ISO 8601
}

export interface UpdateUserRequest {
  name?: string;
  current_password?: string;
  new_password?: string;
}
```

#### `src/features/category/category.types.ts`

```typescript
export interface Category {
  id: string;
  user_id: string | null;  // null이면 시스템 기본 카테고리
  name: string;
  is_default: boolean;
  created_at: string;      // ISO 8601
}

export interface CreateCategoryRequest {
  name: string;
}
```

#### `src/features/todo/todo.types.ts`

```typescript
export interface Todo {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string | null;
  due_date: string | null;   // YYYY-MM-DD
  is_completed: boolean;
  completed_at: string | null;  // ISO 8601
  created_at: string;
  updated_at: string;
}

export interface CreateTodoRequest {
  title: string;
  category_id: string;
  description?: string | null;
  due_date?: string | null;    // YYYY-MM-DD, 오늘 이후 날짜만 허용
}

export interface UpdateTodoRequest {
  title?: string;
  category_id?: string;
  description?: string | null;
  due_date?: string | null;    // null 전달 시 종료예정일 제거
}

export interface ToggleCompleteRequest {
  is_completed: boolean;
}

export interface TodoFilters {
  category_id?: string;
  is_completed?: boolean;
  overdue?: boolean;
}
```

---

## 5. 엔드포인트 상세

### 5.1 Authentication — 인증 불필요

#### `POST /api/auth/register` — 회원가입

```typescript
// src/api/auth.api.ts
export async function register(body: RegisterRequest): Promise<MessageResponse> {
  return api.post('/api/auth/register', body);
}
```

| 항목 | 내용 |
|------|------|
| 성공 응답 | `201 Created` → `{ "message": "회원가입이 완료되었습니다." }` |
| 이메일 중복 | `400` → `code: EMAIL_DUPLICATE` |
| 이메일 형식 오류 | `400` → `code: VALIDATION_ERROR` |
| 비밀번호 8자 미만 | `400` → `code: VALIDATION_ERROR` |

---

#### `POST /api/auth/login` — 로그인

```typescript
export async function login(body: LoginRequest): Promise<LoginResponse> {
  return api.post('/api/auth/login', body);
}
```

| 항목 | 내용 |
|------|------|
| 성공 응답 | `200 OK` → `{ "accessToken": "eyJ..." }` |
| 인증 실패 | `401` → `code: INVALID_CREDENTIALS` (이메일 미존재/비밀번호 불일치 동일 메시지) |

로그인 성공 후 반드시 `authStore.setAuth(accessToken, userId)` 를 호출한다. `userId`는 JWT 페이로드를 디코딩하거나 직후 `GET /api/users/me`를 호출하여 확보한다.

---

### 5.2 Users — 인증 필요

#### `GET /api/users/me` — 내 정보 조회

```typescript
// src/api/user.api.ts
export async function getMe(): Promise<User> {
  return api.get('/api/users/me');
}
```

| 항목 | 내용 |
|------|------|
| 성공 응답 | `200 OK` → `User` 객체 (`password` 미포함) |
| 인증 실패 | `401` |

---

#### `PATCH /api/users/me` — 내 정보 수정

```typescript
export async function updateMe(body: UpdateUserRequest): Promise<User> {
  return api.patch('/api/users/me', body);
}
```

| 항목 | 내용 |
|------|------|
| 성공 응답 | `200 OK` → 수정된 `User` 객체 |
| 이메일 변경 시도 | `400` → `code: EMAIL_CHANGE_NOT_ALLOWED` |
| 현재 비밀번호 불일치 | `400` → `code: WRONG_CURRENT_PASSWORD` |
| 인증 실패 | `401` |

비밀번호 변경 시 `current_password`와 `new_password`를 반드시 함께 전달해야 한다.

---

### 5.3 Categories — 인증 필요

#### `GET /api/categories` — 카테고리 목록 조회

```typescript
// src/api/category.api.ts
export async function getCategories(): Promise<Category[]> {
  return api.get('/api/categories');
}
```

| 항목 | 내용 |
|------|------|
| 성공 응답 | `200 OK` → `Category[]` (기본 카테고리 3개 + 본인 생성 카테고리) |
| 인증 실패 | `401` |

기본 카테고리 (`is_default: true`)는 `user_id`가 `null`이다.

---

#### `POST /api/categories` — 카테고리 생성

```typescript
export async function createCategory(body: CreateCategoryRequest): Promise<Category> {
  return api.post('/api/categories', body);
}
```

| 항목 | 내용 |
|------|------|
| 성공 응답 | `201 Created` → 생성된 `Category` 객체 |
| 이름 중복 | `400` → `code: CATEGORY_NAME_DUPLICATE` |
| 인증 실패 | `401` |

---

#### `DELETE /api/categories/:id` — 카테고리 삭제

```typescript
export async function deleteCategory(id: string): Promise<void> {
  return api.delete(`/api/categories/${id}`);
}
```

| 항목 | 내용 |
|------|------|
| 성공 응답 | `204 No Content` (body 없음) |
| 기본 카테고리 삭제 시도 | `400` → `code: DEFAULT_CATEGORY_DELETE_NOT_ALLOWED` |
| 할일이 있는 카테고리 삭제 시도 | `400` → `code: CATEGORY_HAS_TODOS` |
| 타인 소유 카테고리 | `403` → `code: FORBIDDEN` |
| 카테고리 미존재 | `404` → `code: CATEGORY_NOT_FOUND` |
| 인증 실패 | `401` |

`204 No Content` 응답이므로 응답 body 파싱을 시도하지 않는다.

---

### 5.4 Todos — 인증 필요

#### `GET /api/todos` — 할일 목록 조회

```typescript
// src/api/todo.api.ts
export async function getTodos(filters: TodoFilters = {}): Promise<Todo[]> {
  const params = new URLSearchParams();
  if (filters.category_id !== undefined) params.set('category_id', filters.category_id);
  if (filters.is_completed !== undefined) params.set('is_completed', String(filters.is_completed));
  if (filters.overdue !== undefined) params.set('overdue', String(filters.overdue));

  const query = params.toString();
  return api.get(`/api/todos${query ? `?${query}` : ''}`);
}
```

| 항목 | 내용 |
|------|------|
| 성공 응답 | `200 OK` → `Todo[]` (`created_at` 내림차순 정렬) |
| 결과 없음 | `200 OK` → `[]` |
| 인증 실패 | `401` |

---

#### `POST /api/todos` — 할일 생성

```typescript
export async function createTodo(body: CreateTodoRequest): Promise<Todo> {
  return api.post('/api/todos', body);
}
```

| 항목 | 내용 |
|------|------|
| 성공 응답 | `201 Created` → 생성된 `Todo` 객체 |
| 제목 누락 | `400` → `code: VALIDATION_ERROR` |
| 카테고리 누락 | `400` → `code: VALIDATION_ERROR` |
| 과거 날짜 입력 | `400` → `code: INVALID_DUE_DATE` |
| 카테고리 접근 권한 없음 | `403` → `code: CATEGORY_ACCESS_FORBIDDEN` |
| 인증 실패 | `401` |

---

#### `PATCH /api/todos/:id` — 할일 수정

```typescript
export async function updateTodo(id: string, body: UpdateTodoRequest): Promise<Todo> {
  return api.patch(`/api/todos/${id}`, body);
}
```

| 항목 | 내용 |
|------|------|
| 성공 응답 | `200 OK` → 수정된 `Todo` 객체 |
| 과거 날짜 입력 | `400` → `code: INVALID_DUE_DATE` |
| 타인 소유 할일 | `403` → `code: FORBIDDEN` |
| 할일 미존재 | `404` → `code: TODO_NOT_FOUND` |
| 인증 실패 | `401` |

변경할 필드만 포함하여 전송한다. `due_date: null` 전달 시 종료예정일이 제거된다.

---

#### `DELETE /api/todos/:id` — 할일 삭제

```typescript
export async function deleteTodo(id: string): Promise<MessageResponse> {
  return api.delete(`/api/todos/${id}`);
}
```

| 항목 | 내용 |
|------|------|
| 성공 응답 | `200 OK` → `{ "message": "할일이 삭제되었습니다." }` |
| 타인 소유 할일 | `403` → `code: FORBIDDEN` |
| 할일 미존재 | `404` → `code: TODO_NOT_FOUND` |
| 인증 실패 | `401` |

영구 삭제이며 복구 불가능하다. 소프트 삭제 없음.

---

#### `PATCH /api/todos/:id/complete` — 완료/미완료 처리

```typescript
export async function toggleTodoComplete(
  id: string,
  body: ToggleCompleteRequest,
): Promise<Todo> {
  return api.patch(`/api/todos/${id}/complete`, body);
}
```

| 항목 | 내용 |
|------|------|
| 성공 응답 | `200 OK` → 업데이트된 `Todo` 객체 |
| `is_completed: true` | `completed_at`에 현재 일시 자동 기록 (BR-T-04) |
| `is_completed: false` | `completed_at`이 `null`로 초기화 (BR-T-05) |
| 타인 소유 할일 | `403` → `code: FORBIDDEN` |
| 인증 실패 | `401` |

---

## 6. 에러 처리

### 6.1 에러 응답 형식

모든 에러 응답은 아래 형식으로 반환된다.

```json
{
  "message": "사용자에게 표시할 에러 메시지",
  "code": "BUSINESS_ERROR_CODE"
}
```

### 6.2 에러 코드 전체 목록

| code | HTTP 상태 | 설명 |
|------|-----------|------|
| `VALIDATION_ERROR` | 400 | 입력값 형식 오류 또는 필수값 누락 |
| `INVALID_DUE_DATE` | 400 | 과거 날짜 입력 (BR-T-06) |
| `EMAIL_DUPLICATE` | 400 | 이메일 중복 (BR-U-01) |
| `EMAIL_CHANGE_NOT_ALLOWED` | 400 | 이메일 변경 시도 (BR-U-04) |
| `WRONG_CURRENT_PASSWORD` | 400 | 현재 비밀번호 불일치 |
| `CATEGORY_NAME_DUPLICATE` | 400 | 카테고리 이름 중복 (BR-C-04) |
| `DEFAULT_CATEGORY_DELETE_NOT_ALLOWED` | 400 | 기본 카테고리 삭제 시도 (BR-C-01) |
| `CATEGORY_HAS_TODOS` | 400 | 할일이 있는 카테고리 삭제 시도 (BR-C-03) |
| `INVALID_CREDENTIALS` | 401 | 이메일/비밀번호 불일치 |
| `TOKEN_MISSING` | 401 | Authorization 헤더 없음 |
| `TOKEN_EXPIRED` | 401 | JWT 만료 |
| `FORBIDDEN` | 403 | 타인 소유 리소스 접근 (BR-T-03) |
| `CATEGORY_ACCESS_FORBIDDEN` | 403 | 카테고리 접근 권한 없음 (BR-C-02) |
| `TODO_NOT_FOUND` | 404 | 할일 미존재 |
| `CATEGORY_NOT_FOUND` | 404 | 카테고리 미존재 |
| `NOT_FOUND` | 404 | 등록되지 않은 경로 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

### 6.3 UI 에러 처리 지침

- **401**: 자동으로 `authStore.clearAuth()` 후 `/login` 리다이렉트 (API 클라이언트에서 일괄 처리)
- **400 (VALIDATION_ERROR)**: `error.message`를 해당 폼 필드 하단에 표시
- **403**: "권한이 없습니다" 토스트 메시지 표시
- **404**: 목록에서 해당 항목 제거 후 TanStack Query 캐시 무효화
- **500**: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." 표시

---

## 7. 필터링 및 쿼리 파라미터

`GET /api/todos`에서 쿼리 파라미터로 필터를 적용한다. 복수 필터는 AND 조건으로 동작한다 (BR-F-04).

| 파라미터 | 타입 | 예시 | 설명 |
|----------|------|------|------|
| `category_id` | UUID string | `?category_id=00000000-...` | 특정 카테고리 필터 (BR-F-01) |
| `is_completed` | `"true"` / `"false"` | `?is_completed=false` | 완료 여부 필터 (BR-F-03) |
| `overdue` | `"true"` / `"false"` | `?overdue=true` | 기간 초과 필터 (BR-F-02) |

파라미터를 생략하면 해당 조건이 적용되지 않는다 (전체 조회).

---

## 8. Zustand Store 설계

### 8.1 `src/stores/authStore.ts`

```typescript
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, userId: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userId: null,
  isAuthenticated: false,
  setAuth: (token, userId) =>
    set({ accessToken: token, userId, isAuthenticated: true }),
  clearAuth: () =>
    set({ accessToken: null, userId: null, isAuthenticated: false }),
}));
```

### 8.2 `src/stores/filterStore.ts`

```typescript
import { create } from 'zustand';
import type { TodoFilters } from '../features/todo/todo.types';

interface FilterState extends TodoFilters {
  setFilter: (filter: Partial<TodoFilters>) => void;
  resetFilter: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  category_id: undefined,
  is_completed: undefined,
  overdue: undefined,
  setFilter: (filter) => set((state) => ({ ...state, ...filter })),
  resetFilter: () =>
    set({ category_id: undefined, is_completed: undefined, overdue: undefined }),
}));
```

---

## 9. TanStack Query 연동 패턴

### 9.1 쿼리 키 — `src/constants/queryKeys.constants.ts`

```typescript
import type { TodoFilters } from '../features/todo/todo.types';

export const QUERY_KEYS = {
  todos: {
    all: ['todos'] as const,
    filtered: (filters: TodoFilters) => ['todos', filters] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  user: {
    me: ['user', 'me'] as const,
  },
} as const;
```

### 9.2 할일 목록 조회 훅

```typescript
// src/features/todo/hooks/useTodos.ts
import { useQuery } from '@tanstack/react-query';
import { getTodos } from '../../../api/todo.api';
import { useFilterStore } from '../../../stores/filterStore';
import { QUERY_KEYS } from '../../../constants/queryKeys.constants';

export function useTodos() {
  const filters = useFilterStore((s) => ({
    category_id: s.category_id,
    is_completed: s.is_completed,
    overdue: s.overdue,
  }));

  return useQuery({
    queryKey: QUERY_KEYS.todos.filtered(filters),
    queryFn: () => getTodos(filters),
  });
}
```

### 9.3 할일 등록 뮤테이션 훅

```typescript
// src/features/todo/hooks/useCreateTodo.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTodo } from '../../../api/todo.api';
import { QUERY_KEYS } from '../../../constants/queryKeys.constants';

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos.all });
    },
  });
}
```

### 9.4 완료 토글 훅 (낙관적 업데이트 권장)

```typescript
// src/features/todo/hooks/useToggleTodoComplete.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleTodoComplete } from '../../../api/todo.api';
import { QUERY_KEYS } from '../../../constants/queryKeys.constants';
import type { Todo } from '../todo.types';

export function useToggleTodoComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_completed }: { id: string; is_completed: boolean }) =>
      toggleTodoComplete(id, { is_completed }),
    onMutate: async ({ id, is_completed }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.todos.all });
      const snapshot = queryClient.getQueriesData<Todo[]>({ queryKey: QUERY_KEYS.todos.all });

      queryClient.setQueriesData<Todo[]>({ queryKey: QUERY_KEYS.todos.all }, (old) =>
        old?.map((t) =>
          t.id === id
            ? { ...t, is_completed, completed_at: is_completed ? new Date().toISOString() : null }
            : t,
        ) ?? [],
      );

      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos.all });
    },
  });
}
```

### 9.5 카테고리 목록 (`staleTime` 설정 권장)

```typescript
// src/features/category/hooks/useCategories.ts
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../../api/category.api';
import { QUERY_KEYS } from '../../../constants/queryKeys.constants';

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories.all,
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000, // 5분 — 카테고리는 변경 빈도가 낮음
  });
}
```

---

## 10. 라우팅 구조

| 경로 | 페이지 | 인증 필요 |
|------|--------|-----------|
| `/login` | 로그인 | ❌ |
| `/register` | 회원가입 | ❌ |
| `/` | 할일 목록 (메인) | ✅ |
| `/profile` | 개인 정보 수정 | ✅ |

### 10.1 `PrivateRoute` 컴포넌트 패턴

```typescript
// src/components/PrivateRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
```

```typescript
// src/App.tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/" element={<PrivateRoute><TodoListPage /></PrivateRoute>} />
  <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
</Routes>
```

---

## 11. 필드 네이밍 규칙

API 응답의 모든 필드는 `snake_case`를 사용한다. 프론트엔드에서 `camelCase`로 변환이 필요한 경우 API 클라이언트 계층에서만 일괄 변환한다.

| API 응답 필드 | TypeScript 타입 | 비고 |
|---------------|-----------------|------|
| `user_id` | `string` | UUID |
| `category_id` | `string` | UUID |
| `is_completed` | `boolean` | |
| `is_default` | `boolean` | |
| `due_date` | `string \| null` | `YYYY-MM-DD` 형식 |
| `completed_at` | `string \| null` | ISO 8601 |
| `created_at` | `string` | ISO 8601 |
| `updated_at` | `string` | ISO 8601 |

---

## 12. 보안 제약

### 12.1 절대 금지 사항

1. **JWT Access Token의 `localStorage` / `sessionStorage` / Cookie 저장 금지**
   - 반드시 Zustand `authStore` 메모리에만 보관한다.

2. **비밀번호 평문 로깅 금지**
   - `console.log(password)`, `console.log(formData)` 등 비밀번호가 포함될 수 있는 로그 출력 금지.

3. **XSS 주의**
   - 사용자 입력값(`title`, `description`, `name`)을 `dangerouslySetInnerHTML`로 렌더링하지 않는다.

### 12.2 API 호출 시 주의 사항

- `due_date` 필드는 `YYYY-MM-DD` 형식으로 전달한다. 오늘 날짜 이후 날짜만 허용된다. 클라이언트에서도 선제적으로 검증하여 불필요한 API 호출을 줄인다.
- 카테고리 삭제 전 "할일이 존재하는 카테고리는 삭제할 수 없다"는 점을 UI에서 명시하거나, 삭제 시도 후 `CATEGORY_HAS_TODOS` 에러를 적절히 처리한다.

---

*본 문서는 TodoListApp 백엔드 API와 프론트엔드 연동에 필요한 모든 정보를 담은 통합 가이드이다. 백엔드 변경 시 이 문서를 함께 업데이트한다.*
