# TodoListApp 기술 아키텍처 다이어그램

- 버전: 1.0.0
- 작성일: 2026-05-13
- 참조 문서:
  - [도메인 정의서 v1.0.0](./1-domain-definition.md)
  - [PRD v1.1.0](./2-prd.md)
  - [프로젝트 원칙 v1.0.0](./4-project-principles.md)

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2026-05-13 | Documentation Engineer | 최초 작성: 4개 다이어그램 (전체 구성, 프론트엔드 레이어, 백엔드 레이어, DB 엔티티) |

---

## 1. 전체 시스템 구성도

전체 시스템의 3-tier 아키텍처. 반응형 웹 브라우저에서 Express REST API를 거쳐 PostgreSQL 17에 접근하는 구조입니다.

```mermaid
flowchart LR
    Browser["🌐 반응형 웹 브라우저<br/>(Desktop/Mobile)"]
    
    subgraph Client["클라이언트 계층"]
        Browser
    end
    
    subgraph Auth["인증 흐름"]
        AuthFlow["1. 회원가입 / 로그인<br/>2. JWT 토큰 발급<br/>3. Zustand authStore(메모리)에 저장<br/>4. Authorization Header Bearer Token"]
    end
    
    API["Express REST API<br/>Node.js"]
    
    DB["PostgreSQL 17<br/>pg 라이브러리"]
    
    Client -->|"HTTP/HTTPS<br/>REST API"| Auth
    Auth -->|"Authorization: Bearer {token}"| API
    API -->|"SQL Query<br/>파라미터화된 쿼리"| DB
    
    style Client fill:#e1f5ff
    style API fill:#fff3e0
    style DB fill:#f3e5f5
    style Auth fill:#c8e6c9
```

---

## 2. 프론트엔드 레이어 구조

React 19 + TypeScript 기반의 프론트엔드 계층. Pages에서 시작하여 Features/Components → Hooks (TanStack Query) → API Client → HTTP 순으로 데이터가 흐르고, Zustand Store가 UI 상태와 인증 상태를 관리합니다.

```mermaid
flowchart TD
    Pages["📄 Pages<br/>(라우팅 단위)<br/>LoginPage, RegisterPage,<br/>TodoListPage, ProfilePage"]
    
    Features["⚙️ Features & Components<br/>(기능 단위 UI)"]
    
    Zustand["🎯 Zustand Store<br/>authStore: 인증 상태<br/>filterStore: 필터 UI 상태"]
    
    Hooks["🪝 Hooks<br/>(TanStack Query)<br/>useTodos, useCreateTodo,<br/>useCategories, useAuth"]
    
    APIClient["📡 API Client<br/>fetch 기본 설정<br/>토큰 자동 첨부<br/>401 처리"]
    
    HTTP["🌐 HTTP<br/>REST API 호출<br/>Authorization Header"]
    
    Pages --> Features
    Features --> Zustand
    Features --> Hooks
    Hooks --> APIClient
    APIClient --> HTTP
    
    style Pages fill:#e3f2fd
    style Features fill:#f3e5f5
    style Zustand fill:#c8e6c9
    style Hooks fill:#fff3e0
    style APIClient fill:#ffe0b2
    style HTTP fill:#ffccbc
```

---

## 3. 백엔드 레이어 구조

Express REST API의 레이어드 아키텍처. Routes → Controllers → Services → Repositories → PostgreSQL 순으로 계층화되어 있으며, JWT Auth Middleware와 Error Handler Middleware가 측면에서 요청/응답을 제어합니다.

```mermaid
flowchart TD
    HTTP["🌐 HTTP 요청<br/>Authorization: Bearer {token}"]
    
    Middleware["🔐 미들웨어 계층"]
    AuthMW["JWT 인증 확인<br/>req.user 설정"]
    ErrorMW["에러 핸들링<br/>응답 직렬화"]
    
    Routes["🛣️ Routes<br/>(라우팅)"]
    AuthRoutes["POST /api/auth/register<br/>POST /api/auth/login"]
    TodoRoutes["GET/POST /api/todos<br/>PATCH/DELETE /api/todos/:id"]
    OtherRoutes["GET /api/users/me<br/>PATCH /api/users/me<br/>GET/POST /api/categories"]
    
    Controllers["🎮 Controllers<br/>(요청 처리)"]
    
    Services["💼 Services<br/>(비즈니스 로직)"]
    
    Repositories["📚 Repositories<br/>(DB 접근)"]
    
    DB["🗄️ PostgreSQL 17<br/>pg 라이브러리"]
    
    HTTP --> Middleware
    Middleware --> AuthMW
    Middleware --> ErrorMW
    AuthMW --> Routes
    ErrorMW -.->|응답| HTTP
    
    Routes --> AuthRoutes
    Routes --> TodoRoutes
    Routes --> OtherRoutes
    
    AuthRoutes --> Controllers
    TodoRoutes --> Controllers
    OtherRoutes --> Controllers
    
    Controllers --> Services
    Services --> Repositories
    Repositories --> DB
    
    style HTTP fill:#ffccbc
    style Middleware fill:#c8e6c9
    style Routes fill:#e3f2fd
    style Controllers fill:#f3e5f5
    style Services fill:#fff3e0
    style Repositories fill:#ffe0b2
    style DB fill:#f3e5f5
```

---

## 4. DB 엔티티 관계도

도메인 정의서 기반의 3개 핵심 엔티티(User, Todo, Category) 관계도. User는 Todo와 Category의 소유자이며, Todo는 Category로 분류됩니다.

```mermaid
erDiagram
    USER ||--o{ TODO : owns
    USER ||--o{ CATEGORY : owns
    CATEGORY ||--o{ TODO : contains
    
    USER {
        uuid id PK
        string email UK
        string password
        string name
        timestamp created_at
        timestamp updated_at
    }
    
    TODO {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        string title
        string description
        date due_date
        boolean is_completed
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }
    
    CATEGORY {
        uuid id PK
        uuid user_id FK
        string name
        boolean is_default
        timestamp created_at
    }
```

**주요 제약 조건:**
- **BR-U-01**: User.email은 전체 시스템에서 고유 (UNIQUE 제약)
- **BR-T-01**: Todo는 반드시 하나의 Category에 속함 (NOT NULL FK)
- **BR-T-03**: 사용자는 자신 소유의 Todo만 조회/수정/삭제 (user_id 검증)
- **BR-C-01**: 기본 카테고리(is_default=true)는 시스템 제공, 수정/삭제 불가
- **BR-C-02**: 사용자 정의 카테고리는 해당 사용자만 접근 (user_id 검증)
- **BR-C-03**: 할일이 있는 카테고리는 삭제 불가 (애플리케이션 검증)

---

## 주요 기술 스택

### 프론트엔드
- **Framework**: React 19 + TypeScript
- **상태 관리**: Zustand (UI/인증 상태)
- **서버 상태**: TanStack Query (API 데이터)
- **플랫폼**: 반응형 웹 (Desktop/Mobile)

### 백엔드
- **Runtime**: Node.js
- **Framework**: Express
- **DB 클라이언트**: pg (node-postgres, ORM 금지)
- **인증**: JWT (1차)

### 데이터베이스
- **DBMS**: PostgreSQL 17
- **연동**: pg 라이브러리 직접 사용 (파라미터화된 쿼리)

### 인증 흐름 (1차)
1. 회원가입: 이메일, 비밀번호(bcrypt 해시), 이름 등록
2. 로그인: JWT Access Token 발급
3. 토큰 저장: Zustand `authStore` 메모리에 저장 (`localStorage`·Cookie 사용 금지)
4. API 요청: `Authorization: Bearer {token}` 헤더 첨부 (API 클라이언트가 authStore에서 자동 읽음)
5. 토큰 검증: 모든 인증 필요 API에 JWT Middleware 적용
6. 페이지 새로고침 시 토큰 초기화 → 재로그인 필요 (메모리 저장 방식의 트레이드오프)

---

## 아키텍처 설계 원칙

### 관심사 분리 (Separation of Concerns)
- UI 렌더링, 비즈니스 로직, 데이터 접근, 인프라 설정을 각각 독립된 레이어로 분리
- 변경 요청(예: 2차 OAuth 추가)이 특정 레이어에만 영향을 미치도록 격리

### 단일 책임 원칙 (Single Responsibility)
- 각 레이어/모듈은 하나의 명확한 책임만 가짐
- 비즈니스 규칙(BR)은 서비스 계층에 집중

### 단방향 의존성
- **프론트엔드**: Pages → Features → Hooks → API Client → HTTP
- **백엔드**: Routes → Controllers → Services → Repositories → DB
- 하위 레이어가 상위 레이어를 참조하는 역방향 의존 금지

### 도메인 중심 설계
- 도메인 정의서의 엔티티(User, Todo, Category)를 코드 구조에 직접 반영
- 도메인 용어(Ubiquitous Language) 일관성 유지
- 비즈니스 규칙을 도메인 코드로 구현

---

*본 문서의 다이어그램들은 TodoListApp의 아키텍처를 단순하면서도 명확하게 표현하기 위해 설계되었습니다. 더 자세한 구조 설계 원칙은 [프로젝트 원칙 v1.0.0](./4-project-principles.md)을 참고하세요.*
