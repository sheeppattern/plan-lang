# 기획 언어 문법 명세 v0.1 (프로토타입)

> 이 문서는 AI 기반 개발 프로세스를 위한 구조화된 기획 언어의 문법을 정의한다.
> 언어 이름과 파일 확장자는 미정이며, 본 문서에서는 임시로 `.plan` 확장자를 사용한다.

---

## 1. 설계 원칙

이 언어는 다음 원칙에 따라 설계되었다:

1. **Markdown 호환** — `.plan` 파일은 일반 Markdown 뷰어에서도 읽을 수 있어야 한다 (graceful degradation)
2. **2층 아키텍처** — 구조 레이어(메타데이터, 태그, 타입)는 기계가 파싱하고, 내용 레이어(자연어)는 사람이 읽고 AI가 추론한다
3. **키워드 접두 자연어** — Gherkin/EARS에서 검증된 패턴. 줄 시작의 키워드로 의미를 구분하되, 나머지는 자연어
4. **선언적** — "무엇을, 왜"를 기술한다. "어떻게 구현"은 기술하지 않는다
5. **최소 구성 요소** — 핵심 키워드 12개로 시작. 기능 확대에 저항한다

---

## 2. 문서 구조

모든 `.plan` 파일은 세 부분으로 구성된다:

```
┌─────────────────────────┐
│  YAML 프론트매터          │  ← 기계 파싱용 메타데이터
│  (---로 감싼 영역)        │
├─────────────────────────┤
│  헤더 블록               │  ← feature/story/task 선언
│  (키워드 접두 라인)       │
├─────────────────────────┤
│  본문 블록               │  ← 상세 명세 (시맨틱 섹션)
│  (Markdown + 키워드)     │
└─────────────────────────┘
```

---

## 3. YAML 프론트매터

파일 최상단에 `---`로 감싼 YAML 블록. 기계가 파싱하는 메타데이터를 담는다.

```yaml
---
type: feature                    # 필수. feature | story | task
id: feat-social-login            # 필수. 고유 식별자 (kebab-case)
status: draft                    # 필수. 아래 상태 모델 참조
version: 0.1.0                   # 선택. SemVer
owner: @max                      # 선택. 담당자 참조
priority: high                   # 선택. urgent | high | normal | low
tags: [auth, onboarding, mvp]    # 선택. 자유 태그
created: 2026-02-18              # 선택. ISO 8601
updated: 2026-02-18              # 선택. ISO 8601
---
```

### 3.1 상태 모델 (Status Model)

상태는 선형 진행이 아닌 상태 머신으로 정의된다:

```
draft ──→ ready ──→ in_progress ──→ done
  │         │            │
  │         │            ▼
  │         │        blocked ──→ in_progress
  │         │
  ▼         ▼
deprecated  deprecated
```

| 상태 | 의미 | 전이 가능 상태 |
|------|------|---------------|
| `draft` | 작성 중, 아직 합의되지 않음 | ready, deprecated |
| `ready` | 합의 완료, 구현 대기 | in_progress, deprecated |
| `in_progress` | 구현 중 | done, blocked |
| `blocked` | 외부 의존성으로 중단 | in_progress |
| `done` | 완료, 수용 기준 충족 | — |
| `deprecated` | 더 이상 유효하지 않음 | — |

---

## 4. 계층 구조 (Hierarchy)

기획의 3단 계층: **Feature → Story → Task**

```
feature (기능)
  ├── story (사용자 스토리)
  │     ├── task (구현 태스크)
  │     └── task
  ├── story
  │     └── task
  └── story
```

### 4.1 Feature (기능)

가장 상위 단위. 사용자에게 제공되는 하나의 기능 영역을 정의한다.

**선언 문법:**
```markdown
# Feature: <기능 이름>
```

**구성 요소:**
- 목표(goal), 대상(persona), 성공 지표(metric)를 포함
- 하위에 1개 이상의 Story를 가짐
- 다른 Feature와의 의존성을 선언할 수 있음

### 4.2 Story (사용자 스토리)

Feature 하위의 사용자 관점 시나리오. 하나의 완결된 사용자 행동 흐름을 기술한다.

**선언 문법:**
```markdown
## Story: <스토리 이름>
```

**구성 요소:**
- 수용 기준(acceptance), 엣지 케이스(edge_case)를 포함
- 하위에 0개 이상의 Task를 가짐

### 4.3 Task (구현 태스크)

Story 하위의 구현 단위. AI 에이전트 또는 개발자에게 위임 가능한 단위.

**선언 문법:**
```markdown
### Task: <태스크 이름>
```

**구성 요소:**
- 담당(assign), 예상 결과(expected_output), 검증 조건(verify)을 포함
- AI ↔ AI 위임 시 JSON Schema 호환 구조로 변환 가능해야 함

---

## 5. 핵심 키워드 (12개)

줄 시작에 오는 키워드로 의미를 구분한다. 키워드 뒤에는 콜론(`:`)과 자연어가 온다.

### 5.1 의도 키워드 (Intent Keywords)

기획의 "왜"를 표현한다.

| 키워드 | 역할 | 사용 위치 |
|--------|------|----------|
| `Goal:` | 이 기능/스토리가 달성하려는 목표 | Feature, Story |
| `Persona:` | 대상 사용자 또는 행위자 (@참조 가능) | Feature, Story |
| `Metric:` | 정량적 성공 지표 (측정 가능해야 함) | Feature |

**예시:**
```markdown
Goal: 신규 유저의 가입 전환율을 높인다
Persona: @new_user — 앱을 처음 설치한 사용자
Metric: signup_conversion_rate > 40%
```

### 5.2 행동 키워드 (Behavior Keywords)

Gherkin의 Given-When-Then 패턴을 차용. 수용 기준과 엣지 케이스를 기술한다.

| 키워드 | 역할 |
|--------|------|
| `Given:` | 전제 조건 (사전 상태) |
| `When:` | 트리거 행동 (사용자 또는 시스템 액션) |
| `Then:` | 기대 결과 (검증 가능한 사후 상태) |

**예시:**
```markdown
Given: @new_user가 가입 화면에 도달한 상태
When: "Google로 계속하기" 버튼을 탭
Then: Google OAuth 인증 후 홈 화면으로 이동
```

**RFC 2119 의무 수준과의 결합:**

`Then:` 절에서 의무 수준을 대문자 키워드로 표현한다:

```markdown
Then: 시스템은 모든 필수 필드를 검증해야 한다 [MUST]
Then: 로딩 인디케이터를 표시하는 것이 권장된다 [SHOULD]
Then: 이전 입력값을 자동 완성할 수 있다 [MAY]
```

| 수준 | 의미 | 구현 의무 |
|------|------|----------|
| `[MUST]` | 필수. 미충족 시 수용 기준 실패 | 반드시 구현 |
| `[SHOULD]` | 권장. 합리적 이유가 있으면 생략 가능 | 가능하면 구현 |
| `[MAY]` | 선택. 구현 여부가 자유 | 선택적 구현 |

### 5.3 의존성 키워드 (Dependency Keywords)

기획 요소 간의 관계를 선언한다.

| 키워드 | 역할 | 방향 |
|--------|------|------|
| `Needs:` | 이것이 시작되려면 필요한 것 | 선행 조건 |
| `Blocks:` | 이것이 완료되어야 시작 가능한 것 | 후행 영향 |

**예시:**
```markdown
Needs: [feat-email-auth] 이메일 인증 리팩토링 완료
Needs: [external] OAuth 클라이언트 ID 발급 (Google Cloud Console)
Blocks: [feat-account-linking] 계정 연동 기능
```

**참조 문법:**
- `[id]` — 같은 프로젝트 내 다른 `.plan` 파일의 id 참조
- `[external]` — 외부 의존성 (시스템 밖, 추적만 함)

### 5.4 태스크 키워드 (Task Keywords)

AI 에이전트 위임과 검증을 위한 키워드.

| 키워드 | 역할 | 사용 위치 |
|--------|------|----------|
| `Assign:` | 담당자 또는 에이전트 | Task |
| `Verify:` | 완료 확인 조건 (기계 검증 가능) | Task |

**예시:**
```markdown
### Task: OAuth 콜백 핸들러 구현

Assign: @backend-agent
Verify: `npm test -- --grep "oauth callback"` 전체 통과
Verify: Google OAuth 토큰 교환 성공 시 JWT 발급 확인
```

---

## 6. 불확실성 시스템 (Uncertainty System)

기획에서 "아직 모르는 것"을 포맷의 1급 시민으로 다룬다.

### 6.1 불확실성 마커 (Uncertainty Markers)

`?` 접두사 + 유형으로 불확실성을 표시한다. 어떤 키워드 값 뒤에든 붙을 수 있다.

| 마커 | 의미 | 해소 시점 |
|------|------|----------|
| `?pending` | 미정. 결정 대기 중 | 외부 입력 필요 |
| `?assumption` | 가정. 검증 필요 | 검증 전까지 유효 |
| `?alternative` | 대안 존재. 선택 필요 | 의사결정 전까지 |
| `?risk` | 위험 요소. 모니터링 필요 | 리스크 해소 시까지 |

### 6.2 문법

불확실성 마커는 두 가지 형태로 사용한다:

**인라인 형태** — 특정 값이 불확실할 때:
```markdown
Then: PG사를 통해 결제를 처리한다 ?pending("PG사 선정 미완료")
Metric: 결제 성공률 > ?assumption("95% — 업계 평균 기반 가정")
```

**블록 형태** — 전체 섹션이 불확실할 때:
```markdown
?pending "결제 수단 추가 — 비즈니스팀 확인 필요"
  Given: 사용자가 결제 화면에 도달
  When: 새 카드를 등록
  Then: (미정)
?end
```

### 6.3 불확실성 집계

파서 또는 린터는 파일 내 불확실성 마커를 집계하여 보고할 수 있다:

```
[UNCERTAINTY REPORT] feat-payment.plan
  ?pending:     3개 (결정 대기)
  ?assumption:  2개 (검증 필요)
  ?risk:        1개 (모니터링)
  ────────────────────────
  Status: draft → ready 전환에 3개 ?pending 해소 필요
```

**상태 전이 규칙:**
- `?pending`이 1개 이상 → `draft`에서 `ready`로 전이 불가
- `?assumption`은 경고만 (전이 차단하지 않음)
- `?risk`는 정보 제공만

---

## 7. 엣지 케이스 (Edge Cases)

Story 내에서 `Edge:` 키워드로 예외 시나리오를 선언한다.

```markdown
Edge: "Google 계정에 이메일이 없는 경우"
  When: OAuth 응답에 email 필드가 비어있음
  Then: 이메일 입력 폼을 추가로 표시 [MUST]

Edge: "이미 같은 이메일로 가입된 계정이 존재하는 경우"
  When: 반환된 이메일이 기존 계정과 일치
  Then: 계정 연동 확인 모달을 표시 [MUST]
  Then: 기존 계정 데이터 손실 없음 [MUST]
```

---

## 8. 참조 시스템 (Reference System)

### 8.1 @ 참조 (Actor Reference)

사람, 팀, AI 에이전트를 참조한다.

```markdown
@max              — 특정 사람
@backend-team     — 팀
@frontend-agent   — AI 에이전트
@new_user         — 페르소나 (Persona에서 정의)
```

### 8.2 [] 참조 (Plan Reference)

다른 `.plan` 파일 또는 외부 리소스를 참조한다.

```markdown
[feat-social-login]      — 같은 프로젝트의 다른 plan 파일 (id로 매칭)
[feat-auth#story-google] — 특정 plan 파일의 특정 story
[external]               — 외부 의존성 (시스템 밖)
[doc:api-design]         — 관련 문서 참조 (비의존성)
```

---

## 9. 주석과 메타 지시 (Comments & Directives)

### 9.1 주석

Markdown 주석과 동일:
```markdown
<!-- 이것은 파서가 무시하는 주석입니다 -->
```

### 9.2 린터 지시

특정 규칙을 억제하거나 활성화:
```markdown
<!-- @lint-disable uncertainty-check -->
Then: 어떤 미정 사항
<!-- @lint-enable uncertainty-check -->
```

---

## 10. Markdown 호환성 규칙

`.plan` 파일은 일반 Markdown으로도 읽힐 수 있어야 한다. 이를 위한 규칙:

1. **YAML 프론트매터** — GitHub, Notion 등 대부분의 Markdown 뷰어가 이미 지원
2. **# 계층** — Feature(#), Story(##), Task(###)는 표준 Markdown 헤딩
3. **키워드 라인** — `Goal:`, `When:` 등은 일반 Markdown에서 볼드 또는 일반 텍스트로 렌더링
4. **불확실성 마커** — `?pending(...)` 등은 일반 텍스트로 표시됨 (정보 손실 없음)
5. **참조** — `@name`, `[id]`는 Markdown에서 각각 일반 텍스트, 링크로 렌더링

**결과:** DSL을 이해하지 못하는 도구에서도 문서로서의 가독성은 유지된다.

---

## 11. 키워드 요약 (Quick Reference)

| # | 키워드 | 카테고리 | 필수 여부 | 위치 |
|---|--------|----------|----------|------|
| 1 | `Goal:` | 의도 | Feature 필수 | Feature, Story |
| 2 | `Persona:` | 의도 | 선택 | Feature, Story |
| 3 | `Metric:` | 의도 | 선택 | Feature |
| 4 | `Given:` | 행동 | 선택 | Story, Edge |
| 5 | `When:` | 행동 | Story 필수 | Story, Edge |
| 6 | `Then:` | 행동 | Story 필수 | Story, Edge |
| 7 | `Needs:` | 의존성 | 선택 | Feature, Story, Task |
| 8 | `Blocks:` | 의존성 | 선택 | Feature, Story, Task |
| 9 | `Edge:` | 시나리오 | 선택 | Story |
| 10 | `Assign:` | 태스크 | Task 필수 | Task |
| 11 | `Verify:` | 태스크 | Task 권장 | Task |
| 12 | `?marker` | 불확실성 | 선택 | 어디서든 |

부가 수식자:
- `[MUST]`, `[SHOULD]`, `[MAY]` — RFC 2119 의무 수준 (Then: 절에서 사용)
- `@ref` — 사람/에이전트/페르소나 참조
- `[id]` — plan 파일 간 교차 참조

---

## 12. JSON Schema 변환 (AI ↔ AI 호환)

`.plan` 파일의 Task 블록은 다음 JSON Schema로 변환 가능해야 한다.
이는 CrewAI, A2A 등 에이전트 프로토콜과의 호환을 위한 것이다.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "type": { "const": "task" },
    "title": { "type": "string" },
    "description": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["draft", "ready", "in_progress", "blocked", "done", "deprecated"]
    },
    "assign": { "type": "string" },
    "parent_story": { "type": "string" },
    "needs": {
      "type": "array",
      "items": { "type": "string" }
    },
    "blocks": {
      "type": "array",
      "items": { "type": "string" }
    },
    "verify": {
      "type": "array",
      "items": { "type": "string" }
    },
    "expected_output": { "type": "string" },
    "uncertainty": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "marker": { "type": "string", "enum": ["pending", "assumption", "alternative", "risk"] },
          "message": { "type": "string" },
          "target": { "type": "string" }
        }
      }
    }
  },
  "required": ["id", "type", "title", "status", "assign"]
}
```

---

## 부록 A: EBNF 요약 문법

```ebnf
plan_file     = frontmatter, feature_block ;
frontmatter   = "---\n", yaml_content, "---\n" ;

feature_block = "# Feature: ", text, "\n",
                { intent_line | dependency_line | story_block | comment } ;

story_block   = "## Story: ", text, "\n",
                { intent_line | behavior_line | edge_block | task_block
                  | dependency_line | comment } ;

task_block    = "### Task: ", text, "\n",
                { task_line | dependency_line | comment } ;

edge_block    = "Edge: ", quoted_text, "\n",
                { behavior_line } ;

intent_line   = ("Goal:" | "Persona:" | "Metric:"), " ", text, [ uncertainty ], "\n" ;
behavior_line = ("Given:" | "When:" | "Then:"), " ", text, [ obligation ], [ uncertainty ], "\n" ;
dependency_line = ("Needs:" | "Blocks:"), " ", reference, " ", text, "\n" ;
task_line     = ("Assign:" | "Verify:"), " ", text, "\n" ;

obligation    = " [MUST]" | " [SHOULD]" | " [MAY]" ;
uncertainty   = " ?", marker_type, '("', text, '")' ;
marker_type   = "pending" | "assumption" | "alternative" | "risk" ;

reference     = "[", id, "]" | "[external]" | "[doc:", id, "]" ;
actor_ref     = "@", identifier ;

text          = { any_character - "\n" } ;
quoted_text   = '"', { any_character - '"' }, '"' ;
id            = letter, { letter | digit | "-" } ;
identifier    = letter, { letter | digit | "_" | "-" } ;
comment       = "<!--", text, "-->" ;
```

---

## 부록 B: 검증 규칙 (Lint Rules)

파서/린터가 검사해야 할 규칙:

| 규칙 ID | 심각도 | 설명 |
|---------|--------|------|
| `PLAN-001` | error | Feature에 `Goal:`이 없음 |
| `PLAN-002` | error | Story에 `When:` 또는 `Then:`이 없음 |
| `PLAN-003` | error | Task에 `Assign:`이 없음 |
| `PLAN-004` | error | `status: ready`인데 `?pending` 마커가 존재 |
| `PLAN-005` | warn | Story에 `Edge:`가 하나도 없음 |
| `PLAN-006` | warn | `Then:`에 `[MUST/SHOULD/MAY]`가 없음 |
| `PLAN-007` | warn | `?assumption` 마커가 30일 이상 해소되지 않음 |
| `PLAN-008` | info | `Blocks:`로 참조된 파일이 아직 `draft` 상태 |
| `PLAN-009` | error | `Needs:`로 참조된 ID가 프로젝트 내에 존재하지 않음 |
| `PLAN-010` | warn | Feature에 `Metric:`이 없음 |

---

*이 문법 명세는 v0.1 프로토타입이며, 실제 사용 피드백을 통해 발전시킬 것이다.*
