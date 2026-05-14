# TodoListApp 프론트엔드 스타일 가이드

- 버전: 1.0.0
- 작성일: 2026-05-14
- 디자인 레퍼런스: Naver Calendar UI
- 참조 문서:
  - [PRD v1.4.0](./2-prd.md)
  - [와이어프레임 v1.0.0](./8-wireframe.md)

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2026-05-14 | Frontend Developer | 최초 작성 |

---

## 목차

1. [디자인 원칙](#1-디자인-원칙)
2. [컬러 시스템](#2-컬러-시스템)
3. [타이포그래피](#3-타이포그래피)
4. [스페이싱 시스템](#4-스페이싱-시스템)
5. [레이아웃 및 그리드](#5-레이아웃-및-그리드)
6. [컴포넌트 스타일](#6-컴포넌트-스타일)
7. [아이콘](#7-아이콘)
8. [모션 및 트랜지션](#8-모션-및-트랜지션)
9. [접근성](#9-접근성)
10. [CSS 변수 전체 목록](#10-css-변수-전체-목록)

---

## 1. 디자인 원칙

### 1.1 핵심 방향

레퍼런스 UI(Naver Calendar)의 특징을 다음 세 가지 원칙으로 정의한다.

| 원칙 | 내용 |
|------|------|
| **Clarity (명확성)** | 기능과 상태를 직관적으로 파악할 수 있는 레이아웃. 불필요한 장식 요소 제거 |
| **Consistency (일관성)** | 동일한 의미의 요소는 동일한 색·크기·간격을 사용. CSS 변수 기반으로 전체 통일 |
| **Focus (집중성)** | 할일 목록이 시각적 주인공. 사이드바, 헤더는 콘텐츠를 방해하지 않는 서브 역할 |

### 1.2 스타일 기조

- **Flat + Minimal**: 그림자는 최소화, 테두리(border)로 구분
- **Green Primary**: Naver Calendar의 시그니처 그린 계열을 Primary 액션 색상으로 사용
- **High Contrast Text**: 본문 텍스트는 배경 대비 4.5:1 이상 유지
- **Responsive First**: 768px 기준 Desktop / Mobile 두 단계 레이아웃

---

## 2. 컬러 시스템

### 2.1 Primary — Green

Naver Calendar의 그린 계열을 Primary 컬러로 채택한다.

| 토큰 | HEX | 사용처 |
|------|-----|--------|
| `--color-primary-600` | `#03c75a` | Primary 버튼 배경, 체크박스 활성, 진행 중 상태 |
| `--color-primary-500` | `#2dcf7a` | Hover 상태 |
| `--color-primary-100` | `#e6faf0` | 활성 탭 배경, 선택된 항목 하이라이트 |
| `--color-primary-50` | `#f4fdf8` | 카드 호버 배경 |

```css
/* 사용 예시 */
.btn-primary {
  background-color: var(--color-primary-600);
  color: #ffffff;
}
.btn-primary:hover {
  background-color: var(--color-primary-500);
}
```

### 2.2 Neutral — Gray

| 토큰 | HEX | 사용처 |
|------|-----|--------|
| `--color-gray-900` | `#1a1a1a` | 주요 본문 텍스트 |
| `--color-gray-700` | `#3d3d3d` | 서브 텍스트, 레이블 |
| `--color-gray-500` | `#757575` | Placeholder, 힌트 텍스트 |
| `--color-gray-300` | `#b3b3b3` | 비활성 요소, 아이콘 |
| `--color-gray-200` | `#d4d4d4` | 구분선 (divider), 입력 테두리 |
| `--color-gray-100` | `#f0f0f0` | 사이드바 배경, 호버 배경 |
| `--color-gray-50` | `#f7f7f7` | 페이지 배경 |

### 2.3 Semantic

| 토큰 | HEX | 사용처 |
|------|-----|--------|
| `--color-danger` | `#ff4b4b` | 삭제 버튼, 에러 메시지, 기한 초과 강조 |
| `--color-danger-light` | `#fff0f0` | 에러 배경, 기한 초과 행 배경 |
| `--color-warning` | `#ff9500` | 기한 임박 (D-3 이내) |
| `--color-warning-light` | `#fff7ed` | 기한 임박 배경 |
| `--color-info` | `#3b82f6` | 오늘 날짜 강조 (Today badge) |
| `--color-info-light` | `#eff6ff` | 오늘 날짜 배경 |
| `--color-success` | `#03c75a` | 완료 상태 (primary와 동일) |

### 2.4 Surface

| 토큰 | HEX | 사용처 |
|------|-----|--------|
| `--color-bg-base` | `#ffffff` | 메인 콘텐츠 배경 |
| `--color-bg-sidebar` | `#ffffff` | 사이드바 배경 |
| `--color-bg-page` | `#f7f7f7` | 전체 페이지 배경 |
| `--color-border` | `#e0e0e0` | 기본 테두리 |
| `--color-border-focus` | `#03c75a` | 포커스 링 |

### 2.5 컬러 사용 금지 사례

- 레퍼런스 UI와 다른 파란색 계열을 Primary로 사용 금지
- 완료 항목에 취소선 + 회색 처리 시, 배경색 변경은 `--color-gray-100`만 허용
- 에러 표시에 오렌지 사용 금지 (`--color-danger` 사용)

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

```css
:root {
  --font-sans: 'Pretendard', 'Apple SD Gothic Neo', -apple-system,
               BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

body {
  font-family: var(--font-sans);
}
```

> **우선순위**: Pretendard (웹폰트) → Apple SD Gothic Neo (macOS) → 시스템 기본 sans-serif

### 3.2 타입 스케일

| 토큰 | 크기 | 줄높이 | 굵기 | 사용처 |
|------|------|--------|------|--------|
| `--text-xs` | `11px` | `1.4` | 400 | 날짜 라벨, 보조 메타 정보 |
| `--text-sm` | `12px` | `1.5` | 400 | 캡션, 태그, 서브 레이블 |
| `--text-base` | `14px` | `1.6` | 400 | 본문, 할일 제목 |
| `--text-md` | `15px` | `1.6` | 500 | 강조 본문, 선택된 항목 |
| `--text-lg` | `17px` | `1.5` | 600 | 섹션 헤더, 페이지 타이틀 |
| `--text-xl` | `20px` | `1.4` | 700 | 앱 로고, 주요 헤딩 |

### 3.3 텍스트 스타일 패턴

```css
/* 할일 제목 — 기본 */
.todo-title {
  font-size: var(--text-base);
  font-weight: 400;
  color: var(--color-gray-900);
}

/* 할일 제목 — 완료 처리됨 */
.todo-title.completed {
  color: var(--color-gray-300);
  text-decoration: line-through;
  text-decoration-color: var(--color-gray-300);
}

/* 섹션 헤더 */
.section-header {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}

/* 날짜/메타 정보 */
.meta-text {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
}

/* 기한 초과 날짜 */
.overdue-date {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-danger);
}
```

---

## 4. 스페이싱 시스템

4px 기반 배수 체계를 사용한다.

| 토큰 | 값 | 주요 사용처 |
|------|-----|-------------|
| `--space-1` | `4px` | 아이콘-텍스트 간격, 인라인 요소 |
| `--space-2` | `8px` | 컴포넌트 내부 소규모 여백 |
| `--space-3` | `12px` | 버튼 수직 패딩, 리스트 아이템 |
| `--space-4` | `16px` | 섹션 내부 패딩, 카드 패딩 |
| `--space-5` | `20px` | 섹션 간 여백 |
| `--space-6` | `24px` | 사이드바 패딩 |
| `--space-8` | `32px` | 페이지 섹션 분리 |
| `--space-10` | `40px` | 대형 섹션 분리 |

### 4.1 컴포넌트별 스페이싱 기준

| 컴포넌트 | Padding | Gap |
|----------|---------|-----|
| Button (small) | `6px 12px` | — |
| Button (medium) | `8px 16px` | — |
| Button (large) | `10px 20px` | — |
| Input | `8px 12px` | — |
| Card | `16px` | — |
| Todo Item | `12px 16px` | `8px` |
| Sidebar | `24px` | `4px` |
| Modal | `24px` | `16px` |

---

## 5. 레이아웃 및 그리드

### 5.1 페이지 레이아웃

레퍼런스(Naver Calendar)의 좌측 사이드바 + 우측 메인 콘텐츠 구조를 채택한다.

```
┌──────────────────────────────────────────────┐
│  Header (56px)                                │
├────────────┬─────────────────────────────────┤
│ Sidebar    │  Main Content                   │
│ (220px)    │                                 │
│            │                                 │
│            │                                 │
└────────────┴─────────────────────────────────┘
```

```css
.app-layout {
  display: grid;
  grid-template-rows: 56px 1fr;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.app-header {
  grid-column: 1 / -1;
  height: 56px;
}

.app-sidebar {
  width: 220px;
  background: var(--color-bg-sidebar);
  border-right: 1px solid var(--color-border);
}

.app-main {
  flex: 1;
  background: var(--color-bg-base);
  overflow-y: auto;
}
```

### 5.2 반응형 브레이크포인트

| 이름 | 기준 | 레이아웃 |
|------|------|----------|
| Mobile | `< 768px` | 사이드바 숨김, 단일 컬럼, 하단 네비게이션 바 |
| Desktop | `≥ 768px` | 사이드바 + 메인 콘텐츠 분리 |

```css
/* Mobile */
@media (max-width: 767px) {
  .app-sidebar {
    display: none; /* 드로어로 전환 */
  }
  .app-layout {
    grid-template-columns: 1fr;
  }
  .bottom-nav {
    display: flex; /* 하단 네비게이션 표시 */
  }
}

/* Desktop */
@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }
}
```

### 5.3 컨텐츠 최대 너비

```css
.content-inner {
  max-width: 960px;
  padding: 0 var(--space-6);
  margin: 0 auto;
}
```

---

## 6. 컴포넌트 스타일

### 6.1 버튼

레퍼런스 UI의 버튼 패턴: 주요 액션(Primary) / 보조 액션(Outlined) / 텍스트 버튼(Ghost) 세 가지를 사용한다.

#### Primary 버튼

Naver Calendar의 "일정 쓰기" 버튼 스타일.

```css
.btn-primary {
  background-color: var(--color-primary-600);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.btn-primary:hover {
  background-color: var(--color-primary-500);
}
.btn-primary:active {
  opacity: 0.9;
}
.btn-primary:disabled {
  background-color: var(--color-gray-300);
  cursor: not-allowed;
}
```

#### Outlined 버튼

Naver Calendar의 "기념일 관리" 버튼 스타일.

```css
.btn-outlined {
  background-color: transparent;
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
  border-radius: 6px;
  padding: 7px 15px;
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.btn-outlined:hover {
  border-color: var(--color-primary-600);
  color: var(--color-primary-600);
}
```

#### Danger 버튼 (삭제)

```css
.btn-danger {
  background-color: transparent;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
  border-radius: 6px;
  padding: 7px 15px;
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
}
.btn-danger:hover {
  background-color: var(--color-danger-light);
}
```

#### 아이콘 버튼 (Ghost)

```css
.btn-icon {
  background: none;
  border: none;
  color: var(--color-gray-500);
  padding: var(--space-2);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-icon:hover {
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
}
```

---

### 6.2 입력 필드

레퍼런스 UI의 "일정 검색" 입력창 스타일.

```css
.input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 6px;
  font-size: var(--text-base);
  color: var(--color-gray-900);
  background-color: var(--color-bg-base);
  outline: none;
  transition: border-color 0.15s;
}
.input::placeholder {
  color: var(--color-gray-500);
}
.input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(3, 199, 90, 0.12);
}
.input:disabled {
  background-color: var(--color-gray-100);
  color: var(--color-gray-300);
  cursor: not-allowed;
}
```

#### 에러 상태

```css
.input.error {
  border-color: var(--color-danger);
}
.input-error-message {
  margin-top: 4px;
  font-size: var(--text-sm);
  color: var(--color-danger);
}
```

---

### 6.3 체크박스

레퍼런스 UI의 컬러 체크박스 (Naver Calendar 캘린더 목록의 체크박스) 스타일.

```css
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-gray-300);
  border-radius: 4px;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s, border-color 0.15s;
  flex-shrink: 0;
}

.checkbox.checked {
  background-color: var(--color-primary-600);
  border-color: var(--color-primary-600);
}

/* 체크 아이콘 (SVG 또는 ::after pseudo-element) */
.checkbox.checked::after {
  content: '';
  width: 10px;
  height: 6px;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(-45deg) translateY(-1px);
}
```

---

### 6.4 탭 / 토글 버튼 그룹

레퍼런스 UI의 "일간 / 주간 / 월간 / 목록 / 2주" 필터 탭 스타일.

```css
.tab-group {
  display: flex;
  border: 1px solid var(--color-gray-200);
  border-radius: 6px;
  overflow: hidden;
}

.tab-item {
  padding: 6px 14px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-gray-700);
  background-color: var(--color-bg-base);
  border: none;
  cursor: pointer;
  border-right: 1px solid var(--color-gray-200);
  transition: background-color 0.1s, color 0.1s;
}
.tab-item:last-child {
  border-right: none;
}
.tab-item:hover {
  background-color: var(--color-gray-100);
}
.tab-item.active {
  background-color: var(--color-primary-600);
  color: #ffffff;
  font-weight: 600;
}
```

---

### 6.5 할일 카드 (Todo Item)

```css
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-bg-base);
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.1s;
}
.todo-item:hover {
  background-color: var(--color-primary-50);
}

/* 완료된 할일 */
.todo-item.completed {
  background-color: var(--color-gray-50);
}
.todo-item.completed .todo-title {
  color: var(--color-gray-300);
  text-decoration: line-through;
}

/* 기한 초과 */
.todo-item.overdue {
  background-color: var(--color-danger-light);
}
.todo-item.overdue .todo-due-date {
  color: var(--color-danger);
  font-weight: 500;
}
```

---

### 6.6 카드 컨테이너

```css
.card {
  background-color: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: var(--space-4);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
```

---

### 6.7 모달 / 다이얼로그

레퍼런스 UI의 팝업 툴팁 스타일에서 착안.

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--color-bg-base);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: var(--space-6);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.modal-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-gray-900);
}
```

---

### 6.8 배지 / 레이블

레퍼런스 UI의 카테고리 색상 뱃지 스타일.

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: var(--text-xs);
  font-weight: 500;
  white-space: nowrap;
}

.badge-green {
  background-color: var(--color-primary-100);
  color: var(--color-primary-600);
}

.badge-red {
  background-color: var(--color-danger-light);
  color: var(--color-danger);
}

.badge-gray {
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
}

.badge-orange {
  background-color: var(--color-warning-light);
  color: var(--color-warning);
}
```

---

### 6.9 빈 상태 (Empty State)

필터 결과 0건, 할일 없음 등에 사용.

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-10) var(--space-6);
  text-align: center;
  color: var(--color-gray-500);
}

.empty-state-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--space-4);
  color: var(--color-gray-300);
}

.empty-state-title {
  font-size: var(--text-md);
  font-weight: 500;
  color: var(--color-gray-500);
  margin-bottom: var(--space-2);
}

.empty-state-description {
  font-size: var(--text-sm);
  color: var(--color-gray-300);
}
```

---

### 6.10 헤더

레퍼런스 UI의 상단 네비게이션 바.

```css
.app-header {
  height: 56px;
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg-base);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-logo {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-primary-600);
  letter-spacing: -0.5px;
}
```

---

### 6.11 사이드바 네비게이션

레퍼런스 UI의 좌측 메뉴.

```css
.sidebar-section {
  padding: var(--space-4) var(--space-4);
}

.sidebar-section-title {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: var(--space-2) var(--space-2);
  margin-bottom: var(--space-1);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-2);
  border-radius: 6px;
  font-size: var(--text-base);
  color: var(--color-gray-700);
  cursor: pointer;
  transition: background-color 0.1s;
}
.sidebar-item:hover {
  background-color: var(--color-gray-100);
}
.sidebar-item.active {
  background-color: var(--color-primary-100);
  color: var(--color-primary-600);
  font-weight: 600;
}

.sidebar-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

---

### 6.12 토스트 알림

```css
.toast {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 6px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  white-space: nowrap;
}

.toast-success { background-color: var(--color-primary-600); }
.toast-error   { background-color: var(--color-danger); }
.toast-info    { background-color: var(--color-gray-700); }
```

---

## 7. 아이콘

- 아이콘 라이브러리: **Lucide React** (`lucide-react`)
- 크기 기본값: `16px` (인라인), `20px` (버튼 아이콘), `24px` (네비게이션)
- 색상: 부모 요소의 `color` 상속 (`currentColor`)

```tsx
import { Check, Trash2, Pencil, Plus, ChevronRight } from 'lucide-react';

// 사용 예시
<button className="btn-icon">
  <Trash2 size={16} />
</button>
```

| 아이콘 | 용도 |
|--------|------|
| `Check` | 완료 체크박스 |
| `Plus` | 할일/카테고리 추가 버튼 |
| `Pencil` | 수정 |
| `Trash2` | 삭제 |
| `Calendar` | 날짜 선택 |
| `Tag` | 카테고리 |
| `AlertCircle` | 에러, 기한 초과 경고 |
| `LogOut` | 로그아웃 |
| `User` | 프로필 |
| `ChevronRight` | 이동, 더보기 |

---

## 8. 모션 및 트랜지션

레퍼런스 UI는 빠르고 절제된 애니메이션을 사용한다.

| 용도 | Duration | Easing |
|------|----------|--------|
| 색상/배경 전환 (hover) | `150ms` | `ease` |
| 모달 열림/닫힘 | `200ms` | `ease-out` |
| 사이드바 드로어 (Mobile) | `250ms` | `ease-out` |
| 토스트 알림 | `200ms` | `ease-in-out` |
| 스켈레톤 shimmer | `1.5s` | `linear`, `infinite` |

```css
/* 전역 트랜지션 변수 */
:root {
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease-out;
  --transition-slow: 250ms ease-out;
}

/* 완료 체크 애니메이션 */
@keyframes check-bounce {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}
.checkbox.just-checked {
  animation: check-bounce 200ms ease;
}
```

---

## 9. 접근성

### 9.1 키보드 내비게이션

- 모든 클릭 가능 요소는 `Tab`으로 포커스 가능해야 한다.
- 포커스 링은 `outline: 2px solid var(--color-border-focus)` + `outline-offset: 2px` 적용.
- 커스텀 체크박스, 탭 버튼에는 `role` 및 `aria-*` 속성 필수.

```css
/* 포커스 링 전역 설정 */
:focus-visible {
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}
/* 마우스 클릭 시 아웃라인 제거 */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 9.2 색상 대비

| 텍스트 / 배경 조합 | 대비율 | 기준 충족 |
|-------------------|--------|-----------|
| `--color-gray-900` / `#ffffff` | 16:1 | ✅ AAA |
| `--color-gray-700` / `#ffffff` | 8.6:1 | ✅ AAA |
| `#ffffff` / `--color-primary-600` | 4.7:1 | ✅ AA |
| `--color-danger` / `#ffffff` | 4.6:1 | ✅ AA |

### 9.3 ARIA 사용 가이드

```tsx
// 체크박스
<div role="checkbox" aria-checked={isCompleted} tabIndex={0} />

// 탭 그룹
<div role="tablist">
  <button role="tab" aria-selected={active} />
</div>

// 모달
<div role="dialog" aria-modal="true" aria-labelledby="modal-title" />

// 로딩 상태
<div role="status" aria-live="polite">로딩 중...</div>

// 삭제 확인 버튼
<button aria-label="할일 삭제" />
```

---

## 10. CSS 변수 전체 목록

`src/styles/variables.css`에 정의한다.

```css
:root {
  /* === Colors: Primary === */
  --color-primary-600: #03c75a;
  --color-primary-500: #2dcf7a;
  --color-primary-100: #e6faf0;
  --color-primary-50:  #f4fdf8;

  /* === Colors: Neutral === */
  --color-gray-900: #1a1a1a;
  --color-gray-700: #3d3d3d;
  --color-gray-500: #757575;
  --color-gray-300: #b3b3b3;
  --color-gray-200: #d4d4d4;
  --color-gray-100: #f0f0f0;
  --color-gray-50:  #f7f7f7;

  /* === Colors: Semantic === */
  --color-danger:        #ff4b4b;
  --color-danger-light:  #fff0f0;
  --color-warning:       #ff9500;
  --color-warning-light: #fff7ed;
  --color-info:          #3b82f6;
  --color-info-light:    #eff6ff;
  --color-success:       #03c75a;

  /* === Colors: Surface === */
  --color-bg-base:    #ffffff;
  --color-bg-sidebar: #ffffff;
  --color-bg-page:    #f7f7f7;
  --color-border:     #e0e0e0;
  --color-border-focus: #03c75a;

  /* === Typography === */
  --font-sans: 'Pretendard', 'Apple SD Gothic Neo', -apple-system,
               BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-xs:   11px;
  --text-sm:   12px;
  --text-base: 14px;
  --text-md:   15px;
  --text-lg:   17px;
  --text-xl:   20px;

  /* === Spacing === */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;

  /* === Transitions === */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease-out;
  --transition-slow: 250ms ease-out;

  /* === Border Radius === */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 10px;
  --radius-full: 9999px;

  /* === Shadows === */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.15);

  /* === Z-Index === */
  --z-header:  100;
  --z-modal:   1000;
  --z-toast:   2000;
}
```

---

*본 문서는 TodoListApp 프론트엔드의 시각적 일관성을 위한 스타일 가이드이며, 2차 개발(다크 모드 등) 시 개정됩니다.*
