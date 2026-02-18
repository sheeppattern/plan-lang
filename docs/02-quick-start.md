# 빠른 시작: 5분 안에 첫 .plan 파일 작성하기

## 설치

```bash
# 프로젝트 클론 후 의존성 설치
npm install
```

## 첫 .plan 파일 만들기

`my-first.plan` 파일을 만들어보자. 단계별로 설명한다.

### 1단계: 프론트매터 작성

파일 최상단에 `---`로 감싼 YAML 블록을 작성한다. 이것이 기획의 메타데이터다.

```markdown
---
type: feature
id: feat-dark-mode
status: draft
owner: @design-team
priority: normal
tags: [ui, accessibility]
---
```

각 필드의 의미:

| 필드 | 의미 | 필수 여부 |
|------|------|----------|
| `type` | 문서 유형 (`feature`, `story`, `task`) | 필수 |
| `id` | 고유 식별자 (kebab-case) | 필수 |
| `status` | 현재 상태 (`draft`, `ready`, `in_progress` 등) | 필수 |
| `owner` | 담당자 (`@` 참조) | 선택 |
| `priority` | 우선순위 (`urgent`, `high`, `normal`, `low`) | 선택 |
| `tags` | 자유 태그 목록 | 선택 |

### 2단계: Feature 선언

`#` 헤딩으로 Feature를 선언하고, 목표(Goal)와 성공 지표(Metric)를 적는다.

```markdown
# Feature: 다크 모드

Goal: 어두운 환경에서 눈의 피로를 줄이고 배터리 소모를 절감한다
Persona: @mobile_user — 밤에 앱을 자주 사용하는 모바일 유저
Metric: dark_mode_adoption_rate > 30%
```

- `Goal:` — 이 기능이 왜 필요한지, 무엇을 달성하려는지
- `Persona:` — 누구를 위한 기능인지 (`@` 로 참조)
- `Metric:` — 어떻게 성공을 측정할지 (정량적 지표)

### 3단계: Story 작성

`##` 헤딩으로 Story를 선언한다. Story는 사용자 관점의 시나리오다. Given-When-Then 패턴으로 수용 기준을 적는다.

```markdown
## Story: 다크 모드 토글

Given: @mobile_user가 앱 설정 화면에 있는 상태
When: "다크 모드" 토글을 활성화
Then: 앱 전체 UI가 다크 테마로 전환 [MUST]
Then: 사용자의 테마 설정이 서버에 저장 [SHOULD]
Then: 전환 시 부드러운 애니메이션 적용 [MAY]
```

- `Given:` — 시나리오의 전제 조건
- `When:` — 사용자가 하는 행동 (트리거)
- `Then:` — 기대 결과 + 의무 수준
  - `[MUST]` — 반드시 구현해야 함
  - `[SHOULD]` — 가능하면 구현 권장
  - `[MAY]` — 선택적으로 구현 가능

### 4단계: Edge 케이스 추가

예외 상황도 `Edge:` 키워드로 명시한다.

```markdown
Edge: "시스템 테마가 이미 다크 모드인 경우"
  When: OS 설정이 다크 모드이고 앱의 자동 감지가 활성화
  Then: 앱이 자동으로 다크 테마를 적용 [MUST]
  Then: 토글이 활성화 상태로 표시 [MUST]
```

### 5단계: Task 배정

`###` 헤딩으로 Task를 선언한다. 실제 구현을 누가 하고, 어떻게 검증할지 적는다.

```markdown
### Task: 테마 전환 로직 구현

Assign: @frontend-agent
Verify: 라이트/다크 테마 전환이 300ms 이내에 완료
Verify: 새로고침 후에도 선택한 테마가 유지
```

- `Assign:` — 누가 이 Task를 수행하는지
- `Verify:` — 완료를 어떻게 확인하는지 (기계 검증 가능하면 좋음)

### 완성된 파일

```markdown
---
type: feature
id: feat-dark-mode
status: draft
owner: @design-team
priority: normal
tags: [ui, accessibility]
---

# Feature: 다크 모드

Goal: 어두운 환경에서 눈의 피로를 줄이고 배터리 소모를 절감한다
Persona: @mobile_user — 밤에 앱을 자주 사용하는 모바일 유저
Metric: dark_mode_adoption_rate > 30%

---

## Story: 다크 모드 토글

Given: @mobile_user가 앱 설정 화면에 있는 상태
When: "다크 모드" 토글을 활성화
Then: 앱 전체 UI가 다크 테마로 전환 [MUST]
Then: 사용자의 테마 설정이 서버에 저장 [SHOULD]
Then: 전환 시 부드러운 애니메이션 적용 [MAY]

Edge: "시스템 테마가 이미 다크 모드인 경우"
  When: OS 설정이 다크 모드이고 앱의 자동 감지가 활성화
  Then: 앱이 자동으로 다크 테마를 적용 [MUST]
  Then: 토글이 활성화 상태로 표시 [MUST]

### Task: 테마 전환 로직 구현

Assign: @frontend-agent
Verify: 라이트/다크 테마 전환이 300ms 이내에 완료
Verify: 새로고침 후에도 선택한 테마가 유지
```

## CLI로 검증하기

### 파싱

파일이 올바르게 파싱되는지 확인한다:

```bash
npx tsx bin/plan.ts parse my-first.plan
```

AST(추상 구문 트리)가 출력된다. JSON으로 보려면:

```bash
npx tsx bin/plan.ts parse my-first.plan --format json
```

### 린트

린트를 실행하면 문법 규칙 위반을 찾아준다:

```bash
npx tsx bin/plan.ts lint my-first.plan
```

출력 예시:

```
my-first.plan
  [PLAN-005] warning (line 10): Story에 Edge 케이스가 없습니다
  [PLAN-010] warning (line 3): Feature에 Metric이 없습니다

1 file, 2 warnings, 0 errors
```

JSON 형식으로 보려면:

```bash
npx tsx bin/plan.ts lint my-first.plan --format json
```

특정 규칙을 비활성화하려면:

```bash
npx tsx bin/plan.ts lint my-first.plan --disable PLAN-005
```

### 불확실성 리포트

기획에 남아 있는 불확실성을 리포트로 확인한다:

```bash
npx tsx bin/plan.ts uncertainty my-first.plan
```

## VS Code 확장 설치

`packages/vscode/` 디렉토리에 VS Code 확장이 포함되어 있다. 설치하면:

- **구문 하이라이팅** — 키워드, 참조, 불확실성 마커가 색상으로 구분된다
- **실시간 린트** — 파일 저장 없이도 문제를 즉시 표시한다
- **자동 완성** — `G`를 입력하면 `Goal:`, `Given:` 등 키워드를 추천한다
- **호버 정보** — 키워드 위에 마우스를 올리면 설명이 표시된다
- **정의로 이동** — `[feat-id]`를 Ctrl+클릭하면 해당 파일로 이동한다

## 흔한 실수와 해결법

### 키워드 뒤에 콜론을 빼먹음

```markdown
# 잘못된 예
Goal 가입 전환율을 높인다

# 올바른 예
Goal: 가입 전환율을 높인다
```

키워드 뒤에는 반드시 콜론(`:`)과 공백이 와야 한다.

### Feature에 Goal이 없음

```
[PLAN-001] error: Feature에 Goal:이 없습니다
```

모든 Feature에는 `Goal:`이 필수다. Feature가 왜 필요한지 반드시 명시하자.

### Story에 When/Then이 없음

```
[PLAN-002] error: Story에 When: 또는 Then:이 없습니다
```

Story는 사용자 행동 시나리오다. 최소한 `When:` (사용자가 무엇을 하는지)과 `Then:` (결과가 무엇인지)은 있어야 한다.

### Task에 Assign이 없음

```
[PLAN-003] error: Task에 Assign:이 없습니다
```

Task는 누군가에게 위임되는 단위다. `Assign:`으로 담당자를 반드시 지정하자.

### status: ready인데 ?pending이 남아 있음

```
[PLAN-004] error: status: ready인데 ?pending 마커가 존재합니다
```

`?pending`(미정)이 하나라도 남아 있으면 기획이 아직 준비되지 않은 것이다. 모든 `?pending`을 해소하거나, `status`를 `draft`로 유지하자.

## 다음 단계

- [핵심 개념](./03-core-concepts.md)에서 각 구성 요소를 깊이 이해하자
- [키워드 레퍼런스](./04-keywords-reference.md)에서 12개 키워드의 상세한 사용법을 확인하자
