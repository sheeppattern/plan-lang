# Plan Language

> AI 기반 소프트웨어 개발을 위한 구조화된 기획 언어 — 파서, 린터, CLI, LSP 서버, VS Code 확장

Plan Language는 사람→AI, AI→AI, 사람→사람 커뮤니케이션을 하나의 `.plan` 파일 포맷으로 통합하는 기획 언어다. Markdown과 완전 호환되면서, 12개의 핵심 키워드로 기획의 구조와 불확실성을 기계가 파싱하고 검증할 수 있게 한다.

## 왜 Plan Language인가?

기존 기획 도구(PRD, Jira, Confluence)는 불확실성을 주석이나 관례로만 처리한다. Plan Language는 **"아직 모르는 것"을 포맷의 1급 시민으로** 다룬다.

- **Markdown 호환** — `.plan` 파일은 GitHub, VS Code, Notion 등 일반 Markdown 뷰어에서 그대로 읽힌다
- **키워드 접두 자연어** — Gherkin(BDD)과 EARS(Rolls-Royce)에서 검증된 패턴. 줄 시작의 키워드로 구조를 잡고, 나머지는 자연어
- **불확실성의 기계적 검증** — `?pending`이 남아 있는 기획은 `ready` 상태로 전이 불가. 기획 완성도를 자동 검증
- **토큰 효율성** — JSON 대비 34~38%, XML 대비 45% 절약

## 한눈에 보는 예제

```markdown
---
type: feature
id: feat-social-login
status: draft
owner: @max
priority: high
tags: [auth, onboarding, mvp]
---

# Feature: 소셜 로그인

Goal: 신규 유저의 가입 허들을 낮춰 가입 전환율을 높인다
Persona: @new_user — 앱을 처음 설치한 사용자
Metric: signup_conversion_rate > 40%

Needs: [feat-email-auth] 이메일 인증 시스템 리팩토링 완료
Blocks: [feat-account-linking] 계정 연동 기능

---

## Story: Google 계정으로 가입

Given: @new_user가 가입 화면에 도달한 상태
When: "Google로 계속하기" 버튼을 탭
Then: Google OAuth 인증 후 홈 화면으로 이동 [MUST]
Then: 사용자 프로필에 이메일과 프로필 이미지가 자동 세팅 [SHOULD]

Edge: "이미 같은 이메일로 가입된 계정이 존재하는 경우"
  When: 반환된 이메일이 기존 계정과 일치
  Then: 계정 연동 확인 모달을 표시 [MUST]

### Task: OAuth 콜백 핸들러 구현

Assign: @backend-agent
Verify: `npm test -- --grep "oauth callback"` 전체 통과
Verify: Google OAuth 토큰 교환 성공 시 JWT 발급 확인
```

## 문법 개요

### 3단 계층 구조

기획을 **Feature → Story → Task** 3단계로 분해한다. Markdown 헤딩 레벨로 구분한다.

```
# Feature: <기능>        ← 사용자에게 제공되는 기능 영역
  ## Story: <스토리>     ← 사용자 관점의 행동 시나리오
    ### Task: <태스크>   ← AI 에이전트 또는 개발자에게 위임 가능한 단위
```

### 12개 핵심 키워드

줄 시작에 오는 키워드로 의미를 구분한다. 키워드 뒤에는 콜론(`:`)과 자연어가 온다.

**의도 키워드** — 기획의 "왜"를 표현

| 키워드 | 역할 | 위치 |
|--------|------|------|
| `Goal:` | 달성하려는 목표 | Feature, Story |
| `Persona:` | 대상 사용자 (`@참조` 가능) | Feature, Story |
| `Metric:` | 정량적 성공 지표 | Feature |

**행동 키워드** — Gherkin의 Given-When-Then 패턴

| 키워드 | 역할 |
|--------|------|
| `Given:` | 전제 조건 |
| `When:` | 트리거 행동 |
| `Then:` | 기대 결과 (`[MUST]`, `[SHOULD]`, `[MAY]` 의무 수준 부여) |

**의존성 키워드**

| 키워드 | 역할 |
|--------|------|
| `Needs:` | 선행 조건 (이것이 시작되려면 필요한 것) |
| `Blocks:` | 후행 영향 (이것이 완료되어야 시작 가능한 것) |

**태스크 키워드**

| 키워드 | 역할 |
|--------|------|
| `Assign:` | 담당자 또는 AI 에이전트 |
| `Verify:` | 완료 확인 조건 (기계 검증 가능) |

**엣지 케이스 & 불확실성**

| 키워드 | 역할 |
|--------|------|
| `Edge:` | 예외 시나리오 선언 (Story 내) |
| `?marker` | 불확실성 마커 (`?pending`, `?assumption`, `?alternative`, `?risk`) |

### 불확실성 시스템

기획에서 "아직 모르는 것"을 명시적으로 표현하고 추적한다.

| 마커 | 의미 |
|------|------|
| `?pending` | 미정. 결정 대기 중 |
| `?assumption` | 가정. 검증 필요 |
| `?alternative` | 대안 존재. 선택 필요 |
| `?risk` | 위험 요소. 모니터링 필요 |

**인라인 형태:**
```markdown
Metric: 결제 성공률 > ?assumption("95% — 업계 평균 기반 가정")
```

**블록 형태:**
```markdown
?pending "결제 수단 추가 — 비즈니스팀 확인 필요"
  Given: 사용자가 결제 화면에 도달
  When: 새 카드를 등록
  Then: (미정)
?end
```

**상태 전이 제약:** `?pending`이 1개 이상 남아 있으면 `draft → ready` 전이가 불가능하다.

### 상태 모델

```
draft ──→ ready ──→ in_progress ──→ done
  │         │            │
  │         │            ▼
  │         │        blocked ──→ in_progress
  │         │
  ▼         ▼
deprecated  deprecated
```

| 상태 | 의미 |
|------|------|
| `draft` | 작성 중, 아직 합의되지 않음 |
| `ready` | 합의 완료, 구현 대기 |
| `in_progress` | 구현 중 |
| `blocked` | 외부 의존성으로 중단 |
| `done` | 완료, 수용 기준 충족 |
| `deprecated` | 더 이상 유효하지 않음 |

### 참조 시스템

```markdown
@max                     — 사람, 팀, AI 에이전트, 페르소나
[feat-social-login]      — 프로젝트 내 다른 .plan 파일 참조
[feat-auth#story-google] — 특정 파일의 특정 Story/Task
[external]               — 시스템 밖 외부 의존성
[doc:api-design]         — 관련 문서 참조
```

### RFC 2119 의무 수준

`Then:` 절에서 요구사항의 의무 수준을 명시한다.

```markdown
Then: 시스템은 모든 필수 필드를 검증해야 한다 [MUST]
Then: 로딩 인디케이터를 표시하는 것이 권장된다 [SHOULD]
Then: 이전 입력값을 자동 완성할 수 있다 [MAY]
```

## 도구 체인

### CLI

```bash
# .plan 파일 파싱 → AST 트리 출력
npx tsx bin/plan.ts parse feat-social-login.plan
npx tsx bin/plan.ts parse feat-social-login.plan --format json

# 단일 파일 린트
npx tsx bin/plan.ts lint feat-social-login.plan
npx tsx bin/plan.ts lint feat-social-login.plan --format json

# 프로젝트 전체 린트 (교차 파일 규칙 포함)
npx tsx bin/plan.ts lint-project ./plans/

# 불확실성 리포트
npx tsx bin/plan.ts uncertainty feat-social-login.plan feat-payment.plan
```

**린트 옵션:**
- `--format <text|json>` — 출력 형식
- `--quiet` — 문제가 없으면 출력 생략
- `--disable <rules...>` — 특정 규칙 비활성화 (예: `--disable PLAN-005 PLAN-006`)
- `--severity <error|warning|info>` — 최소 심각도 필터

### 린트 규칙

| 규칙 ID | 심각도 | 설명 |
|---------|--------|------|
| `PLAN-001` | error | Feature에 `Goal:`이 없음 |
| `PLAN-002` | error | Story에 `When:` 또는 `Then:`이 없음 |
| `PLAN-003` | error | Task에 `Assign:`이 없음 |
| `PLAN-004` | error | `status: ready`인데 `?pending` 마커가 존재 |
| `PLAN-005` | warning | Story에 `Edge:`가 하나도 없음 |
| `PLAN-006` | warning | `Then:`에 `[MUST/SHOULD/MAY]`가 없음 |
| `PLAN-007` | warning | `?assumption`이 30일 이상 해소되지 않음 |
| `PLAN-008` | info | `Blocks:`로 참조된 파일이 아직 `draft` 상태 |
| `PLAN-009` | error | `Needs:`로 참조된 ID가 프로젝트 내에 존재하지 않음 |
| `PLAN-010` | warning | Feature에 `Metric:`이 없음 |

파일 내 린트 지시자로 규칙을 억제할 수 있다:

```markdown
<!-- @lint-disable PLAN-005 -->
## Story: 간단한 스토리
When: 사용자가 버튼을 클릭
Then: 결과가 표시됨 [MUST]
<!-- @lint-enable PLAN-005 -->
```

### VS Code 확장

`packages/vscode/` 디렉토리에 VS Code 확장이 포함되어 있다.

- 구문 하이라이팅 (TextMate 문법)
- 실시간 린트 진단
- 자동 완성 (키워드, 참조, 액터, 프론트매터)
- 호버 정보 (키워드 설명, 의무 수준, 불확실성 마커)
- 정의로 이동 (`[feat-id]` → 대상 파일, `@actor` → Persona 정의)
- 문서 심볼 (아웃라인 패널)
- 코드 접기

### 프로그래밍 API

```typescript
import { parsePlanFile, LintEngine, loadProject, resolveReferences } from 'plan-lang';

// 단일 파일 파싱
const doc = parsePlanFile(source, 'feat-social-login.plan');
console.log(doc.feature?.title);       // "소셜 로그인"
console.log(doc.feature?.stories[0]);  // Story AST 노드

// 린트
const engine = new LintEngine();
const diagnostics = engine.lint(doc);

// 프로젝트 로드 + 교차 파일 린트
const project = await loadProject('./plans/');
const allDiags = engine.lintProject(project.documents, project.sources);

// 교차 파일 참조 해석
const { resolved, unresolved } = resolveReferences(project.documents);
```

## 설계 근거

| 설계 결정 | 근거 |
|-----------|------|
| Markdown 기반 | 토큰 효율성(JSON -38%, XML -45%), 생태계 범용성, graceful degradation |
| 줄 시작 키워드 | Gherkin/EARS에서 검증. 키워드 접두 + 자유 자연어가 파싱과 가독성 모두 달성 |
| 불확실성 1급 시민 | 기존 포맷은 불확실성을 관례로만 처리. `?pending` → `ready` 전이 차단으로 기계적 검증 |
| 6단계 상태 머신 | `draft → ready` 사이에 불확실성 해소 강제. `blocked` 상태로 외부 병목 명시 추적 |
| RFC 2119 의무 수준 | `Then:` 절의 `[MUST/SHOULD/MAY]`로 요구사항 강제성 명시 |
| 2층 아키텍처 | 구조(메타데이터, 태그) → 기계 파싱 / 내용(자연어) → 사람이 읽고 AI가 추론 |

### 차용한 검증된 패턴

| 출처 | 차용한 패턴 | 구현 |
|------|-----------|------|
| AGENTS.md / CLAUDE.md | Markdown 기반, 스키마 최소화 | `.plan` = 확장된 Markdown |
| Gherkin (BDD) | Given-When-Then 키워드 접두 | 수용 기준 + 엣지 케이스 기술 |
| EARS (Rolls-Royce) | 키워드 제약 자연어 | 12개 핵심 키워드 시스템 |
| RFC 2119 | MUST/SHOULD/MAY 의무 수준 | `Then:` 절의 `[MUST/SHOULD/MAY]` |
| Cursor MDC | YAML 프론트매터 메타데이터 | 파일 최상단 프론트매터 |
| CrewAI | 타입 태스크 스키마 | Task 블록 + JSON Schema 변환 |
| HCL | 이중 표현 (사람 + 기계) | Markdown 호환 + 구조적 파싱 |

## 시작하기

```bash
npm install
```

## 문서

| 문서 | 설명 |
|------|------|
| [소개](./docs/01-introduction.md) | Plan Language란 무엇인가 — 동기, 철학, 비교 |
| [빠른 시작](./docs/02-quick-start.md) | 5분 안에 첫 .plan 파일 작성하기 |
| [핵심 개념](./docs/03-core-concepts.md) | 계층, 상태 모델, 불확실성, 의존성, 참조 |
| [키워드 레퍼런스](./docs/04-keywords-reference.md) | 12개 키워드 완전 가이드 |
| [도구 활용](./docs/05-tooling.md) | CLI, VS Code 확장, 린트 규칙 상세 |
| [프로젝트 관리](./docs/06-project-management.md) | 다중 파일 프로젝트, 교차 파일 검증 |
| [API 레퍼런스](./docs/07-api-reference.md) | 프로그래밍 API 레퍼런스 |

문법 전체 명세는 [GRAMMAR.md](./examples/files/GRAMMAR.md), 예제 `.plan` 파일은 [examples/files/](./examples/files/) 디렉토리를 참고한다.

## 라이선스

MIT
