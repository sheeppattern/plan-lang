# CLI와 VS Code 확장 활용

Plan Language는 `.plan` 파일을 자동으로 검증하고 편집을 지원하는 도구 체인을 제공한다.

## CLI

CLI는 `.plan` 파일의 파싱, 린트, 불확실성 리포트를 제공한다.

### parse — 파싱 및 AST 출력

`.plan` 파일을 파싱하여 AST(추상 구문 트리)를 출력한다.

```bash
# 텍스트 형식 (기본)
npx tsx bin/plan.ts parse feat-social-login.plan

# JSON 형식
npx tsx bin/plan.ts parse feat-social-login.plan --format json
```

파싱 결과로 파일의 구조를 확인할 수 있다: 프론트매터, Feature, Story, Task, Edge, 불확실성 마커 등.

### lint — 단일 파일 린트

하나 이상의 `.plan` 파일에 대해 문법 규칙을 검사한다.

```bash
# 기본 사용
npx tsx bin/plan.ts lint feat-social-login.plan

# 여러 파일 동시 검사
npx tsx bin/plan.ts lint feat-social-login.plan feat-payment.plan

# JSON 형식 출력
npx tsx bin/plan.ts lint feat-social-login.plan --format json
```

**옵션:**

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--format <text\|json>` | 출력 형식 | `text` |
| `--quiet` | 문제가 없으면 출력 생략 | - |
| `--disable <rules...>` | 특정 규칙 비활성화 | - |
| `--severity <level>` | 최소 심각도 필터 (`error`, `warning`, `info`) | `info` |

**예시:**

```bash
# PLAN-005, PLAN-006 규칙 비활성화
npx tsx bin/plan.ts lint my.plan --disable PLAN-005 PLAN-006

# error만 출력
npx tsx bin/plan.ts lint my.plan --severity error

# 문제가 없으면 아무것도 출력하지 않음
npx tsx bin/plan.ts lint my.plan --quiet
```

### lint-project — 프로젝트 전체 린트

디렉토리 내 모든 `.plan` 파일을 검사한다. **교차 파일 규칙**(PLAN-008, PLAN-009)도 포함된다.

```bash
npx tsx bin/plan.ts lint-project ./plans/
```

교차 파일 규칙은 다음을 검사한다:
- `Needs:`로 참조된 ID가 프로젝트 내에 실제로 존재하는지 (PLAN-009)
- `Blocks:`로 참조된 파일이 아직 `draft` 상태인지 (PLAN-008)

`lint`(단일 파일)로는 이런 교차 검증이 불가능하므로, 프로젝트 규모가 커지면 `lint-project`를 사용해야 한다.

### uncertainty — 불확실성 리포트

`.plan` 파일의 불확실성 마커를 집계하여 리포트로 출력한다.

```bash
# 단일 파일
npx tsx bin/plan.ts uncertainty feat-payment.plan

# 여러 파일
npx tsx bin/plan.ts uncertainty feat-social-login.plan feat-payment.plan

# JSON 형식
npx tsx bin/plan.ts uncertainty feat-payment.plan --format json
```

출력 예시:

```
[UNCERTAINTY REPORT] feat-payment.plan
  ?pending:     3개 (결정 대기)
  ?assumption:  2개 (검증 필요)
  ?alternative: 1개 (선택 대기)
  ?risk:        1개 (모니터링)
  ────────────────────────
  Status: draft → ready 전환에 3개 ?pending 해소 필요
```

---

## 린트 규칙 상세

### PLAN-001: Feature에 Goal이 없음

| 항목 | 내용 |
|------|------|
| 심각도 | error |
| 설명 | Feature 블록에 `Goal:` 줄이 없다 |

**발생 예:**
```markdown
# Feature: 소셜 로그인
Persona: @new_user
Metric: signup_conversion_rate > 40%
# ← Goal:이 없음!
```

**해결법:** Feature에 `Goal:` 줄을 추가한다.
```markdown
Goal: 신규 유저의 가입 허들을 낮춰 가입 전환율을 높인다
```

### PLAN-002: Story에 When 또는 Then이 없음

| 항목 | 내용 |
|------|------|
| 심각도 | error |
| 설명 | Story 블록에 `When:` 또는 `Then:` 줄이 없다 |

**발생 예:**
```markdown
## Story: 로그인

Given: 사용자가 로그인 화면에 있다
# ← When:과 Then:이 없음!
```

**해결법:** Story에 `When:`과 `Then:`을 추가한다.
```markdown
When: "로그인" 버튼을 탭
Then: 홈 화면으로 이동 [MUST]
```

### PLAN-003: Task에 Assign이 없음

| 항목 | 내용 |
|------|------|
| 심각도 | error |
| 설명 | Task 블록에 `Assign:` 줄이 없다 |

**발생 예:**
```markdown
### Task: OAuth 핸들러 구현
Verify: 테스트 통과
# ← Assign:이 없음!
```

**해결법:** Task에 `Assign:` 줄을 추가한다.
```markdown
Assign: @backend-agent
```

### PLAN-004: status: ready인데 ?pending이 존재

| 항목 | 내용 |
|------|------|
| 심각도 | error |
| 설명 | 프론트매터의 status가 `ready`인데 `?pending` 마커가 파일 내에 존재한다 |

**발생 예:**
```yaml
---
status: ready    # ← ready 상태인데
---
```
```markdown
Then: PG사를 통해 결제 처리 [MUST] ?pending("PG사 미선정")
# ← ?pending이 남아 있음!
```

**해결법:**
- `?pending`을 해소하거나 (결정을 확정)
- `status`를 `draft`로 되돌린다

### PLAN-005: Story에 Edge가 없음

| 항목 | 내용 |
|------|------|
| 심각도 | warning |
| 설명 | Story 블록에 `Edge:` 케이스가 하나도 없다 |

예외 상황을 고려하지 않으면 구현 시 누락이 발생할 수 있다. 의도적으로 Edge가 불필요한 경우 린트 지시자로 억제할 수 있다.

```markdown
<!-- @lint-disable PLAN-005 -->
## Story: 간단한 스토리
When: 사용자가 버튼을 클릭
Then: 결과가 표시됨 [MUST]
<!-- @lint-enable PLAN-005 -->
```

### PLAN-006: Then에 의무 수준이 없음

| 항목 | 내용 |
|------|------|
| 심각도 | warning |
| 설명 | `Then:` 줄에 `[MUST]`, `[SHOULD]`, `[MAY]`가 없다 |

**발생 예:**
```markdown
Then: 홈 화면으로 이동    # ← 의무 수준이 없음
```

**해결법:** Then 끝에 의무 수준을 추가한다.
```markdown
Then: 홈 화면으로 이동 [MUST]
```

### PLAN-007: ?assumption이 30일 이상 미해소

| 항목 | 내용 |
|------|------|
| 심각도 | warning |
| 설명 | `?assumption` 마커가 30일 이상 해소되지 않고 남아 있다 |

프론트매터의 `created` 또는 `updated` 날짜 기준으로 판단한다. 오래된 가정은 검증하거나 확정해야 한다.

### PLAN-008: Blocks 참조 대상이 draft 상태

| 항목 | 내용 |
|------|------|
| 심각도 | info |
| 설명 | `Blocks:`로 참조된 파일이 아직 `draft` 상태다 |

이 규칙은 `lint-project`(교차 파일 린트)에서만 동작한다. 의존성 파일이 draft라면 아직 기획이 합의되지 않았다는 의미이므로 주의가 필요하다.

### PLAN-009: Needs 참조 대상이 존재하지 않음

| 항목 | 내용 |
|------|------|
| 심각도 | error |
| 설명 | `Needs:`로 참조된 ID가 프로젝트 내에 존재하지 않는다 |

이 규칙은 `lint-project`에서만 동작한다. `[external]` 참조는 제외된다.

**발생 예:**
```markdown
Needs: [feat-nonexistent] 존재하지 않는 기능
```

**해결법:** 참조된 ID에 해당하는 `.plan` 파일을 만들거나, 참조를 수정한다.

### PLAN-010: Feature에 Metric이 없음

| 항목 | 내용 |
|------|------|
| 심각도 | warning |
| 설명 | Feature 블록에 `Metric:` 줄이 없다 |

성공 지표 없이는 기능이 잘 동작하는지 측정할 수 없다. 가능하면 정량적 Metric을 추가하자.

---

## 린트 지시자

파일 내에서 특정 구간의 린트 규칙을 비활성화/활성화할 수 있다.

### 사용법

```markdown
<!-- @lint-disable PLAN-005 -->
## Story: Edge가 불필요한 간단한 스토리
When: 사용자가 버튼을 클릭
Then: 결과가 표시됨 [MUST]
<!-- @lint-enable PLAN-005 -->
```

- `<!-- @lint-disable RULE-ID -->` — 이 줄 이후부터 해당 규칙을 비활성화
- `<!-- @lint-enable RULE-ID -->` — 이 줄 이후부터 해당 규칙을 다시 활성화
- 여러 규칙을 동시에 비활성화할 수 있다: `<!-- @lint-disable PLAN-005 PLAN-006 -->`

### CLI에서의 비활성화

특정 규칙을 CLI 수준에서 비활성화할 수도 있다:

```bash
npx tsx bin/plan.ts lint my.plan --disable PLAN-005 PLAN-006
```

---

## VS Code 확장

`packages/vscode/` 디렉토리에 포함된 VS Code 확장은 다음 기능을 제공한다.

### 구문 하이라이팅

TextMate 문법 기반으로 `.plan` 파일의 구문을 색상으로 구분한다:
- 키워드 (`Goal:`, `When:`, `Then:` 등)
- 참조 (`@actor`, `[plan-id]`)
- 불확실성 마커 (`?pending`, `?assumption` 등)
- 의무 수준 (`[MUST]`, `[SHOULD]`, `[MAY]`)
- 프론트매터 (YAML)

### 실시간 린트 진단

파일을 편집하는 동안 린트 규칙 위반을 실시간으로 표시한다. 저장하지 않아도 즉시 피드백을 받을 수 있다.

진단 결과는 VS Code의 Problems 패널에도 표시된다.

### 자동 완성

- **키워드 자동완성**: `G`를 입력하면 `Goal:`, `Given:` 등을 추천
- **참조 자동완성**: `@`를 입력하면 프로젝트 내 액터 목록을 추천
- **프론트매터 자동완성**: `status:` 뒤에 유효한 상태 값을 추천

### 호버 정보

키워드, 의무 수준, 불확실성 마커 위에 마우스를 올리면 설명이 표시된다.

예: `Goal:` 위에 호버하면 "이 기능/스토리가 달성하려는 목표"라는 설명이 나온다.

### 정의로 이동

- `[feat-social-login]` 참조를 Ctrl+클릭하면 해당 `.plan` 파일로 이동
- `@actor` 참조를 Ctrl+클릭하면 해당 `Persona:` 정의로 이동

### 문서 심볼 (아웃라인)

VS Code의 Outline 패널에서 `.plan` 파일의 구조를 트리 형태로 볼 수 있다:
- Feature
  - Story
    - Edge
    - Task

### 코드 접기

Feature, Story, Task, Edge, 불확실성 블록을 접거나 펼칠 수 있다.

### 확장 설정

VS Code 설정에서 다음을 구성할 수 있다:

| 설정 | 설명 | 기본값 |
|------|------|--------|
| `planLanguage.disabledRules` | 비활성화할 린트 규칙 목록 | `[]` |
| `planLanguage.trace.server` | LSP 서버 로그 레벨 | `"off"` |

---

## 다음 단계

- [프로젝트 관리](./06-project-management.md)에서 여러 `.plan` 파일로 대규모 프로젝트를 관리하는 법을 배우자
- [API 레퍼런스](./07-api-reference.md)에서 프로그래밍 API로 `.plan` 파일을 다루는 법을 확인하자
