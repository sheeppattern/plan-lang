# 핵심 개념 완전 이해

이 문서에서는 Plan Language의 모든 핵심 개념을 설명한다. [빠른 시작](./02-quick-start.md)에서 맛본 내용을 여기서 깊이 이해할 수 있다.

## 3단 계층: Feature → Story → Task

Plan Language는 기획을 3단계로 분해한다. Markdown 헤딩 레벨(`#`, `##`, `###`)로 구분한다.

```
# Feature: <기능>        ← 사용자에게 제공되는 기능 영역
  ## Story: <스토리>     ← 사용자 관점의 행동 시나리오
    ### Task: <태스크>   ← 구현 단위 (사람 또는 AI에게 위임)
```

### Feature (기능)

가장 상위 단위. **사용자에게 의미 있는 하나의 기능 영역**을 정의한다.

- 반드시 `Goal:`(목표)을 포함해야 한다
- `Persona:`(대상 사용자)와 `Metric:`(성공 지표)을 포함하는 것이 권장된다
- 하위에 1개 이상의 Story를 가진다
- 다른 Feature와 의존성(`Needs:`, `Blocks:`)을 선언할 수 있다

```markdown
# Feature: 소셜 로그인

Goal: 신규 유저의 가입 허들을 낮춰 가입 전환율을 높인다
Persona: @new_user — 앱을 처음 설치한 사용자
Metric: signup_conversion_rate > 40%
```

### Story (사용자 스토리)

Feature 하위의 단위. **사용자 관점의 완결된 행동 시나리오**를 기술한다.

- 반드시 `When:`(트리거)과 `Then:`(기대 결과)을 포함해야 한다
- Given-When-Then 패턴으로 수용 기준을 명확히 한다
- `Edge:` 케이스로 예외 상황을 다룬다
- 하위에 0개 이상의 Task를 가진다

```markdown
## Story: Google 계정으로 가입

Given: @new_user가 가입 화면에 도달한 상태
When: "Google로 계속하기" 버튼을 탭
Then: Google OAuth 인증 후 홈 화면으로 이동 [MUST]
Then: 프로필에 이메일과 프로필 이미지가 자동 세팅 [SHOULD]
```

### Task (구현 태스크)

Story 하위의 단위. **AI 에이전트나 개발자에게 위임 가능한 구현 단위**다.

- 반드시 `Assign:`(담당자)을 포함해야 한다
- `Verify:`(검증 조건)을 포함하는 것이 권장된다
- AI ↔ AI 위임 시 JSON Schema로 변환할 수 있다

```markdown
### Task: OAuth 콜백 핸들러 구현

Assign: @backend-agent
Verify: `npm test -- --grep "oauth callback"` 전체 통과
Verify: Google OAuth 토큰 교환 성공 시 JWT 발급 확인
```

### 계층 관계 요약

```
feature (# 헤딩)
  ├── intent: Goal, Persona, Metric
  ├── dependencies: Needs, Blocks
  ├── story (## 헤딩)
  │     ├── intent: Goal, Persona
  │     ├── behaviors: Given, When, Then
  │     ├── edge cases: Edge
  │     ├── dependencies: Needs, Blocks
  │     └── task (### 헤딩)
  │           ├── Assign, Verify
  │           └── dependencies: Needs, Blocks
  └── story
        └── ...
```

---

## YAML 프론트매터

모든 `.plan` 파일은 최상단에 `---`로 감싼 YAML 블록을 가진다. 기계가 파싱하는 메타데이터다.

```yaml
---
type: feature
id: feat-social-login
status: draft
version: 0.1.0
owner: @max
priority: high
tags: [auth, onboarding, mvp]
created: 2026-02-18
updated: 2026-02-18
---
```

### 필수 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | `feature` \| `story` \| `task` | 문서 유형 |
| `id` | string (kebab-case) | 프로젝트 내 고유 식별자 |
| `status` | string | 현재 상태 (아래 상태 모델 참조) |

### 선택 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `version` | string (SemVer) | 문서 버전 |
| `owner` | string (`@` 참조) | 담당자 |
| `priority` | `urgent` \| `high` \| `normal` \| `low` | 우선순위 |
| `tags` | string[] | 자유 태그 목록 |
| `created` | string (ISO 8601) | 생성일 |
| `updated` | string (ISO 8601) | 수정일 |

---

## 상태 모델

기획은 선형 진행이 아닌 **상태 머신(state machine)** 으로 관리된다.

```
draft ──→ ready ──→ in_progress ──→ done
  │         │            │
  │         │            ▼
  │         │        blocked ──→ in_progress
  │         │
  ▼         ▼
deprecated  deprecated
```

### 각 상태의 의미

| 상태 | 의미 | 전이 가능 상태 |
|------|------|---------------|
| `draft` | 작성 중, 아직 합의되지 않음 | `ready`, `deprecated` |
| `ready` | 합의 완료, 구현 대기 | `in_progress`, `deprecated` |
| `in_progress` | 구현 중 | `done`, `blocked` |
| `blocked` | 외부 의존성으로 중단 | `in_progress` |
| `done` | 완료, 수용 기준 충족 | — (최종 상태) |
| `deprecated` | 더 이상 유효하지 않음 | — (최종 상태) |

### 핵심 규칙: ?pending → ready 전이 차단

`?pending`(미정) 마커가 하나라도 남아 있으면 `draft`에서 `ready`로 전이할 수 없다.

```yaml
# 이 파일은 status: ready로 변경할 수 없다
# ?pending이 1개 남아 있기 때문
---
type: feature
id: feat-payment
status: draft    # ← ?pending이 있으므로 ready 불가
---
```

이것이 Plan Language의 핵심 메커니즘이다. **"아직 모르는 것이 있으면 준비되지 않은 것"** 이라는 원칙을 기계가 자동으로 검증한다.

---

## 불확실성 시스템

기획에서 "아직 모르는 것"을 4가지 유형으로 분류하고 추적한다.

### 4가지 불확실성 마커

| 마커 | 의미 | 상태 전이 영향 |
|------|------|--------------|
| `?pending` | **미정**. 결정 대기 중 | `draft → ready` 차단 |
| `?assumption` | **가정**. 검증 필요 | 경고만 (차단 안함) |
| `?alternative` | **대안 존재**. 선택 필요 | 경고만 (차단 안함) |
| `?risk` | **위험 요소**. 모니터링 필요 | 정보 제공만 |

### 인라인 형태

특정 값이 불확실할 때, 해당 줄 끝에 마커를 붙인다.

```markdown
Metric: 결제 성공률 > ?assumption("95% — 업계 평균 기반 가정")
Then: PG사를 통해 결제를 처리한다 [MUST] ?pending("PG사 선정 미완료")
Metric: monthly_churn_rate < 5% ?risk("초기 가격 정책이 불안정하여 이탈률 변동 가능")
```

형식: `?유형("설명 메시지")`

### 블록 형태

전체 섹션이 불확실할 때, `?유형 "설명"` ~ `?end`로 감싼다.

```markdown
?pending "Apple Developer 계정의 Sign in with Apple 설정 완료 대기"
  Given: @new_user가 iOS 디바이스에서 가입 화면에 도달한 상태
  When: "Apple로 계속하기" 버튼을 탭
  Then: Apple 인증 후 홈 화면으로 이동 [MUST]
?end
```

```markdown
?alternative "연간 할인율 — 20% vs 30% vs 2개월 무료"
  Given: @paid_user가 월간 구독 중인 상태
  When: "연간 플랜으로 전환" 버튼을 탭
  Then: 잔여 기간을 일할 계산하여 크레딧 적용 [MUST]
?end
```

블록 형태는 "이 시나리오 전체가 아직 확정되지 않았다"는 것을 명시적으로 표현한다.

### 불확실성 리포트

CLI에서 불확실성을 집계하여 리포트로 확인할 수 있다:

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

## 의존성 시스템

기획 요소 간의 선후행 관계를 `Needs:`와 `Blocks:`로 표현한다.

### Needs (선행 조건)

"이것이 시작되려면 필요한 것"을 선언한다.

```markdown
Needs: [feat-email-auth] 이메일 인증 시스템 리팩토링 완료
Needs: [external] Google OAuth 클라이언트 ID 발급
```

### Blocks (후행 영향)

"이것이 완료되어야 시작 가능한 것"을 선언한다.

```markdown
Blocks: [feat-account-linking] 계정 연동 기능
Blocks: [feat-billing-dashboard] 결제 내역 대시보드
```

### Needs와 Blocks의 관계

Needs와 Blocks는 같은 의존성의 양방향 표현이다:

```
A: Needs: [B]    ← A는 B가 필요하다
B: Blocks: [A]   ← B가 완료되어야 A가 시작 가능하다
```

둘 다 적어도 되고, 한쪽만 적어도 된다. 교차 파일 린트(`lint-project`)가 양방향 정합성을 검사한다.

### 참조 유형

| 참조 | 형식 | 의미 |
|------|------|------|
| 프로젝트 내 참조 | `[feat-social-login]` | 같은 프로젝트의 다른 `.plan` 파일 |
| 파일 내 참조 | `[feat-auth#story-google]` | 특정 파일의 특정 Story/Task |
| 외부 의존성 | `[external]` | 시스템 밖의 의존성 (추적만) |
| 문서 참조 | `[doc:api-design]` | 관련 문서 (비의존성) |

---

## 참조 시스템

### @ 참조 (Actor Reference)

사람, 팀, AI 에이전트, 페르소나를 `@`로 참조한다.

```markdown
@max              — 특정 사람
@backend-team     — 팀
@frontend-agent   — AI 에이전트
@new_user         — 페르소나 (Persona:에서 정의)
```

`@` 참조는 `Persona:`, `Assign:`, `Given:` 등 어디서든 사용할 수 있다.

### [] 참조 (Plan Reference)

다른 `.plan` 파일이나 외부 리소스를 `[]`로 참조한다.

```markdown
[feat-social-login]      — 같은 프로젝트의 다른 plan (id로 매칭)
[feat-auth#story-google] — 특정 plan의 특정 story
[external]               — 외부 의존성
[doc:api-design]         — 관련 문서
```

VS Code 확장에서 `[feat-id]`를 Ctrl+클릭하면 해당 파일로 바로 이동할 수 있다.

---

## RFC 2119 의무 수준

`Then:` 절에서 요구사항의 강제성을 `[MUST]`, `[SHOULD]`, `[MAY]`로 명시한다.

```markdown
Then: 시스템은 모든 필수 필드를 검증해야 한다 [MUST]
Then: 로딩 인디케이터를 표시하는 것이 권장된다 [SHOULD]
Then: 이전 입력값을 자동 완성할 수 있다 [MAY]
```

| 수준 | 의미 | 구현 의무 |
|------|------|----------|
| `[MUST]` | 필수 | 미충족 시 수용 기준 실패. 반드시 구현 |
| `[SHOULD]` | 권장 | 합리적 이유가 있으면 생략 가능 |
| `[MAY]` | 선택 | 구현 여부가 자유 |

의무 수준을 명시하면 린트 경고(PLAN-006)가 사라지고, 구현자(개발자/AI)가 우선순위를 판단할 수 있다.

---

## 엣지 케이스

Story 내에서 `Edge:` 키워드로 예외 시나리오를 선언한다.

```markdown
Edge: "이미 같은 이메일로 가입된 계정이 존재하는 경우"
  When: 반환된 이메일이 기존 계정과 일치
  Then: 계정 연동 확인 모달을 표시 [MUST]
  Then: 기존 계정 데이터 손실 없음 [MUST]
```

- `Edge:` 다음에 따옴표로 감싼 설명이 온다
- 들여쓰기한 `When:`, `Then:` 줄로 예외 시나리오의 행동을 기술한다
- `Given:`도 사용할 수 있다
- 하나의 Story에 여러 Edge를 넣을 수 있다

Edge 케이스를 적극적으로 기술하면 구현 시 예외 처리 누락을 방지할 수 있다. Story에 Edge가 없으면 린트 경고(PLAN-005)가 발생한다.

---

## 주석과 린트 지시자

### 주석

Markdown 주석과 동일하다. 파서가 무시한다.

```markdown
<!-- 이것은 주석입니다. 파서에게 영향을 주지 않습니다. -->
```

### 린트 지시자

특정 구간에서 린트 규칙을 비활성화할 수 있다.

```markdown
<!-- @lint-disable PLAN-005 -->
## Story: 간단한 스토리
When: 사용자가 버튼을 클릭
Then: 결과가 표시됨 [MUST]
<!-- @lint-enable PLAN-005 -->
```

`PLAN-005`(Story에 Edge가 없음) 규칙을 이 구간에서만 비활성화한다. 의도적으로 Edge를 생략한 것이라면 이 지시자를 사용한다.

---

## 다음 단계

- [키워드 레퍼런스](./04-keywords-reference.md)에서 12개 키워드의 상세한 문법과 예제를 확인하자
- [도구 활용 가이드](./05-tooling.md)에서 CLI와 VS Code 확장의 모든 기능을 살펴보자
