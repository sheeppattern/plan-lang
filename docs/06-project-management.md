# 대규모 프로젝트 관리

단일 `.plan` 파일로는 작은 기능만 다룰 수 있다. 실제 프로젝트에서는 여러 `.plan` 파일이 서로 참조하며 의존성 네트워크를 형성한다. 이 문서에서는 그 관리법을 다룬다.

## 프로젝트 구성

### 디렉토리 구조

`.plan` 파일을 한 디렉토리에 모아 프로젝트로 관리한다.

```
plans/
├── project-index.plan       ← 프로젝트 전체 인덱스 (선택)
├── feat-email-auth.plan     ← Feature별 파일
├── feat-social-login.plan
├── feat-payment.plan
└── feat-account-linking.plan
```

각 `.plan` 파일은 프론트매터의 `id` 필드로 고유하게 식별된다:

```yaml
---
type: feature
id: feat-social-login    ← 이 ID로 다른 파일에서 참조
status: draft
---
```

### 프로젝트 인덱스 파일

프로젝트 전체를 조망하는 인덱스 파일을 만들 수 있다. 필수는 아니지만, 의존성 그래프와 전체 상태를 한눈에 볼 수 있어 유용하다.

```markdown
---
type: feature
id: index
status: in_progress
owner: @max
tags: [project-overview]
---

# Feature: 프로젝트 의존성 맵

Goal: 모든 기획 문서 간의 관계를 한눈에 파악한다
```

Mermaid 다이어그램으로 의존성 그래프를 시각화할 수도 있다 (Markdown 호환이므로 GitHub에서 렌더링된다).

## 교차 파일 참조

### Needs와 Blocks로 파일 간 연결

`.plan` 파일들은 `Needs:`와 `Blocks:`로 서로 연결된다:

```markdown
# feat-social-login.plan
Needs: [feat-email-auth] 이메일 인증 시스템 리팩토링 완료
Blocks: [feat-account-linking] 계정 연동 기능
```

```markdown
# feat-email-auth.plan
Blocks: [feat-social-login] 소셜 로그인
Blocks: [feat-account-linking] 계정 연동
```

이런 참조를 통해 의존성 체인이 형성된다:

```
feat-email-auth → feat-social-login → feat-account-linking
```

### 파일 내 특정 요소 참조

`[id#fragment]` 형식으로 특정 파일의 특정 Story나 Task를 참조할 수 있다:

```markdown
Needs: [feat-payment#task-pg-api] PG사 API 연동 완료
Needs: [feat-social-login#task-oauth-callback] OAuth 핸들러 완성
```

### 외부 의존성 추적

시스템 밖의 의존성은 `[external]`로 표시한다:

```markdown
Needs: [external] Google OAuth 클라이언트 ID 발급
Needs: [external] PG사 계약 체결
Needs: [external] PG사 테스트 환경 접근 권한
```

외부 의존성은 자동 검증 대상이 아니지만, 명시적으로 추적할 수 있다.

## 교차 파일 린트

### lint-project 사용

`lint-project` 명령은 디렉토리 내 모든 `.plan` 파일을 한번에 검사하고, **교차 파일 규칙**도 적용한다.

```bash
npx tsx bin/plan.ts lint-project ./plans/
```

### 교차 파일 규칙

단일 파일 린트(`lint`)와 달리, `lint-project`에서만 동작하는 규칙이 있다:

**PLAN-009: Needs 참조 대상이 존재하지 않음**

```markdown
# feat-social-login.plan
Needs: [feat-nonexistent] ← 이 ID를 가진 .plan 파일이 없다!
```

`[external]`이나 `[doc:...]` 참조는 이 검사에서 제외된다.

**PLAN-008: Blocks 참조 대상이 draft 상태**

```markdown
# feat-email-auth.plan (status: in_progress)
Blocks: [feat-social-login]

# feat-social-login.plan (status: draft)
# → PLAN-008 info: Blocks 대상이 아직 draft 상태
```

이 규칙은 info 수준이다. "블록하고 있는 기능이 아직 기획 초안 단계"라는 정보를 제공한다.

## 불확실성 리포트 활용

### 프로젝트 전체 불확실성 추적

여러 파일의 불확실성을 한번에 확인할 수 있다:

```bash
npx tsx bin/plan.ts uncertainty plans/*.plan
```

출력 예시:

```
[UNCERTAINTY REPORT] feat-social-login.plan
  ?pending:     1개 (결정 대기)
  ?assumption:  2개 (검증 필요)

[UNCERTAINTY REPORT] feat-payment.plan
  ?pending:     3개 (결정 대기)
  ?assumption:  2개 (검증 필요)
  ?alternative: 1개 (선택 대기)
  ?risk:        1개 (모니터링)

[UNCERTAINTY REPORT] feat-email-auth.plan
  ?pending:     0개
  ?assumption:  0개
```

### 불확실성 해소 우선순위

`?pending`이 가장 중요하다. `?pending`이 남아 있으면 `draft → ready` 전이가 불가능하기 때문이다.

해소 우선순위:
1. **`?pending`** — 결정을 확정하여 해소 (예: PG사 선정)
2. **`?assumption`** — 가정을 검증하여 확정 또는 수정
3. **`?alternative`** — 대안 중 하나를 선택
4. **`?risk`** — 위험 요소 모니터링 계획 수립

## 상태 모델을 활용한 워크플로우

### 기획 워크플로우

```
1. 기획 작성 (draft)
   └── ?pending, ?assumption 등 불확실성을 명시적으로 표기

2. 불확실성 해소
   └── ?pending 모두 해소 → status: ready로 전이 가능

3. 구현 시작 (ready → in_progress)
   └── Task의 Assign으로 담당자 배정

4. 외부 의존성 대기 (in_progress → blocked)
   └── Needs의 선행 조건이 미충족

5. 완료 (in_progress → done)
   └── 모든 Verify 조건 충족
```

### 상태별 액션

| 현재 상태 | 필요한 액션 |
|-----------|------------|
| `draft` | 불확실성 해소, 팀 리뷰 |
| `ready` | 담당자 배정, 구현 시작 |
| `in_progress` | 개발, 테스트, Verify 확인 |
| `blocked` | 외부 의존성 추적, 대안 검토 |
| `done` | 다음 단계 Feature의 Needs 충족 확인 |
| `deprecated` | 관련 참조 정리 |

## 팀/AI 에이전트 협업 패턴

### 사람 → AI 에이전트 위임

Task의 `Assign:`으로 AI 에이전트에게 작업을 위임한다:

```markdown
### Task: OAuth 콜백 핸들러 구현

Assign: @backend-agent
Verify: `npm test -- --grep "oauth callback"` 전체 통과
Verify: Google OAuth 토큰 교환 성공 시 JWT 발급 확인
```

AI 에이전트는 `Verify:` 조건을 읽고 자동 검증할 수 있다.

### AI ↔ AI 위임

Task 블록은 JSON Schema로 변환하여 에이전트 간 전달할 수 있다. CrewAI, A2A 등 에이전트 프로토콜과 호환된다.

### 의존성 기반 작업 순서

Needs/Blocks 관계를 통해 작업 순서를 자동으로 결정할 수 있다:

```
feat-email-auth (in_progress)
  → feat-social-login (draft, Needs: [feat-email-auth])
    → feat-account-linking (미생성, Needs: [feat-social-login])
```

feat-email-auth가 done이 되어야 feat-social-login이 시작 가능하다.

## 대규모 프로젝트 팁

### 1. 파일 단위를 Feature로 맞추기

하나의 `.plan` 파일에 하나의 Feature를 담는 것이 권장된다. Feature 아래 여러 Story와 Task를 포함할 수 있다.

### 2. 인덱스 파일로 전체 조망

프로젝트 루트에 인덱스 `.plan` 파일을 두면 의존성 관계와 전체 상태를 한눈에 볼 수 있다.

### 3. 외부 의존성을 명시적으로 추적

`[external]` 참조로 시스템 밖 의존성을 추적한다. 프로젝트 인덱스에 외부 의존성 테이블을 만들면 더 관리하기 쉽다.

### 4. 정기적으로 불확실성 리포트 확인

```bash
npx tsx bin/plan.ts uncertainty plans/*.plan
```

`?pending` 카운트가 줄어드는 것이 기획 진행의 지표다.

### 5. lint-project를 CI에 통합

교차 파일 린트를 CI 파이프라인에 넣으면, 참조 깨짐이나 상태 불일치를 자동으로 감지할 수 있다.

---

## 다음 단계

- [API 레퍼런스](./07-api-reference.md)에서 프로그래밍 API를 활용하여 `.plan` 파일을 자동 처리하는 법을 확인하자
