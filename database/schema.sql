-- =============================================================================
-- TodoListApp Database Schema
-- 참조: docs/6-erd.md, docs/1-domain-definition.md
-- DBMS: PostgreSQL 17
-- =============================================================================

-- UUID 생성 확장 활성화
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. users 테이블
-- 도메인: User 엔티티
-- BR-U-01: email UNIQUE (중복 가입 불가)
-- BR-U-02: password bcrypt 해시 저장 (애플리케이션 레이어에서 처리)
-- =============================================================================
CREATE TABLE users (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,           -- bcrypt 해시 값 (BR-U-02)
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)     -- BR-U-01
);

COMMENT ON TABLE  users              IS '서비스 사용자. 모든 할일과 사용자 정의 카테고리의 소유 주체.';
COMMENT ON COLUMN users.email        IS '로그인 식별자. 시스템 전체 고유 (BR-U-01)';
COMMENT ON COLUMN users.password     IS 'bcrypt 해시 처리된 비밀번호. 평문 저장 금지 (BR-U-02)';

-- =============================================================================
-- 2. categories 테이블
-- 도메인: Category 엔티티
-- user_id NULL  → 시스템 기본 카테고리 (BR-C-01: 수정/삭제 불가)
-- user_id NOT NULL → 사용자 정의 카테고리
-- BR-C-04: 동일 사용자 내 카테고리 이름 중복 불가 (부분 유니크 인덱스)
-- =============================================================================
CREATE TABLE categories (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID,                            -- NULL이면 기본 카테고리 (BR-C-01)
    name        VARCHAR(100) NOT NULL,
    is_default  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_categories         PRIMARY KEY (id),
    CONSTRAINT fk_categories_user    FOREIGN KEY (user_id)
                                     REFERENCES users (id)
                                     ON DELETE CASCADE
);

-- BR-C-04: 동일 사용자 내 카테고리 이름 중복 불가
-- user_id가 NULL인 기본 카테고리는 제외 (IS NOT NULL 조건)
CREATE UNIQUE INDEX uq_categories_user_name
    ON categories (user_id, name)
    WHERE user_id IS NOT NULL;

COMMENT ON TABLE  categories             IS '할일 분류 단위. user_id=NULL이면 시스템 기본 카테고리.';
COMMENT ON COLUMN categories.user_id     IS '소유 사용자. NULL=기본 카테고리(시스템 소유), NOT NULL=사용자 정의 (BR-C-01)';
COMMENT ON COLUMN categories.is_default  IS 'true이면 시스템 기본 카테고리. 수정/삭제 불가 (BR-C-01)';

-- =============================================================================
-- 3. todos 테이블
-- 도메인: Todo 엔티티
-- BR-T-01: category_id NOT NULL (할일은 반드시 하나의 카테고리에 속함)
-- BR-T-02: title NOT NULL
-- BR-T-04/05: completed_at — 애플리케이션 레이어에서 완료/취소 시 관리
-- BR-T-06: due_date 미래 날짜 검증 — 애플리케이션 레이어에서 처리
-- =============================================================================
CREATE TABLE todos (
    id           UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL,
    category_id  UUID        NOT NULL,           -- BR-T-01: 카테고리 필수
    title        VARCHAR(500) NOT NULL,           -- BR-T-02: 제목 필수
    description  TEXT,                           -- NULL 허용
    due_date     DATE,                           -- NULL 허용. 입력 시 오늘 이후 (BR-T-06, 앱 검증)
    is_completed BOOLEAN     NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,                    -- NULL 허용. 완료 시 기록, 취소 시 NULL (BR-T-04/05)
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_todos              PRIMARY KEY (id),
    CONSTRAINT fk_todos_user         FOREIGN KEY (user_id)
                                     REFERENCES users (id)
                                     ON DELETE CASCADE,
    CONSTRAINT fk_todos_category     FOREIGN KEY (category_id)
                                     REFERENCES categories (id)
                                     ON DELETE RESTRICT   -- BR-C-03: 할일이 있으면 카테고리 삭제 불가
);

COMMENT ON TABLE  todos              IS '서비스 핵심 엔티티. 사용자 소유이며 카테고리로 분류됨.';
COMMENT ON COLUMN todos.category_id  IS '분류 카테고리. NOT NULL 필수 (BR-T-01)';
COMMENT ON COLUMN todos.title        IS '할일 제목. NOT NULL 필수 (BR-T-02)';
COMMENT ON COLUMN todos.due_date     IS '종료예정일. 입력 시 오늘 이후여야 함 (BR-T-06, 애플리케이션 검증)';
COMMENT ON COLUMN todos.completed_at IS '완료 처리 일시. 완료 시 자동 기록, 미완료 복원 시 NULL (BR-T-04/05)';

-- =============================================================================
-- 4. 인덱스
-- =============================================================================

-- 사용자별 할일 목록 조회 (가장 빈번한 쿼리)
CREATE INDEX idx_todos_user_id
    ON todos (user_id);

-- 필터링: 완료 여부 (BR-F-03)
CREATE INDEX idx_todos_user_completed
    ON todos (user_id, is_completed);

-- 필터링: 카테고리 (BR-F-01)
CREATE INDEX idx_todos_user_category
    ON todos (user_id, category_id);

-- 필터링: 기간 초과 여부 (BR-F-02)
CREATE INDEX idx_todos_due_date
    ON todos (due_date)
    WHERE due_date IS NOT NULL;

-- 사용자별 카테고리 목록 조회
CREATE INDEX idx_categories_user_id
    ON categories (user_id);

-- =============================================================================
-- 5. updated_at 자동 갱신 트리거
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 6. 기본 카테고리 시드 데이터
-- PRD 5.3.4: 시스템 제공 기본 카테고리 (개인, 업무, 쇼핑)
-- user_id = NULL, is_default = TRUE
-- =============================================================================
INSERT INTO categories (name, user_id, is_default) VALUES
    ('개인', NULL, TRUE),
    ('업무', NULL, TRUE),
    ('쇼핑', NULL, TRUE);
